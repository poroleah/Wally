import { authFetch } from './useFetch'
import analysis from '../../config/analysis.json'
import network from '../../config/network.json'
import { API_ENDPOINTS } from '@/endpoints'
import { STATE_LABELS, isDayHour, readPresetEpochDate } from './analysisConfig'
import { toIsoDate, parseIsoDate } from '@/utils/date'

// 분석 상태 점유율의 데이터 계층 — /summary 소비 (mewly 이식, 화면은 UI
// 단계에서). 해석은 주야 이원 체계다: 주간은 자세 3종의 점유율, 야간은
// IR에서 앉음↔서기 혼동이 있어 누움/비누움 2단계로만 해석하고 "야간
// 뒤척임"(비누움 비율)을 지표로 삼는다. 주야 구분은 로컬 설정
// (analysisConfig.dayRange)이며, 정규화 분모는 라벨이 붙은 표본이다.

export const METRIC_KEYS = ['lying', 'sitting', 'standing', 'restless']

// 백엔드의 간헐 5xx를 흡수하기 위한 짧은 재시도.
const RETRIES = network.summaryRetry.attempts
const RETRY_DELAY_MS = network.summaryRetry.delayMs

async function fetchSummary(dateFrom, dateTo, bucket) {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, bucket })
  let lastError
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await authFetch(`${API_ENDPOINTS.summary}?${params}`)
      if (res.ok) return (await res.json()).buckets || []
      lastError = new Error(`summary ${res.status}`)
      if (res.status < 500) break // 4xx는 재시도 무의미
    } catch (e) {
      lastError = e
    }
    if (attempt < RETRIES) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
  }
  throw lastError
}

function emptyHours() {
  return Array.from({ length: 24 }, () => ({
    total: 0,
    counts: Object.fromEntries(STATE_LABELS.map((l) => [l, 0])),
  }))
}

function accumulate(hours, bucket) {
  const parsed = new Date(bucket.bucket_start)
  if (Number.isNaN(parsed.getTime())) return 0
  const hour = hours[parsed.getHours()]
  hour.total += bucket.total ?? 0
  for (const label of STATE_LABELS) hour.counts[label] += bucket.counts?.[label] ?? 0
  return bucket.total ?? 0
}

// 한 추론이 여러 라벨에 매치될 수 있어 Σcounts는 근사 분모다 — 상태 간
// 상대 분포 목적에는 충분하다.
function segmentCounts(hours, wantDay) {
  const sum = Object.fromEntries(STATE_LABELS.map((l) => [l, 0]))
  for (let h = 0; h < 24; h++) {
    if (isDayHour(h) !== wantDay) continue
    for (const label of STATE_LABELS) sum[label] += hours[h].counts[label]
  }
  return sum
}

// 액토그램용 활동도: 시간대의 비누움 비율. 라벨 표본이 없으면 null.
function hourActivity(h) {
  const denom = STATE_LABELS.reduce((a, l) => a + h.counts[l], 0)
  return denom ? (h.counts.sitting + h.counts.standing) / denom : null
}

// 주간 3종 점유율 + 야간 뒤척임(비누움 비율). 분모 없는 지표는 null로 둔다.
function computeMetrics(hours) {
  const day = segmentCounts(hours, true)
  const night = segmentCounts(hours, false)
  const dayLabeled = STATE_LABELS.reduce((a, l) => a + day[l], 0)
  const nightLabeled = STATE_LABELS.reduce((a, l) => a + night[l], 0)
  return {
    lying: dayLabeled ? day.lying / dayLabeled : null,
    sitting: dayLabeled ? day.sitting / dayLabeled : null,
    standing: dayLabeled ? day.standing / dayLabeled : null,
    restless: nightLabeled ? (night.sitting + night.standing) / nightLabeled : null,
  }
}

// 지정 일자의 집계. 반환: { total, labeled, unlabeled, hours[24], metrics, activity }
export async function fetchDayStates(dateIso) {
  const buckets = await fetchSummary(dateIso, dateIso, 'hour')
  const hours = emptyHours()
  let total = 0
  for (const b of buckets) total += accumulate(hours, b)

  const labeled = hours.reduce(
    (a, h) => a + STATE_LABELS.reduce((s, l) => s + h.counts[l], 0), 0,
  )
  return {
    total,
    labeled,
    unlabeled: total ? Math.max(0, (total - labeled) / total) : 0,
    hours,
    metrics: computeMetrics(hours),
    activity: hours.map(hourActivity), // 액토그램의 오늘 행
  }
}

// ── 기준선: 직전 N일의 지표별 평균·표준편차 ──
// 야간 지표가 필요하므로 bucket=day가 아니라 bucket=hour 범위 질의 1회로
// 받아 날짜별로 재구성한다(14일 = 336버킷). 프리셋 구성 변경일(presetEpoch)
// 이전의 날은 비교 가능성이 없어 제외한다.
export async function fetchBaseline(dateIso, days = analysis.baseline.days) {
  const base = parseIsoDate(dateIso)
  let from = toIsoDate(base, -days)
  const to = toIsoDate(base, -1)
  const epoch = readPresetEpochDate()
  if (epoch && epoch > from) from = epoch

  const empty = { days: 0, n: {}, mean: {}, sd: {}, history: [] }
  if (from > to) return empty
  let buckets
  try {
    buckets = await fetchSummary(from, to, 'hour')
  } catch {
    return empty
  }

  // 날짜별 hours 재구성 (bucket_start는 로컬 시각)
  const byDay = new Map()
  for (const b of buckets) {
    const parsed = new Date(b.bucket_start)
    if (Number.isNaN(parsed.getTime())) continue
    const day = toIsoDate(parsed)
    if (!byDay.has(day)) byDay.set(day, emptyHours())
    accumulate(byDay.get(day), b)
  }

  // 액토그램: 일별 활동 행 (최신일 우선)
  const history = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, hours]) => ({ date, activity: hours.map(hourActivity) }))

  const perDay = [...byDay.values()].map(computeMetrics)
  const n = {}
  const mean = {}
  const sd = {}
  for (const key of METRIC_KEYS) {
    const xs = perDay.map((m) => m[key]).filter((x) => x !== null)
    n[key] = xs.length
    const m = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
    mean[key] = m
    sd[key] = xs.length
      ? Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length)
      : 0
  }
  return { days: Math.max(...Object.values(n), 0), n, mean, sd, history }
}

// ── 리듬 판정 ──
// 지표별 표본 minDays 미만이면 판정하지 않고, 편차 문턱은
// max(thresholdShare, sigmaMultiplier·σ)로 한다.
export const BASELINE_MIN_DAYS = analysis.baseline.minDays

export function judgeRhythm(metrics, baseline) {
  if (!baseline || baseline.days < BASELINE_MIN_DAYS) return null
  const deviations = []
  for (const key of METRIC_KEYS) {
    if (metrics[key] === null || (baseline.n[key] ?? 0) < BASELINE_MIN_DAYS) continue
    const threshold = Math.max(analysis.baseline.thresholdShare, analysis.baseline.sigmaMultiplier * baseline.sd[key])
    const delta = metrics[key] - baseline.mean[key]
    if (Math.abs(delta) > threshold) {
      deviations.push({ label: key, direction: delta > 0 ? 'high' : 'low' })
    }
  }
  return deviations
}

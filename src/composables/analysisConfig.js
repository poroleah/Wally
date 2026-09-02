import { effectScope, watch } from 'vue'
import { persistentRef } from './storage'
import { useRealtimeEvents } from './useRealtimeEvents'
import { useAuth } from './useAuth'
import { authFetch } from './useFetch'
import { toIsoDate } from '@/utils/date'
import { APP_ENDPOINTS } from '@/endpoints'
import analysis from '../../config/analysis.json'

// mewly analysisConfig 이식 — 분석(자세 라벨) 체계의 클라이언트 어휘와
// 해석 파라미터. 백엔드(analyzer)는 이 어휘를 불투명한 태그로만 취급하며
// 부분 문자열 매치를 수행하므로 동의어는 5자 이상의 완전형만 넣는다
// (lie→believe, rest→interesting, sit→situation 오매치 방지).
export const STATE_LABELS = analysis.stateLabels

export const LABEL_GROUPS = analysis.labelGroups

// 검증된 기본 프롬프트 — 프롬프트 보호 장치(UI 단계)의 기준 문안.
export const DAY_PROMPT = analysis.verifiedPrompt

// 프롬프트는 주야간 공통 단일 — 기본 프롬프트(/prompt)를 그대로 쓰므로
// 프리셋 구간은 주입하지 않는다(presets: []).
export function buildLabelsPayload() {
  return { labels: LABEL_GROUPS, presets: [] }
}

// ── 야간 해석 경계 (클라이언트 로컬 설정) ──
// 야간 IR에서는 앉음↔서기 혼동으로 자세 3종 세분의 신뢰도가 낮아
// 누움/비누움 2단계로 해석하며, 이 경계가 그 구분선이다. 경계 변경은
// 해석 방식만 바꾸므로 기준선 단절(epoch) 대상이 아니다.
export const dayRange = persistentRef('anaDayRange', { ...analysis.dayRange })

// start >= end이면 자정을 넘는 주간 구간으로 해석한다.
export function isDayHour(hour, range = dayRange.value) {
  const { start, end } = range
  if (start === end) return true // 방어값 — UI가 동일 시각을 막는다
  return start < end ? hour >= start && hour < end : hour >= start || hour < end
}

// ── 기준선 단절 기록 ──
// 어휘·프롬프트 구성이 바뀌면 과거 기준선과의 비교 가능성이 깨진다.
// 주입 페이로드의 서명으로 변경을 감지하여 적용 일자를 기록하고, 기준선
// 수집 범위를 그 이후로 한정한다.
const EPOCH_KEY = 'wally.presetEpoch'

function signature(payload) {
  const text = JSON.stringify(payload)
  let hash = 5381
  for (let i = 0; i < text.length; i++) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0
  return String(hash)
}

// 서명은 부위별(labels·prompt)로 관리한다 — 기본 프롬프트(/prompt)의 변경도
// 라벨 분포를 바꾸므로 단절 대상이다. 어느 부위든 서명이 바뀌면 갱신한다.
function markConfigApplied(part, payload, dateIso) {
  try {
    const sig = signature(payload)
    const prev = JSON.parse(window.localStorage.getItem(EPOCH_KEY)) || {}
    const sigs = prev.sigs || {}
    if (sigs[part] === sig) return // 동일 구성 재적용은 단절이 아니다
    sigs[part] = sig
    window.localStorage.setItem(EPOCH_KEY, JSON.stringify({ sigs, date: dateIso }))
  } catch {
    // 기록 실패 시 기준선 한정만 잃는다 — 무시.
  }
}

export function markPresetApplied(payload, dateIso) {
  markConfigApplied('labels', payload, dateIso)
}

export function markPromptApplied(promptText, dateIso) {
  markConfigApplied('prompt', promptText, dateIso)
}

export function readPresetEpochDate() {
  try {
    return JSON.parse(window.localStorage.getItem(EPOCH_KEY))?.date ?? null
  } catch {
    return null
  }
}

// ── 어휘 존재 보장 ──
// 라벨 그룹은 클라이언트가 소유하고 analyzer는 상태 파일에 보관만 한다.
// 보드의 data/ 삭제·신규 출고로 그 파일이 없으면 analyzer는 빈 어휘로 돌아
// 모든 추론이 무라벨이 된다. 소유자가 존재도 보장한다: 스냅숏을 받은 뒤
// label_groups가 비어 있으면 자기 어휘를 1회 주입한다. 세션당 1회만
// 시도하여 백엔드 무응답 시 반복 전송을 막고, 로그아웃 시 초기화되어 다음
// 접속에서 다시 판단한다.
let ensureStarted = false

export function ensureLabelGroupsInjected() {
  if (ensureStarted) return
  ensureStarted = true
  effectScope(true).run(() => {
    const { state, snapshotSeq } = useRealtimeEvents()
    const { isAuthenticated } = useAuth()
    let attempted = false
    watch(
      () => [
        isAuthenticated.value,
        // 스냅숏을 받았고 그 안에 analyzer 상태가 실제로 있어야 「비어 있음」이 성립한다
        snapshotSeq.value > 0 && state.monitor_sources?.analyzer === true,
        Object.keys(state.label_groups || {}).length,
      ],
      async ([authed, analyzerSeen, groupCount]) => {
        if (!authed) {
          attempted = false
          return
        }
        if (!analyzerSeen || groupCount > 0 || attempted) return
        attempted = true
        const payload = buildLabelsPayload()
        try {
          const res = await authFetch(APP_ENDPOINTS.presets, {
            method: 'POST',
            body: payload,
          })
          // 동일 구성이면 markConfigApplied가 단절 일자를 갱신하지 않는다
          if (res.ok) markPresetApplied(payload, toIsoDate())
        } catch {
          // 다음 접속에서 다시 판단 — 반복 전송 금지.
        }
      },
    )
  })
}

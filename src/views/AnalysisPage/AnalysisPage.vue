<template>
  <div :class="$style.page">
    <div :class="$style.dateCard">
      <span :class="$style.dateText">{{ displayDate }}</span>
      <img src="/icons/Log/Arrow_Right.svg" :class="[$style.dateArrow, $style.dateArrowPrev]" @click="prevDate" />
      <img src="/icons/Log/Arrow_Right.svg" :class="[$style.dateArrow, $style.dateArrowNext]" @click="nextDate" />
    </div>

    <div :class="$style.toggle" role="tablist">
      <!-- 선택 pill: 홈 온도 토글처럼 좌우로 미끄러진다 -->
      <span :class="$style.toggleThumb" :style="{ transform: `translateX(${mode === 'event' ? 100 : 0}%)` }" aria-hidden="true" />
      <button
        v-for="option in MODE_OPTIONS"
        :key="option.key"
        type="button"
        role="tab"
        :aria-selected="mode === option.key"
        :class="[$style.toggleItem, mode === option.key && $style.toggleItemActive]"
        @click="mode = option.key"
      >
        {{ option.label }}
      </button>
    </div>

    <template v-if="mode === 'state'">
      <AnalysisToday
        :class="$style.today"
        :score="score"
        :hourly="hourly"
        :activityCount="activityCount"
        :activityMinutes="activityMinutes"
        :postures="postures"
        :statusLabel="statusLabel"
        :statusAlert="statusAlert"
      />

      <div :class="$style.legendCard">
        <div :class="$style.legendItem">
          <img :class="$style.legendIcon" src="/icons/Analysis/Moon_Fill.svg" alt="" />
          <span :class="$style.legendLabel">야간 뒤척임</span>
        </div>
        <div :class="$style.legendDivider" />
        <div :class="$style.legendItem">
          <img :class="$style.legendIcon" src="/icons/Calendar/Bone.svg" alt="" />
          <span :class="$style.legendLabel">기타 활동</span>
        </div>
      </div>

      <AnalysisWeek :class="$style.week" :daily="week.daily" :average="week.average" />
    </template>
    <!-- 이벤트 탭: 타임라인 페이지와 같은 그날의 이벤트 목록 -->
    <AnalysisEvents v-else :date="current" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AnalysisToday from './AnalysisToday.vue'
import AnalysisWeek from './AnalysisWeek.vue'
import AnalysisEvents from './AnalysisEvents.vue'
import { toIsoDate } from '@/utils/date'
import { fetchDayStates, fetchBaseline, judgeRhythm, BASELINE_MIN_DAYS } from '@/composables/useInferenceSummary'

const MODE_OPTIONS = [
  { key: 'state', label: '상태' },
  { key: 'event', label: '이벤트' },
]
const mode = ref('state')

const current = ref(new Date())

// ── 그날의 상태 집계와 기준선 (useInferenceSummary) ──
const dayStates = ref(null) // fetchDayStates 반환값
const baseline = ref(null) // fetchBaseline 반환값
const statesError = ref(false)
let statesSeq = 0

async function loadStates() {
  const mySeq = ++statesSeq
  statesError.value = false
  const iso = toIsoDate(current.value)
  try {
    const st = await fetchDayStates(iso)
    if (mySeq !== statesSeq) return
    dayStates.value = st
    const bl = await fetchBaseline(iso)
    if (mySeq !== statesSeq) return
    baseline.value = bl
  } catch {
    if (mySeq !== statesSeq) return
    dayStates.value = null
    baseline.value = null
    statesError.value = true
  }
}
watch(current, loadStates, { immediate: true })

const STATE_NAMES = { lying: '눕기', sitting: '앉기', standing: '서기', restless: '야간 뒤척임' }

// 자세 비율 펼침: 오늘 값과 기준선 평균(%). 표본이 없으면 null → 카드가 '-'로 보인다.
const postures = computed(() =>
  ['lying', 'sitting', 'standing'].map((key) => {
    const share = dayStates.value?.metrics?.[key]
    const n = baseline.value?.n?.[key] ?? 0
    return {
      label: STATE_NAMES[key],
      value: share == null ? null : Math.round(share * 100),
      average: n > 0 ? Math.round(baseline.value.mean[key] * 100) : null,
    }
  }),
)

// 리듬 판정: null=기준선 부족, []=이상 없음, [{label, direction}]=편차
const rhythm = computed(() => {
  const st = dayStates.value
  if (!st?.total) return null
  return judgeRhythm(st.metrics, baseline.value)
})

// 상단 배지 문구 — 자리가 좁아 편차는 첫 항목만 짧게, 나머지는 건수로 줄인다
const statusLabel = computed(() => {
  if (statesError.value) return '불러오지 못했어요'
  const st = dayStates.value
  if (!st) return ''
  if (!st.total) return '추론 데이터 없음'
  if (rhythm.value === null) return `기준선 수집 중 ${baseline.value?.days ?? 0}/${BASELINE_MIN_DAYS}일`
  if (rhythm.value.length === 0) return '이상 없음'
  const [first] = rhythm.value
  const rest = rhythm.value.length - 1
  return `${STATE_NAMES[first.label]} ${first.direction === 'high' ? '많음' : '적음'}${rest ? ` 외 ${rest}건` : ''}`
})
const statusAlert = computed(() => Array.isArray(rhythm.value) && rhythm.value.length > 0)

// 활동 지수(0~100): 그날 라벨 표본 중 비누움(앉기+서기) 비율. 표본이 없으면 null.
const score = computed(() => {
  const st = dayStates.value
  if (!st?.labeled) return null
  const active = st.hours.reduce((a, h) => a + h.counts.sitting + h.counts.standing, 0)
  return Math.round((active / st.labeled) * 100)
})

// 시간대별 활동 지수 — 같은 정의를 시간 단위로. 표본 없는 시간(아직 안 온 시간 포함)은 null.
const hourly = computed(() =>
  dayStates.value ? dayStates.value.activity.map((a) => (a == null ? null : Math.round(a * 100))) : Array(24).fill(null),
)

// 활동량(N회): 그날 눕기·앉기·서기로 관측된 횟수의 합 — 자세 비율의 분모와 같다.
const activityCount = computed(() => dayStates.value?.labeled ?? 0)

// 활동시간(분): 시간대별 비누움 비율 × 60분의 합. 표본 없는 시간은 0으로 본다.
const activityMinutes = computed(() => {
  const st = dayStates.value
  if (!st) return 0
  const minutes = st.activity.reduce((a, share) => a + (share == null ? 0 : share * 60), 0)
  return Math.round(minutes)
})
// ── 주간 활동: 선택한 날이 속한 주(월~일)의 요일별 활동 지수 ──
// 선택일은 오늘 집계, 그 이전 날은 기준선 이력(activeShare)에서 가져온다.
// 선택일 이후 요일과 표본 없는 날은 null → 선 없이 비운다.
const week = computed(() => {
  const base = new Date(current.value)
  const monday = new Date(base)
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7))
  const currentIso = toIsoDate(current.value)
  const history = new Map((baseline.value?.history ?? []).map((d) => [d.date, d.activeShare]))

  const daily = Array.from({ length: 7 }, (_, i) => {
    const iso = toIsoDate(monday, i)
    if (iso === currentIso) return score.value
    const share = history.get(iso)
    return share == null ? null : Math.round(share * 100)
  })

  // 평균선: 기준선 기간(최근 14일) 일별 활동 지수의 평균
  const shares = [...history.values()].filter((v) => v != null)
  const average = shares.length ? Math.round((shares.reduce((a, b) => a + b, 0) / shares.length) * 100) : null
  return { daily, average }
})

const displayDate = computed(() => {
  const y = current.value.getFullYear()
  const m = String(current.value.getMonth() + 1).padStart(2, '0')
  const d = String(current.value.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}.`
})

const shiftDate = (days) => {
  const d = new Date(current.value)
  d.setDate(d.getDate() + days)
  current.value = d
}
const prevDate = () => shiftDate(-1)
const nextDate = () => shiftDate(1)
</script>

<style module>
/* 시안(1142px 캔버스)을 360px 기준 1rem=10px로 환산: px ÷ 31.72 = rem */
/* 캘린더 페이지와 같은 일반 흐름 레이아웃 — 상단 safe-area만 두고 하단은 App이 Nav 높이를 확보한다 */
.page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: env(safe-area-inset-top, 0px) 2rem 0;
  box-sizing: border-box;
  background-color: var(--log-surface);
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
}

.dateCard {
  position: relative;
  flex-shrink: 0;
  height: 4.8rem;
  /* 캘린더 월 표시 줄 중심(0.34 + 1.35 + 2.02/2 = 2.7rem)에 날짜 줄 중심을 맞춘다 */
  margin-top: 0.3rem;
  /* 시안은 배경과 같은 색의 평면 영역 — 테두리·그림자 없음 */
  background: var(--log-surface);
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.dateText {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  color: var(--log-text);
}
.dateArrow {
  position: absolute;
  top: 50%;
  width: 2.4rem;
  height: 2.4rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  filter: var(--log-icon-filter);
}
.dateArrowPrev {
  left: 0;
  transform: translateY(-50%);
}
.dateArrowNext {
  right: 0;
  transform: translateY(-50%) rotate(180deg);
}

.toggle {
  position: relative;
  display: flex;
  flex-shrink: 0;
  height: 3.2rem;
  margin-top: 0.8rem;
  padding: 0.2rem;
  box-sizing: border-box;
  border-radius: 9999px;
  background-color: var(--log-surface-soft);
}
.toggleThumb {
  position: absolute;
  top: 0.2rem;
  bottom: 0.2rem;
  left: 0.2rem;
  width: calc(50% - 0.2rem);
  border-radius: 9999px;
  background-color: var(--log-accent);
  transition: transform 0.24s ease; /* 홈 온도 토글 썸과 같은 속도·이징 */
}
.toggleItem {
  position: relative;
  z-index: 1;
  flex: 1;
  border: 0;
  padding: 0;
  border-radius: 9999px;
  background: transparent;
  color: var(--log-text);
  font-family: 'MalangBold', sans-serif;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.18s ease;
}
.toggleItemActive {
  color: var(--log-on-accent);
}

/* 시안 간격: 토글→오늘 57px(1.8rem), 오늘→범례·범례→주간 51px(1.6rem) */
.today {
  margin-top: 1.8rem;
}
.week {
  margin-top: 1.6rem;
  margin-bottom: 1.6rem;
}

/* 시안 좌표(px ÷ 31.72): 1행 top 50.7(1.6rem), 구분선 top 180.8(5.7rem), 2행 top 231.5(7.3rem),
   아이콘 76.1(2.4rem), 글자 left 102.45(3.23rem), 글자 38.03px(1.2rem) */
.legendCard {
  position: relative;
  margin-top: 1.6rem;
  flex-shrink: 0;
  height: 11.3rem;
  border-radius: 1rem;
  background-color: var(--log-bg);
}
.legendItem {
  position: absolute;
  left: 2rem;
  right: 2rem;
  height: 2.4rem;
  display: flex;
  align-items: center;
}
.legendItem:first-child {
  top: 1.6rem;
}
.legendItem:last-child {
  top: 7.3rem;
}
.legendIcon {
  width: 2.4rem;
  height: 2.4rem;
  filter: var(--log-icon-filter);
}
.legendLabel {
  margin-left: 0.83rem;
  font-size: 1.2rem;
  line-height: 1;
  color: var(--log-text);
}
.legendDivider {
  position: absolute;
  top: 5.7rem;
  left: 6.09%;
  right: 6.08%;
  height: 0.1rem;
  background-color: color-mix(in srgb, var(--log-muted) 30%, transparent); /* 다크 모드 대비 확보 */
}

@media (min-width: 48rem) and (orientation: portrait) {
  .dateCard {
    height: 5.8rem;
    margin-top: 0.5rem;
  }
  .dateText {
    font-size: 1.45rem;
  }
  .dateArrow {
    width: 3rem;
    height: 3rem;
  }
  .dateArrowPrev {
    left: 0.6rem;
  }
  .dateArrowNext {
    right: 0.6rem;
  }
  .toggle {
    height: 3.8rem;
  }
  .toggleItem {
    font-size: 1.45rem;
  }
  .legendLabel {
    font-size: 1.2rem;
  }
  .legendIcon {
    width: 2.8rem;
    height: 2.8rem;
  }
}
</style>

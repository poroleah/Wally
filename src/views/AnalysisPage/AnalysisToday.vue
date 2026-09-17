<template>
  <section :class="$style.card">
    <div :class="$style.head">
      <span :class="$style.title">오늘의 활동</span>
      <span v-if="statusLabel" :class="$style.status">
        <i :class="[$style.statusDot, statusAlert && $style.statusDotAlert]" />
        {{ statusLabel }}
      </span>
    </div>

    <div :class="$style.scoreBox">
      <b :class="$style.score">{{ score == null ? '-' : score }}</b>
      <div :class="$style.scoreText">
        <span :class="$style.scoreLabel">활동 지수</span>
        <span :class="$style.scoreHint">100에 가까울수록 활발해요</span>
      </div>
    </div>

    <div :class="$style.graph">
      <div :class="$style.yAxis">
        <span>100</span><span>50</span><span>0</span>
      </div>
      <div :class="$style.plot">
        <div
          v-for="(value, hour) in hourly"
          :key="hour"
          :class="[$style.bar, value == null && $style.barEmpty]"
          :style="value == null ? null : { height: `${value}%` }"
          :title="value == null ? '' : `${hour + 1}h · ${value}`"
        >
          <b v-if="hour === peakHour" :class="$style.peak">{{ value }}</b>
        </div>
      </div>
      <div :class="$style.xAxis">
        <span v-for="tick in X_TICKS" :key="tick" :style="{ left: `${((tick - 0.5) / 24) * 100}%` }">{{ tick }}h</span>
      </div>
    </div>

    <div :class="[$style.row, $style.rowToggle]" role="button" :aria-expanded="expanded" @click="expanded = !expanded">
      <span :class="$style.rowIcon">
        <img :class="$style.rowIconBg" src="/icons/Analysis/Ellipse.svg" alt="" />
        <img :class="$style.rowIconImg" src="/icons/Analysis/Dogfoot.svg" alt="" />
      </span>
      <span :class="$style.rowLabel">활동량</span>
      <span :class="$style.rowValue">{{ activityCount == null ? '-' : `${activityCount}회` }}</span>
      <img :class="[$style.rowArrow, expanded && $style.rowArrowOpen]" src="/icons/Analysis/Arrow_Thin.svg" alt="" />
    </div>
    <!-- 화살표를 누르면 자세별 비율(눕기/앉기/서기)이 펼쳐진다 -->
    <div :class="[$style.posturesWrap, expanded && $style.posturesWrapOpen]">
      <div :class="$style.posturesClip">
        <div :class="$style.postures">
          <div v-for="p in postures" :key="p.label" :class="$style.posture">
            <span :class="$style.postureLabel">{{ p.label }}</span>
            <span :class="$style.postureValue">{{ p.value == null ? '-' : `${p.value}%` }}</span>
            <span :class="$style.postureAvg">{{ p.average == null ? '평균 -' : `평균 ${p.average}%` }}</span>
          </div>
        </div>
      </div>
    </div>
    <div :class="$style.row">
      <span :class="$style.rowIcon">
        <img :class="$style.rowIconBg" src="/icons/Analysis/Ellipse.svg" alt="" />
        <img :class="$style.rowIconImg" src="/icons/Analysis/Time.svg" alt="" />
      </span>
      <span :class="$style.rowLabel">활동시간</span>
      <span :class="$style.rowValue">{{ activityTimeLabel }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

// 오늘의 활동 카드 — 값은 모두 AnalysisPage가 useInferenceSummary로 계산해 넘긴다.
// hourly: 시간대별 활동 지수(0~100), null은 표본 없음(아직 오지 않은 시간 포함).
const props = defineProps({
  score: { type: Number, default: null }, // 활동 지수 0~100, null이면 표본 없음
  statusLabel: { type: String, default: '' },
  statusAlert: { type: Boolean, default: false }, // 편차 감지 시 점을 강조색으로
  hourly: { type: Array, default: () => Array(24).fill(null) },
  activityCount: { type: Number, default: null }, // null이면 집계 없음('-')
  activityMinutes: { type: Number, default: null },
  // 자세별 오늘 비율과 평균 비율(%). [{ label, value, average }] — null은 표본 없음
  postures: {
    type: Array,
    default: () => [
      { label: '눕기', value: null, average: null },
      { label: '앉기', value: null, average: null },
      { label: '서기', value: null, average: null },
    ],
  },
})

const expanded = ref(false)

const X_TICKS = [1, 6, 12, 18, 24]

const peakHour = computed(() => {
  let idx = -1
  props.hourly.forEach((v, i) => {
    if (v != null && (idx === -1 || v > props.hourly[idx])) idx = i
  })
  return idx
})

const activityTimeLabel = computed(() => {
  if (props.activityMinutes == null) return '-'
  const h = Math.floor(props.activityMinutes / 60)
  const m = props.activityMinutes % 60
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`
})
</script>

<style module>
/* 시안(1142px 캔버스) px ÷ 31.72 = rem */
.card {
  position: relative;
  flex-shrink: 0;
  /* 접힘 27.6rem / 펼침 32.8rem — 내용 높이 + 하단 1.6rem으로 맞는다 */
  padding: 0 2rem 1.6rem;
  box-sizing: border-box;
  border-radius: 1rem;
  background-color: var(--log-bg);
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
}

/* 시안 좌표: 제목 top 49.76px(1.57rem), 상태 top 53.93px(1.7rem), 지수 박스 top 165.21px(5.2rem) */
.head {
  position: relative;
  height: 5.2rem;
}
.title {
  position: absolute;
  top: 1.57rem;
  left: 0;
  font-size: 1.2rem;
  line-height: 1;
}
.status {
  position: absolute;
  top: 1.7rem;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 60%; /* 편차 문구가 길어져도 제목을 덮지 않게 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1rem;
  line-height: 1;
  color: var(--log-muted);
}
.statusDot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #8e735b;
  filter: blur(0.05rem);
}
.statusDotAlert {
  background-color: var(--log-accent);
}

.scoreBox {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  height: 4rem;
  padding: 0 1.2rem;
  box-sizing: border-box;
  border: 0.1rem solid var(--log-accent);
  border-radius: 1rem;
  background: linear-gradient(rgba(255, 176, 133, 0.3), rgba(255, 176, 133, 0.3)), var(--log-surface);
}
.score {
  min-width: 2.5rem;
  font-size: 2rem;
  line-height: 1;
  font-family: 'Malang', sans-serif;
  font-weight: normal;
}
.scoreText {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 1rem;
  line-height: 1;
}
.scoreLabel {
  color: var(--log-text);
  opacity: 0.8;
}
.scoreHint {
  color: var(--log-muted);
}

.graph {
  position: relative;
  height: 9.6rem;
  margin-top: 0.8rem;
  font-size: 0.6rem;
  color: var(--log-text);
}
.yAxis {
  position: absolute;
  top: 0;
  left: 0;
  width: 1.2rem;
  height: 8.4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  line-height: 1;
}
.plot {
  position: absolute;
  top: 0.4rem;
  left: 1.2rem;
  right: 0;
  height: 8rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.bar {
  position: relative;
  width: 0.8rem;
  border-radius: 0.2rem;
  background-color: var(--log-accent);
}
/* 다크 모드에서도 보이도록 muted 색을 30% 섞어 쓴다(surface-soft는 어두운 카드와 대비가 없다) */
.barEmpty {
  height: 0.2rem;
  background-color: color-mix(in srgb, var(--log-muted) 30%, transparent);
}
.peak {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding-bottom: 0.2rem;
  font-size: 0.6rem;
  line-height: 1;
  font-family: 'MalangBold', sans-serif;
}
.xAxis {
  position: absolute;
  left: 1.2rem;
  right: 0;
  bottom: 0;
  height: 1rem;
  line-height: 1;
}
.xAxis span {
  position: absolute;
  top: 0.1rem;
  transform: translateX(-50%);
  white-space: nowrap;
}

.row {
  display: flex;
  align-items: center;
  height: 1.6rem;
  margin-top: 1.6rem;
}
/* 아이콘 프레임 16px(1.6rem) = 반투명 주황 원(Ellipse.svg) 크기 — 시안 */
.rowIcon {
  position: relative;
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
}
.rowIconBg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
/* 아이콘은 원의 약 60%가 보이도록 — 박스 1.2rem(Dogfoot/Time SVG는 자체 여백 약 19% 포함) */
.rowIconImg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.2rem;
  height: 1.2rem;
  transform: translate(-50%, -50%);
  filter: var(--log-icon-filter);
}
.rowLabel {
  margin-left: 0.8rem;
  font-size: 1.2rem;
  line-height: 1;
}
.rowValue {
  margin-left: auto;
  font-size: 0.8rem;
  line-height: 1;
  color: var(--log-text);
  opacity: 0.8;
}
.rowToggle {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.rowArrow {
  width: 1rem;
  height: 1rem;
  margin-left: 0.4rem;
  transform: rotate(90deg); /* 시안은 아래 방향 쉐브론 */
  transition: transform 0.18s ease;
  filter: var(--log-icon-filter);
}
.rowArrowOpen {
  transform: rotate(-90deg);
}

/* 펼침 시안(1배율, px = 0.1rem): 활동량 행 아래 1rem, 높이 4.2rem, 세 열 가운데 정렬
   라벨 10px, 비율 10px(top 16px), 평균 6px(top 34px) */
/* 펼침 모션: grid 행 0fr → 1fr 로 높이를 자연스럽게 열고, 내용은 살짝 아래서 떠오른다 */
.posturesWrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.posturesWrapOpen {
  grid-template-rows: 1fr;
}
.posturesClip {
  min-height: 0;
  overflow: hidden;
}
.postures {
  display: flex;
  justify-content: space-evenly;
  height: 4.2rem;
  margin-top: 1rem;
  opacity: 0;
  transform: translateY(-0.4rem);
  transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.posturesWrapOpen .postures {
  opacity: 1;
  transform: none;
}
.posture {
  position: relative;
  min-width: 2.6rem;
  text-align: center;
  font-size: 1rem;
  line-height: 1;
}
.postureLabel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  color: var(--log-text);
  opacity: 0.8;
}
.postureValue {
  position: absolute;
  top: 1.6rem;
  left: 0;
  right: 0;
  color: var(--log-text);
}
.postureAvg {
  position: absolute;
  top: 3.4rem;
  left: 0;
  right: 0;
  font-size: 0.6rem;
  color: var(--log-muted);
  white-space: nowrap;
}

@media (min-width: 48rem) and (orientation: portrait) {
  .title { font-size: 1.45rem; }
  .status, .scoreText { font-size: 1.2rem; }
  .score { font-size: 2.4rem; }
  .graph { font-size: 0.75rem; }
  .rowLabel { font-size: 1.45rem; }
  .rowValue { font-size: 1rem; }
  .posture { font-size: 1.2rem; }
  .postureAvg { font-size: 0.75rem; }
}
</style>

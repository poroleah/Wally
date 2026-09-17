<template>
  <section :class="$style.card">
    <div :class="$style.head">
      <span :class="$style.title">주간 활동</span>
      <span :class="$style.legend">
        <svg :class="$style.legendLine" viewBox="0 0 17 2" aria-hidden="true">
          <line x1="0" y1="1" x2="17" y2="1" stroke="currentColor" stroke-width="0.9" stroke-dasharray="4 2.5" />
        </svg>
        평균 활동량
      </span>
    </div>

    <div :class="$style.chart">
      <svg :class="$style.svg" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" aria-hidden="true">
        <line
          v-if="average != null"
          :x1="0" :x2="W" :y1="yOf(average)" :y2="yOf(average)"
          :class="$style.avgLine"
          vector-effect="non-scaling-stroke"
        />
        <polyline
          v-if="points.length > 1"
          :points="points.map((p) => `${p.x},${p.y}`).join(' ')"
          :class="$style.dataLine"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <!-- 시안처럼 마지막(오늘) 점에만 마커 -->
      <i
        v-if="lastPoint"
        :class="$style.dot"
        :style="{ left: `${(lastPoint.x / W) * 100}%`, top: `${(lastPoint.y / H) * 100}%` }"
      />
    </div>

    <div :class="$style.xAxis">
      <div v-for="(day, i) in DAYS" :key="day" :class="$style.tick">
        <i :class="$style.tickMark" />
        <span :class="$style.tickLabel">{{ day }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

// 요일별 활동 지수(0~100), 월요일부터. null은 아직 오지 않은 날.
const props = defineProps({
  daily: { type: Array, default: () => Array(7).fill(null) },
  average: { type: Number, default: null },
})

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const W = 700
const H = 300

// 시안처럼 각 요일 눈금 중앙에 점을 찍는다.
const xOf = (i) => ((i + 0.5) / DAYS.length) * W
const yOf = (v) => H - (Math.min(100, Math.max(0, v)) / 100) * H

const points = computed(() =>
  props.daily
    .map((v, i) => (v == null ? null : { i, x: xOf(i), y: yOf(v) }))
    .filter(Boolean),
)

const lastPoint = computed(() => points.value[points.value.length - 1] || null)
</script>

<style module>
/* 시안(1142px 캔버스) px ÷ 31.72 = rem */
.card {
  position: relative;
  flex-shrink: 0;
  height: 18.8rem;
  padding: 0 2rem;
  box-sizing: border-box;
  border-radius: 1rem;
  background-color: var(--log-bg);
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
}

/* 시안 좌표: 제목 top 49.76px(1.57rem), 범례 top 53.93px(1.7rem), 그래프 top 149.09px(4.7rem) */
.head {
  position: relative;
  height: 4.7rem;
}
.title {
  position: absolute;
  top: 1.57rem;
  left: 0;
  font-size: 1.2rem;
  line-height: 1;
}
.legend {
  position: absolute;
  top: 1.7rem;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 1rem;
  line-height: 1;
  color: var(--log-muted);
}
.legendLine {
  width: 1.7rem;
  height: 0.2rem;
  display: block;
  overflow: visible;
}

.chart {
  position: relative;
  height: 10.9rem;
}
.svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.avgLine {
  stroke: var(--log-muted);
  stroke-width: 0.1rem;
  stroke-dasharray: 0.4rem 0.3rem;
}
.dataLine {
  fill: none;
  stroke: var(--log-accent);
  stroke-width: 0.15rem;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.dot {
  position: absolute;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background-color: var(--log-accent);
  transform: translate(-50%, -50%);
}

.xAxis {
  display: flex;
  height: 1.8rem;
  border-top: 0.1rem solid var(--log-muted);
  font-family: 'Bazzi', sans-serif;
  font-size: 0.73rem;
  letter-spacing: 0.07rem;
  color: var(--log-text);
}
.tick {
  position: relative;
  flex: 1;
  text-align: center;
}
.tickMark {
  position: absolute;
  top: 0;
  left: 50%;
  height: 0.67rem;
  border-left: 0.1rem solid var(--log-muted);
}
.tickLabel {
  position: absolute;
  top: 1rem;
  left: 0;
  right: 0;
  line-height: 1;
}

@media (min-width: 48rem) and (orientation: portrait) {
  .title { font-size: 1.45rem; }
  .legend { font-size: 1.2rem; }
  .xAxis { font-size: 0.9rem; }
}
</style>

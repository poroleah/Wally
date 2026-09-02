<template>
  <div v-if="cards.length" :class="$style.wrap">
    <div v-if="highlight" :class="$style.highlight">
      <span :class="$style.hlTitle">{{ highlight.title }}</span>
      <span :class="$style.hlSub">{{ highlight.sub }}</span>
    </div>

    <div v-for="card in cards" :key="card.keyword" :class="$style.card">
      <button
        type="button"
        :class="[$style.cardHead, isKeywordOn(card) && $style.onHead]"
        @click="pickKeyword(card)"
      >
        <span :class="$style.cardName">{{ card.keyword }}</span>
        <span :class="$style.cardTotal">{{ card.total }}회</span>
      </button>
      <div :class="$style.strip">
        <button
          v-for="(lv, i) in card.cells"
          :key="i"
          type="button"
          :class="[$style.cell, $style[`lv${lv}`], isCellOn(card, i) && $style.onCell]"
          :aria-label="cellLabel(card, i)"
          @click="pickCell(card, i)"
        />
      </div>
      <div :class="$style.ruler">
        <span v-for="h in [0, 6, 12, 18, 24]" :key="h">{{ h }}</span>
      </div>
    </div>

    <button v-if="drill" type="button" :class="$style.drillChip" @click="clearDrill">
      {{ drillLabel }} ✕
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { fetchDaySummary } from '@/composables/useEventSummary'
import { pad2 } from '@/utils/date'

// Per-keyword 24-hour event histogram for the selected day (mewly 분석 탭의
// 이벤트 세그먼트 이식). Tapping a keyword or an hour cell narrows the log
// list below to the clips of the matched events, via the `filter` event.
const props = defineProps({
  date: { type: Date, required: true },
})
const emit = defineEmits(['filter'])

function toIsoDate(date, offsetDays = 0) {
  const d = new Date(date)
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const summary = ref({ total: 0, cards: [] })
const lastWeekTotals = ref({})
const drill = ref(null) // null | { keyword, hour(null=키워드 전체) }
let loadSeq = 0

async function load() {
  const mySeq = ++loadSeq
  clearDrill()
  try {
    const [today, lastWeek] = await Promise.all([
      fetchDaySummary(toIsoDate(props.date)),
      fetchDaySummary(toIsoDate(props.date, -7)),
    ])
    if (mySeq !== loadSeq) return
    summary.value = today
    lastWeekTotals.value = Object.fromEntries(lastWeek.cards.map((c) => [c.keyword, c.total]))
  } catch {
    // The log list below still works without the summary; fail quietly.
    if (mySeq !== loadSeq) return
    summary.value = { total: 0, cards: [] }
    lastWeekTotals.value = {}
  }
}
watch(() => props.date, load, { immediate: true })

// Cell intensity: 4-step quantization against the day's max (mewly 규칙 —
// sparse data still shows contrast).
const cards = computed(() => summary.value.cards.map((c) => {
  const max = Math.max(...c.bins)
  return {
    ...c,
    cells: c.bins.map((v) => (v === 0 ? 0 : Math.max(1, Math.round((v / max) * 4)))),
  }
}))

const highlight = computed(() => {
  const top = summary.value.cards[0]
  if (!top) return null
  return {
    title: `'${top.keyword}' 행동이 가장 많았어요`,
    sub: `${top.total}회 · 지난주 같은 요일 ${lastWeekTotals.value[top.keyword] ?? 0}회`,
  }
})

function isKeywordOn(card) {
  return drill.value?.keyword === card.keyword && drill.value?.hour === null
}
function isCellOn(card, hour) {
  return drill.value?.keyword === card.keyword && drill.value?.hour === hour
}
function cellLabel(card, hour) {
  return `${card.keyword} · ${hour}~${hour + 1}시 · ${card.bins[hour]}회`
}
const drillLabel = computed(() => {
  if (!drill.value) return ''
  const { keyword, hour } = drill.value
  return hour === null ? keyword : `${keyword} · ${hour}~${hour + 1}시`
})

function pickCell(card, hour) {
  if (!card.bins[hour]) return // 빈 셀은 필터 대상 아님
  const same = isCellOn(card, hour)
  drill.value = same ? null : { keyword: card.keyword, hour }
  emitFilter()
}
function pickKeyword(card) {
  drill.value = isKeywordOn(card) ? null : { keyword: card.keyword, hour: null }
  emitFilter()
}
function clearDrill() {
  drill.value = null
  emitFilter()
}
function emitFilter() {
  if (!drill.value) {
    emit('filter', null)
    return
  }
  const card = summary.value.cards.find((c) => c.keyword === drill.value.keyword)
  const hours = !card ? [] : drill.value.hour === null ? card.clipsByHour : [card.clipsByHour[drill.value.hour]]
  emit('filter', { label: drillLabel.value, clipNames: new Set(hours.flat()) })
}
</script>

<style module>
.wrap {
  flex-shrink: 0;
  margin: 0 2rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.highlight {
  padding: 1rem 1.4rem;
  border-radius: 1rem;
  background: var(--log-accent-soft);
  box-shadow: inset 0 0 0 0.06rem var(--log-border);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.hlTitle {
  font-family: 'Malang', sans-serif;
  font-size: 1.2rem;
  color: var(--log-text);
}
.hlSub {
  font-size: 1rem;
  color: var(--log-muted);
  font-variant-numeric: tabular-nums;
}
.card {
  padding: 1rem 1.4rem 0.9rem;
  border-radius: 1rem;
  background: var(--log-surface);
  box-shadow: inset 0 0 0 0.06rem var(--log-border), var(--log-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.cardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}
.cardName {
  font-family: 'Malang', sans-serif;
  font-size: 1.15rem;
  color: var(--log-text);
}
.onHead .cardName {
  color: var(--log-accent);
}
.cardTotal {
  font-size: 1rem;
  color: var(--log-muted);
  font-variant-numeric: tabular-nums;
}
.strip {
  display: flex;
  gap: 0.15rem;
  height: 2.4rem;
}
.cell {
  flex: 1;
  min-width: 0;
  border: none;
  border-radius: 0.25rem;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.lv0 {
  background: var(--log-surface-soft);
  cursor: default;
}
.lv1 { background: color-mix(in srgb, var(--log-accent) 18%, var(--log-surface)); }
.lv2 { background: color-mix(in srgb, var(--log-accent) 38%, var(--log-surface)); }
.lv3 { background: color-mix(in srgb, var(--log-accent) 62%, var(--log-surface)); }
.lv4 { background: color-mix(in srgb, var(--log-accent) 88%, var(--log-surface)); }
.onCell {
  outline: 0.12rem solid var(--log-accent);
  outline-offset: 0.08rem;
}
.ruler {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--log-muted);
  font-variant-numeric: tabular-nums;
}
.drillChip {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 10rem;
  background: var(--log-accent-soft);
  color: var(--log-accent);
  font-family: 'Malang', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>

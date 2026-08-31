<template>
  <div :class="$style.planThreeIcon" ref="rootEl">
    <div :class="$style.row">
      <img :class="$style.rowIcon" src="/icons/Calendar/Plan/Time.svg" alt="" />
      <div :class="$style.rowLabel">하루 종일</div>
      <div :class="[$style.track, isAllDay ? $style.on : '']" @click="isAllDay = !isAllDay">
        <div :class="$style.thumb" />
      </div>
    </div>

    <div :class="$style.divider" />

    <div :class="$style.row" @click="saveAndClose()">
      <img :class="$style.rowIcon" src="/icons/Calendar/Plan/Start.svg" alt="" />
      <div :class="$style.rowLabel">시작</div>
      <div :class="$style.rowRight" @click.stop>
        <div
          :class="[$style.pill, activeSection === 'start-date' ? $style.active : '']"
          data-picker-trigger
          @click="toggle('start-date')"
        >{{ activeSection === 'start-date' && startDate ? buildDateStr(startDate) : (startSaved.dateStr || dateLabel) }}</div>
        <div
          v-if="!isAllDay"
          :class="[$style.pill, activeSection === 'start-time' ? $style.active : '']"
          data-picker-trigger
          @click="toggle('start-time')"
        >{{ startSaved.timeStr }}</div>
      </div>
    </div>

    <Transition name="wheelslide">
      <div v-if="activeSection === 'start-date'" :class="$style.pickerWrap" data-picker-content>
        <Calendar @selectDate="selectDateAndClose('start', $event)" />
      </div>
    </Transition>

    <div v-if="activeSection === 'start-time'" :class="$style.wheelpicker" data-picker-content>
        <div :class="$style.highlight" />
        <div :class="$style.columns">
          <div :class="$style.column">
            <div :class="$style.scroller" ref="sHour">
              <div :class="$style.pad" />
              <div v-for="h in hours" :key="h" :class="$style.item">{{ h }}</div>
              <div :class="$style.pad" />
            </div>
          </div>
          <div :class="$style.separator">:</div>
          <div :class="$style.column">
            <div :class="$style.scroller" ref="sMin">
              <div :class="$style.pad" />
              <div v-for="m in minutes" :key="m" :class="$style.item">{{ m }}</div>
              <div :class="$style.pad" />
            </div>
          </div>
        </div>
    </div>

    <div :class="$style.divider" />

    <div :class="$style.row" @click="saveAndClose()">
      <img :class="$style.rowIcon" src="/icons/Calendar/Plan/End.svg" alt="" />
      <div :class="$style.rowLabel">종료</div>
      <div :class="$style.rowRight" @click.stop>
        <div
          :class="[$style.pill, activeSection === 'end-date' ? $style.active : '']"
          data-picker-trigger
          @click="toggle('end-date')"
        >{{ activeSection === 'end-date' && endDate ? buildDateStr(endDate) : (endSaved.dateStr || dateLabel) }}</div>
        <div
          v-if="!isAllDay"
          :class="[$style.pill, activeSection === 'end-time' ? $style.active : '']"
          data-picker-trigger
          @click="toggle('end-time')"
        >{{ endSaved.timeStr }}</div>
      </div>
    </div>

    <Transition name="wheelslide">
      <div v-if="activeSection === 'end-date'" :class="$style.pickerWrap" data-picker-content>
        <Calendar @selectDate="selectDateAndClose('end', $event)" />
      </div>
    </Transition>

    <div v-if="activeSection === 'end-time'" :class="$style.wheelpicker" data-picker-content>
        <div :class="$style.highlight" />
        <div :class="$style.columns">
          <div :class="$style.column">
            <div :class="$style.scroller" ref="eHour">
              <div :class="$style.pad" />
              <div v-for="h in hours" :key="h" :class="$style.item">{{ h }}</div>
              <div :class="$style.pad" />
            </div>
          </div>
          <div :class="$style.separator">:</div>
          <div :class="$style.column">
            <div :class="$style.scroller" ref="eMin">
              <div :class="$style.pad" />
              <div v-for="m in minutes" :key="m" :class="$style.item">{{ m }}</div>
              <div :class="$style.pad" />
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import Calendar from '@/components/Calendar/Calendar.vue'
import { DAY_NAMES } from '@/constants'

const props = defineProps({ selectedDate: Object, initialValue: Object })

const rootEl = ref(null)
const isAllDay = ref(false)
const activeSection = ref(null)

function saveAndClose() {
  const prev = activeSection.value
  if (!prev) return
  activeSection.value = null
  if (prev === 'start-date') {
    startSaved.value = { ...startSaved.value, dateStr: buildDateStr(startDate.value || getDefaultDate()) }
  } else if (prev === 'end-date') {
    endSaved.value = { ...endSaved.value, dateStr: buildDateStr(endDate.value || getDefaultDate()) }
  } else if (prev === 'start-time') {
    startSaved.value = { ...startSaved.value, timeStr: buildTime(sHour.value, sMin.value) }
  } else if (prev === 'end-time') {
    endSaved.value = { ...endSaved.value, timeStr: buildTime(eHour.value, eMin.value) }
  }
}

function onDocClick(e) {
  if (e.target.closest?.('[data-picker-content], [data-picker-trigger]')) return
  saveAndClose()
}

function selectDateAndClose(type, date) {
  if (type === 'start') startDate.value = date
  else endDate.value = date
  saveAndClose()
}

watch(activeSection, (val) => {
  if (val) {
    document.addEventListener('click', onDocClick, true)
  } else {
    document.removeEventListener('click', onDocClick, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
})

const getItemH = (el) => el?.children?.[1]?.getBoundingClientRect().height
  || parseFloat(getComputedStyle(document.documentElement).fontSize) * 3.6

const dowNames = DAY_NAMES
const dateLabel = computed(() => {
  const d = props.selectedDate
  if (!d) return ''
  const dow = new Date(d.year, d.month - 1, d.day).getDay()
  return `${d.year}.${String(d.month).padStart(2, '0')}.${String(d.day).padStart(2, '0')}. (${dowNames[dow]})`
})

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const sHour = ref(null); const sMin = ref(null)
const eHour = ref(null); const eMin = ref(null)

const startDate = ref(null)
const endDate = ref(null)

const startSaved = ref({ dateStr: '', timeStr: '09:00' })
const endSaved = ref({ dateStr: '', timeStr: '12:00' })

function buildDateStr(d) {
  if (!d) return ''
  const dow = new Date(d.year, d.month - 1, d.day).getDay()
  return `${d.year}.${String(d.month).padStart(2, '0')}.${String(d.day).padStart(2, '0')}. (${dowNames[dow]})`
}

function parseTime(value, fallbackHour, fallbackMinute = 0) {
  const [hour, minute] = String(value || '').split(':').map(Number)
  return {
    hour: Number.isFinite(hour) ? hour : fallbackHour,
    minute: Number.isFinite(minute) ? minute : fallbackMinute,
  }
}

function getIdx(el) {
  if (!el) return 0
  return Math.round(el.scrollTop / getItemH(el))
}

function buildTime(hourEl, minEl) {
  const h = String(getIdx(hourEl)).padStart(2, '0')
  const m = String(getIdx(minEl)).padStart(2, '0')
  return `${h}:${m}`
}

function initScroll(el, index) {
  if (!el) return
  el.scrollTop = index * getItemH(el)
}

function syncActivePicker() {
  if (activeSection.value === 'start-time') {
    const { hour, minute } = parseTime(startSaved.value.timeStr, 9)
    initScroll(sHour.value, hour)
    initScroll(sMin.value, minute)
  } else if (activeSection.value === 'end-time') {
    const { hour, minute } = parseTime(endSaved.value.timeStr, 12)
    initScroll(eHour.value, hour)
    initScroll(eMin.value, minute)
  }
}

function getDefaultDate() {
  const d = new Date()
  return props.selectedDate || { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

function getDefaultStartTime() {
  return '09:00'
}

function toggle(section) {
  const prev = activeSection.value
  if (prev === section) {
    saveAndClose()
    return
  }
  // 다른 섹션으로 전환 시 이전 것 저장
  if (prev) saveAndClose()
  activeSection.value = section
  // 열릴 때 기본값 세팅
  if (section === 'start-date' && !startDate.value) startDate.value = getDefaultDate()
  if (section === 'end-date' && !endDate.value) endDate.value = getDefaultDate()
}

watch(activeSection, async (val) => {
  if (!val) return
  await nextTick()
  syncActivePicker()
})

function applyInitialValue(value = {}) {
  const baseDate = getDefaultDate()
  const nextStartDate = value.startDate || baseDate
  const nextEndDate = value.endDate || nextStartDate
  const defaultStartTime = getDefaultStartTime()
  isAllDay.value = Boolean(value.allDay)
  startDate.value = nextStartDate
  endDate.value = nextEndDate
  startSaved.value = {
    dateStr: buildDateStr(nextStartDate),
    timeStr: value.startTime || defaultStartTime,
  }
  endSaved.value = {
    dateStr: buildDateStr(nextEndDate),
    timeStr: value.endTime || '12:00',
  }
  activeSection.value = null
}

watch(
  () => [props.selectedDate, props.initialValue],
  () => applyInitialValue(props.initialValue || {}),
  { immediate: true },
)

function getValue() {
  saveAndClose()
  const baseDate = getDefaultDate()
  const valueStartDate = startDate.value || baseDate
  return {
    allDay: isAllDay.value,
    startDate: valueStartDate,
    startTime: startSaved.value.timeStr || getDefaultStartTime(),
    endDate: endDate.value || startDate.value || baseDate,
    endTime: endSaved.value.timeStr || '12:00',
  }
}

defineExpose({ isAllDay, getValue })
</script>

<style module>
.planThreeIcon {
  border-radius: 1rem;
  background-color: var(--calendar-surface);
  box-shadow: inset 0 0 0 0.06rem var(--calendar-border), var(--calendar-shadow);
  width: 100%;
  overflow: hidden;
  font-size: 1.2rem;
  color: var(--calendar-text);
  font-family: 'Malang', sans-serif;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  align-items: center;
  height: 4.8rem;
  padding: 0 1rem;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.rowIcon { width: 2.4rem; height: 2.4rem; flex-shrink: 0; filter: var(--calendar-icon-filter); }
.rowLabel { margin-left: 0.9rem; flex: 1; line-height: 1.4; }
.rowRight { display: flex; align-items: center; gap: 0.2rem; }
.pill {
  padding: 0.3rem 0.2rem;
  border-radius: 0.6rem;
  color: var(--calendar-muted);
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.15s;
}
.pill:hover { background-color: var(--calendar-hover); }
.active {
  color: var(--calendar-accent);
}
.divider { height: 0.03rem; background-color: var(--calendar-border); margin: 0 0.8rem; flex-shrink: 0; }
.track {
  width: 4.3rem; height: 2.3rem; border-radius: 2rem;
  background-color: var(--calendar-toggle-bg); border: 0.1rem solid var(--calendar-toggle-border); box-shadow: var(--calendar-toggle-shadow); cursor: pointer; position: relative;
  transition: background-color 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease, transform 0.18s ease;
  -webkit-tap-highlight-color: transparent; user-select: none; flex-shrink: 0;
}
.on {
  background-color: var(--calendar-toggle-on);
  border-color: var(--calendar-toggle-on);
  box-shadow: inset 0 0 0.2rem rgba(255, 255, 255, 0.18), 0 0.1rem 0.35rem rgba(255, 176, 133, 0.28);
}
.thumb {
  position: absolute; top: calc(50% - 0.95rem); left: 4.65%; width: 44.19%; height: 1.9rem;
  border-radius: 50%; background-color: var(--calendar-toggle-thumb);
  transition: left 0.24s ease, transform 0.18s ease, box-shadow 0.24s ease; box-shadow: var(--calendar-toggle-thumb-shadow);
}
.on .thumb {
  background-color: var(--calendar-toggle-thumb-on);
  left: 51.16%;
}
.track:hover .thumb { transform: scale(1.04); }
.track:active { transform: scale(0.97); }
.track:active .thumb { transform: scale(0.96); }

.pickerWrap {
  background-color: var(--calendar-surface);
}

/* Wheel Picker */
.wheelpicker {
  width: 100%;
  height: 25.2rem;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}
.highlight {
  position: absolute;
  top: 50%;
  left: 0.8rem;
  right: 0.8rem;
  height: 3.6rem;
  transform: translateY(-50%);
  background-color: var(--calendar-hover);
  border-radius: 0.8rem;
  pointer-events: none;
  z-index: 1;
}
.columns {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 4rem;
  gap: 0.8rem;
}
.column { flex: 1; overflow: hidden; height: 100%; }
.separator {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--calendar-text);
  flex-shrink: 0;
}
.scroller {
  height: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroller::-webkit-scrollbar { display: none; }
.pad { height: 10.8rem; }
.item {
  height: 3.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  font-size: 1.4rem;
  color: var(--calendar-text);
  font-family: 'Malang', sans-serif;
  user-select: none;
}

@media (min-width: 48rem) and (orientation: portrait) {
  .planThreeIcon {
    font-size: var(--fluid-text-sm);
  }

  .row {
    height: var(--fluid-row-h);
    padding: 0 var(--fluid-offset-sm);
  }

  .rowIcon {
    width: var(--fluid-icon-md);
    height: var(--fluid-icon-md);
  }

  .rowLabel {
    margin-left: var(--fluid-offset-sm);
  }

  .rowRight {
    gap: 0.45rem;
  }

  .pill {
    font-size: var(--fluid-text-sm);
    padding: 0.35rem 0.35rem;
  }
}

</style>

<style>
.wheelslide-enter-active, .wheelslide-leave-active {
  transition: max-height 0.4s ease, opacity 0.3s ease;
  max-height: 70rem;
  overflow: hidden;
}
.wheelslide-enter-from, .wheelslide-leave-to { max-height: 0; opacity: 0; }
</style>

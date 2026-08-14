<template>
  <div
    :class="$style.calendar"
    @click.capture="handleClickCapture"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="cancelSwipe"
  >
    <div :class="$style.monthYearLine">
      <img :class="$style.chevronLeftIcon" src="/icons/Calender/chevron.svg" alt="" @click="prevMonth" />
      <div :class="$style.month">{{ currentMonth }}월</div>
      <img :class="[$style.chevronLeftIcon, $style.chevronRight]" src="/icons/Calender/chevron.svg" alt="" @click="nextMonth" />
    </div>
    <div :class="$style.calwnderLine" />
    <div :class="$style.dayDate">
      <div :class="$style.dayLine">
        <div v-for="day in dayNames" :key="day" :class="$style.sun">
          <div :class="$style.sun2">{{ day }}</div>
        </div>
      </div>
      <div :class="$style.dateLine">
        <div v-for="(week, i) in calendarWeeks" :key="i" :class="$style.dateNumberLine01">
          <div
            v-for="(day, j) in week"
            :key="j"
            :class="$style[getDayClass(day, j)]"
            @click="selectDate(day)"
          >
            <div
              :class="[
                $style.dateFace,
                hasLogDate(day) ? $style.logDateFace : '',
                isSelected(day) && !hasLogDate(day) ? $style.selected : '',
                hasLogDate(day) && isSelected(day) ? $style.selectedLogDate : '',
              ]"
            >
              <img
                v-if="hasLogDate(day)"
                v-theme-src="getLogPrintSources(day)"
                :class="$style.fluentanimalPawPrint48FilIcon"
                :src="hasPlanDate(day) ? '/icons/Log/logprint.svg?v=3' : '/icons/Log/logprint_mono.svg?v=1'"
                alt=""
                aria-hidden="true"
              />
              <div :class="[isToday(day) ? $style.div23 : $style.div, hasLogDate(day) ? $style.logDateNumber : '']">
                {{ day !== null ? day : '' }}
              </div>
              <span v-if="hasPlanDate(day) && !hasLogDate(day)" :class="$style.planDot" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePlans } from '@/composables/usePlans'
import { fetchRealtimeEventDateKeys } from '@/composables/useRealtimeEvents'

const emit = defineEmits(['selectDate'])

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const selectedDay = ref(now.getDate())
const hasUserSelectedDate = ref(false)
const { plansByDate } = usePlans()
const logDateKeys = ref(new Set())
let logDateRequestId = 0
let swipeStartX = 0
let swipeStartY = 0
let swipeActive = false
let swipeCancelled = false
let ignoreNextClick = false
let clickResetTimer = null
const SWIPE_THRESHOLD = 52

const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const calendarWeeks = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value - 1
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks = []
  let week = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
})

const isToday = (day) =>
  day !== null &&
  day === now.getDate() &&
  currentMonth.value === now.getMonth() + 1 &&
  currentYear.value === now.getFullYear()

const isSelected = (day) => hasUserSelectedDate.value && day !== null && day === selectedDay.value

function getDateKey(day) {
  if (day === null) return ''
  return [currentYear.value, currentMonth.value, day]
    .map((value) => String(value).padStart(2, '0'))
    .join('-')
}

const planDateKeys = computed(() => new Set(
  Object.entries(plansByDate.value)
    .filter(([, plans]) => Array.isArray(plans) && plans.length > 0)
    .map(([dateKey]) => dateKey),
))

const hasPlanDate = (day) => planDateKeys.value.has(getDateKey(day))
const hasLogDate = (day) => logDateKeys.value.has(getDateKey(day))
const getLogPrintSources = (day) => hasPlanDate(day)
  ? { light: '/icons/Log/logprint.svg?v=3', dark: '/icons/Log/logprint_Dark.svg?v=2' }
  : { light: '/icons/Log/logprint_mono.svg?v=1', dark: '/icons/Log/logprint_mono_Dark.svg?v=1' }

async function loadLogDateKeys() {
  const requestId = ++logDateRequestId
  try {
    const keys = await fetchRealtimeEventDateKeys({
      year: currentYear.value,
      month: currentMonth.value,
    })
    if (requestId === logDateRequestId) logDateKeys.value = keys
  } catch {
    if (requestId === logDateRequestId) logDateKeys.value = new Set()
  }
}

watch([currentYear, currentMonth], loadLogDateKeys, { immediate: true })

const selectDate = (day) => {
  if (day === null) return
  selectedDay.value = day
  hasUserSelectedDate.value = true
  emit('selectDate', { year: currentYear.value, month: currentMonth.value, day })
}

const getDayClass = (day, dayIndex) => {
  if (day === null) return 'date2'
  if (isToday(day)) return 'date23'
  if (dayIndex === 0) return 'date'
  if (dayIndex === 6) return 'date7'
  return 'date2'
}

const prevMonth = () => {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
}

const nextMonth = () => {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
}

function handleTouchStart(event) {
  if (event.touches.length !== 1) return
  const touch = event.touches[0]
  swipeStartX = touch.clientX
  swipeStartY = touch.clientY
  swipeActive = true
  swipeCancelled = false
}

function handleTouchMove(event) {
  if (!swipeActive || swipeCancelled || event.touches.length !== 1) return
  const touch = event.touches[0]
  const deltaX = touch.clientX - swipeStartX
  const deltaY = touch.clientY - swipeStartY

  if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
    swipeCancelled = true
    return
  }

  if (Math.abs(deltaX) > 10) event.preventDefault()
}

function handleTouchEnd(event) {
  if (!swipeActive || swipeCancelled) {
    cancelSwipe()
    return
  }

  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - swipeStartX
  const deltaY = touch.clientY - swipeStartY
  const isHorizontalSwipe = Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.2

  swipeActive = false
  if (!isHorizontalSwipe) return

  ignoreNextClick = true
  clearTimeout(clickResetTimer)
  clickResetTimer = window.setTimeout(() => { ignoreNextClick = false }, 250)
  if (deltaX < 0) nextMonth()
  else prevMonth()
}

function cancelSwipe() {
  swipeActive = false
  swipeCancelled = false
}

function handleClickCapture(event) {
  if (!ignoreNextClick) return
  event.preventDefault()
  event.stopPropagation()
}
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'Bazzi';
  src: url('@/assets/Fonts/Bazzi.ttf') format('truetype');
}
.calendar {
  width: 100%;
  background-color: var(--calendar-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  box-sizing: border-box;
  text-align: center;
  font-size: 1.686rem;
  color: var(--calendar-text);
  font-family: 'Bazzi', sans-serif;
  touch-action: pan-y;
  overscroll-behavior-x: contain;
}
.monthYearLine {
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2.7rem;
  gap: 0.84rem;
}
.chevronLeftIcon {
  filter: var(--calendar-icon-filter);
  height: 2.02rem;
  width: 2.02rem;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.chevronRight {
  transform: rotate(180deg);
}
.month {
  flex: 1;
  position: relative;
}
.calwnderLine {
  align-self: stretch;
  margin: 0 2.7rem;
  height: 0.08rem;
  border-top: 0.08rem solid var(--calendar-border);
  box-sizing: border-box;
}
.dayDate {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  font-size: 1.2rem;
  color: var(--calendar-text);
}
.dayLine {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0.4rem 2.7rem;
}
.sun {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.17rem 0;
}
.sun2 {
  letter-spacing: 0.03em;
  line-height: 1.012rem;
  text-transform: uppercase;
}
.dateLine {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  text-align: center;
  font-size: 1.518rem;
  font-family: 'Malang', sans-serif;
}
.dateNumberLine01 {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0.2rem 2.7rem;
}
.date {
  position: relative;
  height: 3.54rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: var(--calendar-accent);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.date2 {
  position: relative;
  height: 3.54rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.date7 {
  position: relative;
  height: 3.54rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: var(--calendar-saturday);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.date23 {
  position: relative;
  height: 3.54rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: 1.8rem;
  color: var(--calendar-text);
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.dateFace {
  position: relative;
  width: 3.2rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.div {
  position: relative;
  line-height: 1.855rem;
  transition: font-size 0.18s ease;
}
.div23 {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  background-color: var(--calendar-surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.518rem;
  font-weight: 400;
  line-height: 1;
  transition: font-size 0.18s ease;
}
.planDot {
  position: absolute;
  top: 0.25rem;
  right: 0.22rem;
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background-color: var(--calendar-accent);
  pointer-events: none;
}
.fluentanimalPawPrint48FilIcon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 42px;
  overflow: hidden;
  object-fit: contain;
  pointer-events: none;
  transform: translateY(-0.42rem) scale(0.88);
  transition: transform 0.18s ease;
}
.selectedLogDate .fluentanimalPawPrint48FilIcon {
  transform: translateY(-0.42rem) scale(1);
  filter:
    drop-shadow(0.06rem 0 0 var(--calendar-border))
    drop-shadow(-0.06rem 0 0 var(--calendar-border))
    drop-shadow(0 0.06rem 0 var(--calendar-border))
    drop-shadow(0 -0.06rem 0 var(--calendar-border));
}
.logDateNumber {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  color: #2d2926;
  font-size: 1.518rem;
  line-height: 1;
  transition: font-size 0.18s ease;
}
:global(:root.theme-dark) .logDateNumber,
:global(body.theme-dark) .logDateNumber,
:global(#app.theme-dark) .logDateNumber {
  color: var(--calendar-text);
}
.logDateFace .div23 {
  background-color: transparent;
  font-size: 1.518rem;
}
.selectedLogDate .logDateNumber {
  font-size: 1.8rem;
}
.selected {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  font-size: 1.8rem;
  color: var(--calendar-text);
  font-weight: 400;
}
.selected .div,
.selected .div23 {
  font-size: inherit;
}
.selected::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  border: 1px solid var(--calendar-border);
  border-radius: 50%;
  box-sizing: border-box;
  pointer-events: none;
}
@media (min-width: 48rem) and (orientation: portrait) {
  .calendar {
    font-size: 1.95rem;
  }

  .monthYearLine {
    padding: 1.3rem 4rem;
    gap: 1.2rem;
  }

  .chevronLeftIcon {
    width: 2.5rem;
    height: 2.5rem;
  }

  .calwnderLine {
    margin: 0 4rem;
  }

  .dayDate {
    font-size: 1.38rem;
  }

  .dayLine {
    padding: 0.65rem 4rem;
  }

  .dateLine {
    font-size: 1.78rem;
  }

  .dateNumberLine01 {
    padding: 0.25rem 4rem;
  }

  .date,
  .date2,
  .date7,
  .date23 {
    height: 4.25rem;
  }

  .logDateFace .div23 {
    font-size: 1.78rem;
  }

  .date23,
  .div23,
  .selected {
    font-size: 1.78rem;
  }

  .selected {
    font-size: 2rem;
  }

  .selectedLogDate .logDateNumber {
    font-size: 2rem;
  }

  .dateFace,
  .div23,
  .selected {
    width: 3.8rem;
    height: 3.8rem;
  }

  .planDot {
    top: 0.3rem;
    right: 0.26rem;
    width: 0.5rem;
    height: 0.5rem;
  }

}

</style>

<template>
  <div :class="$style.calendar">
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
            :class="[$style[getDayClass(day, j)], isSelected(day) ? $style.selected : '']"
            @click="selectDate(day)"
          >
            <div :class="isToday(day) ? $style.div23 : $style.div">
              {{ day !== null ? day : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['selectDate'])
const props = defineProps({ selectedDate: Object })

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const selectedDay = ref(now.getDate())

watch(() => props.selectedDate, (date) => {
  if (!date?.year || !date?.month || !date?.day) return
  currentYear.value = date.year
  currentMonth.value = date.month
  selectedDay.value = date.day
}, { immediate: true, deep: true })

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

const isSelected = (day) => day !== null && day === selectedDay.value

const selectDate = (day) => {
  if (day === null) return
  selectedDay.value = day
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
.div {
  position: relative;
  line-height: 1.855rem;
}
.div23 {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  background-color: var(--calendar-surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 500;
  line-height: 1;
}
.selected {
  width: 3.2rem;
  height: 3.2rem;
  justify-self: center;
  border-radius: 50%;
  border: 0.1rem solid var(--calendar-surface-soft);
  box-sizing: border-box;
  font-size: 1.8rem;
  color: var(--calendar-text);
  font-weight: 500;
}
</style>

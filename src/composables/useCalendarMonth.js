import { computed, ref } from 'vue'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function useCalendarMonth() {
  const now = new Date()
  const currentYear = ref(now.getFullYear())
  const currentMonth = ref(now.getMonth() + 1)

  const calendarWeeks = computed(() => {
    const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
    const daysInMonth = new Date(currentYear.value, currentMonth.value, 0).getDate()
    const weeks = []
    let week = Array(firstDay).fill(null)

    for (let day = 1; day <= daysInMonth; day += 1) {
      week.push(day)
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
    }

    if (week.length > 0) weeks.push([...week, ...Array(7 - week.length).fill(null)])
    return weeks
  })

  const isToday = (day) => (
    day !== null
    && day === now.getDate()
    && currentMonth.value === now.getMonth() + 1
    && currentYear.value === now.getFullYear()
  )

  const getDayClass = (day, dayIndex) => {
    if (day === null) return 'date2'
    if (isToday(day)) return 'date23'
    if (dayIndex === 0) return 'date'
    if (dayIndex === 6) return 'date7'
    return 'date2'
  }

  const previousMonth = () => {
    if (currentMonth.value === 1) {
      currentMonth.value = 12
      currentYear.value -= 1
      return
    }
    currentMonth.value -= 1
  }

  const nextMonth = () => {
    if (currentMonth.value === 12) {
      currentMonth.value = 1
      currentYear.value += 1
      return
    }
    currentMonth.value += 1
  }

  return {
    currentYear,
    currentMonth,
    calendarWeeks,
    dayNames: DAY_NAMES,
    isToday,
    getDayClass,
    previousMonth,
    nextMonth,
  }
}

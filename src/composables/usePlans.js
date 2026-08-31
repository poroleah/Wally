import { ref } from 'vue'
import { pad2 } from '@/utils/date'

const PLANS_STORAGE_KEY = 'wally:plans'

function hasWindow() {
  return typeof window !== 'undefined'
}

function loadStoredPlans() {
  if (!hasWindow()) return {}

  try {
    const stored = JSON.parse(window.localStorage.getItem(PLANS_STORAGE_KEY) || '{}')
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
  } catch {
    return {}
  }
}

function savePlans() {
  if (!hasWindow()) return
  window.localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plansByDate.value))
}

function todayDateObject() {
  const date = new Date()
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
}

function dateKeyToDateObject(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number)
  if (!year || !month || !day) return todayDateObject()
  return { year, month, day }
}

function makePlanId() {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizePlan(plan, dateKey = '', index = 0) {
  const fallbackDate = dateKeyToDateObject(dateKey)

  if (typeof plan === 'string') {
    return {
      id: `legacy-${dateKey}-${index}-${plan}`,
      title: plan,
      category: plan,
      allDay: false,
      startDate: fallbackDate,
      startTime: '09:00',
      endDate: fallbackDate,
      endTime: '12:00',
      alarm: '없음',
      repeat: '안 함',
    }
  }

  const source = plan && typeof plan === 'object' ? plan : {}
  const title = source.title || source.category || ''
  return {
    id: source.id || makePlanId(),
    title,
    category: source.category || title,
    allDay: Boolean(source.allDay),
    startDate: source.startDate || fallbackDate,
    startTime: source.startTime || '09:00',
    endDate: source.endDate || source.startDate || fallbackDate,
    endTime: source.endTime || '12:00',
    alarm: source.alarm || '없음',
    repeat: source.repeat || '안 함',
  }
}

function normalizeStoredPlans(plansByDate) {
  return Object.fromEntries(
    Object.entries(plansByDate).map(([dateKey, plans]) => [
      dateKey,
      Array.isArray(plans) ? plans.map((plan, index) => normalizePlan(plan, dateKey, index)) : [],
    ]).filter(([, plans]) => plans.length > 0),
  )
}

const plansByDate = ref(normalizeStoredPlans(loadStoredPlans()))

function dateObjectToLabel(dateObject, fallbackDateKey) {
  const date = dateObject || dateKeyToDateObject(fallbackDateKey)
  return `${pad2(date.month)}.${pad2(date.day)}`
}

function isToday(dateObject) {
  const today = new Date()
  return dateObject?.year === today.getFullYear()
    && dateObject?.month === today.getMonth() + 1
    && dateObject?.day === today.getDate()
}

function getPlanTimeLabel(plan) {
  if (plan.allDay) return '하루 종일'
  return plan.startTime || ''
}

function getPlanHour(plan) {
  if (plan.allDay) return null
  const [hour] = String(plan.startTime || '').split(':').map(Number)
  return Number.isFinite(hour) ? hour : null
}

function formatPlanDayAmpm(plan, dateKey) {
  const startDate = plan.startDate || dateKeyToDateObject(dateKey)
  const hour = getPlanHour(plan)
  const dayLabel = isToday(startDate) ? '오늘' : dateObjectToLabel(startDate, dateKey)
  return hour === null ? dayLabel : `${dayLabel} ${hour < 12 ? '오전' : '오후'}`
}

export function usePlans() {
  const addPlan = (dateKey, value, index = null) => {
    const plan = normalizePlan(value, dateKey, index ?? 0)
    if (!dateKey || !plan.title) return
    if (!plansByDate.value[dateKey]) plansByDate.value[dateKey] = []
    if (index !== null) {
      plansByDate.value[dateKey][index] = plan
    } else {
      plansByDate.value[dateKey].push(plan)
    }
    savePlans()
  }

  const deletePlan = (dateKey, index) => {
    if (!plansByDate.value[dateKey]) return
    plansByDate.value[dateKey].splice(index, 1)
    if (plansByDate.value[dateKey].length === 0) {
      delete plansByDate.value[dateKey]
    }
    savePlans()
  }

  const getPlans = (dateKey) => plansByDate.value[dateKey] ?? []

  const allAlarms = () => {
    const result = []
    for (const [dateKey, plans] of Object.entries(plansByDate.value)) {
      for (const plan of plans) {
        const meta = [
          plan.allDay ? '하루 종일' : plan.startTime,
          plan.repeat !== '안 함' ? plan.repeat : '',
        ].filter(Boolean).join(' · ')

        result.push({
          id: plan.id,
          type: '일정',
          title: plan.title || '일정',
          content: meta ? `${meta} ${plan.title} 일정이 있습니다.` : `'${plan.title}' 일정이 있습니다.`,
          dayAmpm: formatPlanDayAmpm(plan, dateKey),
          time: getPlanTimeLabel(plan),
          icon: '/icons/Calendar/Bone.svg',
        })
      }
    }
    return result.sort((a, b) => String(a.id).localeCompare(String(b.id)))
  }

  return { plansByDate, addPlan, deletePlan, getPlans, allAlarms }
}

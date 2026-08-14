import { LocalNotifications } from '@capacitor/local-notifications'
import { useAlarmSettings } from '@/composables/useAlarmSettings'
import { ROUTES } from '@/constants'
import {
  createNotificationId,
  ensureNotificationPermission,
  NOTIFICATION_CHANNELS,
} from '@/utils/notifications'

const MINUTE_MS = 60 * 1000
const ALARM_OFFSET_MINUTES = Object.freeze({
  '없음': null,
  '5분 전': 5,
  '10분 전': 10,
  '15분 전': 15,
  '30분 전': 30,
  '1시간 전': 60,
  '2시간 전': 120,
  '1일 전': 1440,
  '2일 전': 2880,
  '1주 전': 10080,
})

function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatDateQuery(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function formatScheduleNotificationTitle(title) {
  const scheduleTitle = String(title || '').trim() || '일정'
  return scheduleTitle.endsWith('일정')
    ? `${scheduleTitle}이 있습니다`
    : `${scheduleTitle} 일정이 있습니다`
}

export function formatScheduleNotificationDetail(eventDate, allDay = false) {
  if (!(eventDate instanceof Date) || Number.isNaN(eventDate.getTime())) return ''

  const dateLabel = `${eventDate.getFullYear()}년 ${eventDate.getMonth() + 1}월 ${eventDate.getDate()}일`
  if (allDay) return `${dateLabel} · 하루 종일`

  const hour = eventDate.getHours()
  const period = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 || 12
  return `${dateLabel} ${period} ${displayHour}:${pad2(eventDate.getMinutes())}`
}

export function getAlarmNotificationDate(eventDate, alarmLabel) {
  const eventTime = eventDate instanceof Date ? eventDate.getTime() : Number.NaN
  const offsetMinutes = ALARM_OFFSET_MINUTES[alarmLabel]

  if (!Number.isFinite(eventTime) || !Number.isFinite(offsetMinutes)) return null
  return new Date(eventTime - offsetMinutes * MINUTE_MS)
}

function addMonthsClamped(date, months) {
  const next = new Date(date)
  const targetDay = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(targetDay, lastDay))
  return next
}

function occurrenceDate(eventDate, repeatLabel, index) {
  const next = new Date(eventDate)
  if (index === 0 || repeatLabel === '안 함') return next

  if (repeatLabel === '매일') {
    next.setDate(next.getDate() + index)
    return next
  }
  if (repeatLabel === '매주') {
    next.setDate(next.getDate() + index * 7)
    return next
  }
  if (repeatLabel === '매월') return addMonthsClamped(next, index)
  if (repeatLabel === '매년') return addMonthsClamped(next, index * 12)
  return next
}

function repeatEndDate(value, fallback) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (value && Number.isFinite(value.year) && Number.isFinite(value.month) && Number.isFinite(value.day)) {
    return new Date(value.year, value.month - 1, value.day, 23, 59, 59, 999)
  }
  return fallback
}

function futureOccurrences(eventDate, alarmLabel, repeatLabel, endDate) {
  const now = Date.now()
  const repeatUntil = repeatEndDate(endDate, eventDate)

  if (repeatLabel === '안 함') {
    const notifyAt = getAlarmNotificationDate(eventDate, alarmLabel)
    return notifyAt && notifyAt.getTime() > now ? [{ eventAt: new Date(eventDate), notifyAt, index: 0 }] : []
  }

  const result = []
  let index = 0
  let eventAt = occurrenceDate(eventDate, repeatLabel, index)

  while (eventAt.getTime() <= repeatUntil.getTime()) {
    const notifyAt = getAlarmNotificationDate(eventAt, alarmLabel)
    if (notifyAt && notifyAt.getTime() > now) result.push({ eventAt, notifyAt, index })

    index += 1
    const nextEventAt = occurrenceDate(eventDate, repeatLabel, index)
    if (nextEventAt.getTime() <= eventAt.getTime()) break
    eventAt = nextEventAt
  }

  return result
}

export async function requestPermission() {
  return ensureNotificationPermission()
}

export async function scheduleAlarm(planId, title, eventDate, alarmLabel, repeatLabel = '안 함', options = {}) {
  const { settings } = useAlarmSettings()
  if (!settings.schedule) return

  const occurrences = futureOccurrences(eventDate, alarmLabel, repeatLabel, options.endDate)
  if (occurrences.length === 0) return

  const hasPermission = await requestPermission()
  if (!hasPermission) return

  await cancelAlarm(planId)

  const notificationTitle = formatScheduleNotificationTitle(title)

  await LocalNotifications.schedule({
    notifications: occurrences.map(({ eventAt, notifyAt, index }) => ({
        id: index === 0
          ? createNotificationId(planId)
          : createNotificationId(`${planId}:${notifyAt.toISOString()}`),
        title: notificationTitle,
        body: '',
        largeBody: formatScheduleNotificationDetail(eventAt, options.allDay),
        schedule: {
          at: notifyAt,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_wally',
        channelId: NOTIFICATION_CHANNELS.schedule,
        autoCancel: true,
        extra: {
          planId: String(planId),
          occurrence: index,
          route: ROUTES.SCHEDULE,
          query: {
            date: formatDateQuery(eventAt),
            plan: String(planId),
          },
        },
      })),
  })
}

function timeToParts(value) {
  const [hour, minute] = String(value || '10:00').split(':').map(Number)
  return {
    hour: Number.isFinite(hour) ? hour : 10,
    minute: Number.isFinite(minute) ? minute : 0,
  }
}

export async function schedulePlanAlarm(plan) {
  if (!plan?.id || !plan.startDate || !plan.alarm || plan.alarm === '없음') return

  const { hour, minute } = timeToParts(plan.startTime)
  const start = plan.startDate
  const eventDate = new Date(
    start.year,
    start.month - 1,
    start.day,
    plan.allDay ? 9 : hour,
    plan.allDay ? 0 : minute,
  )

  await scheduleAlarm(plan.id, plan.title, eventDate, plan.alarm, plan.repeat, {
    allDay: plan.allDay,
    endDate: plan.endDate,
  })
}

export async function cancelAlarm(planId) {
  const legacyId = createNotificationId(planId)
  const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }))
  const ids = new Set([legacyId])

  pending.notifications
    .filter((notification) => String(notification.extra?.planId || '') === String(planId))
    .forEach((notification) => ids.add(notification.id))

  await LocalNotifications.cancel({
    notifications: [...ids].map((id) => ({ id })),
  }).catch(() => {})
}

export async function cancelAllScheduleAlarms(planIds = []) {
  const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }))
  const knownIds = new Set(planIds.map((planId) => createNotificationId(planId)))

  pending.notifications.forEach((notification) => {
    if (
      notification.channelId === NOTIFICATION_CHANNELS.schedule
      || notification.extra?.route === ROUTES.SCHEDULE
    ) {
      knownIds.add(notification.id)
    }
  })

  if (knownIds.size === 0) return
  await LocalNotifications.cancel({
    notifications: [...knownIds].map((id) => ({ id })),
  }).catch(() => {})
}

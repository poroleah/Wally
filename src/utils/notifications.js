import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { watch } from 'vue'
import { ROUTES } from '@/constants'
import { useAuth } from '@/composables/useAuth'

const ALLOWED_NOTIFICATION_ROUTES = new Set([
  ROUTES.SCHEDULE,
  ROUTES.FOOTPRINT,
  ROUTES.CHAT,
  ROUTES.SETTINGS,
])

export const NOTIFICATION_CHANNELS = Object.freeze({
  schedule: 'wally_schedule',
  abnormal: 'wally_abnormal',
})

const ANDROID_NOTIFICATION_CHANNELS = [
  {
    id: NOTIFICATION_CHANNELS.schedule,
    name: '일정 알림',
    description: '등록한 일정의 날짜와 시간을 알려드립니다.',
    importance: 3,
    visibility: 0,
    vibration: true,
    lights: true,
  },
  {
    id: NOTIFICATION_CHANNELS.abnormal,
    name: '이상행동 알림',
    description: '카메라에서 감지된 이상행동을 알려드립니다.',
    importance: 3,
    visibility: 0,
    vibration: true,
    lights: true,
  },
]

let actionListener = null
let stopAuthWatcher = null
let pendingTarget = null
let initialized = false

function normalizeQuery(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) return {}

  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, String(value)]),
  )
}

function notificationTarget(action) {
  const extra = action?.notification?.extra
  if (!extra || !ALLOWED_NOTIFICATION_ROUTES.has(extra.route)) return null

  return {
    path: extra.route,
    query: normalizeQuery(extra.query),
  }
}

function nativeThumbnailTarget() {
  if (Capacitor.getPlatform() !== 'android' || !window.WallyNotification?.consumeNavigation) return null
  try {
    const value = window.WallyNotification.consumeNavigation()
    if (!value) return null
    const target = JSON.parse(value)
    if (!ALLOWED_NOTIFICATION_ROUTES.has(target?.route)) return null
    return { path: target.route, query: normalizeQuery(target.query) }
  } catch {
    return null
  }
}

async function openNativeThumbnailTarget(router) {
  const target = nativeThumbnailTarget()
  if (!target) return
  pendingTarget = target
  await openPendingTarget(router)
}

async function openPendingTarget(router) {
  if (!pendingTarget) return

  const { isAuthenticated } = useAuth()
  if (!isAuthenticated.value) return

  const target = pendingTarget
  pendingTarget = null
  await router.push(target)
}

export async function getNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return 'granted'

  const { display } = await LocalNotifications.checkPermissions()
  return display
}

export async function ensureNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return true

  const current = await getNotificationPermission()
  if (current === 'granted') return true
  if (current === 'denied') return false

  const { display } = await LocalNotifications.requestPermissions()
  return display === 'granted'
}

export function createNotificationId(value) {
  const hash = String(value).split('').reduce(
    (result, character) => ((result << 5) - result + character.charCodeAt(0)) | 0,
    0,
  )
  return (hash & 0x7fffffff) || 1
}

export async function ensureNotificationChannels() {
  if (Capacitor.getPlatform() !== 'android') return

  await Promise.allSettled(
    ANDROID_NOTIFICATION_CHANNELS.map((channel) => LocalNotifications.createChannel(channel)),
  )
}

export async function initNotificationActions(router) {
  if (!Capacitor.isNativePlatform() || initialized) return
  initialized = true

  await router.isReady()
  await ensureNotificationChannels()

  actionListener = await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    async (action) => {
      const target = notificationTarget(action)
      if (!target) return

      pendingTarget = target
      await openPendingTarget(router)
    },
  )

  await openNativeThumbnailTarget(router)

  window.addEventListener('wally:notification-open', () => {
    void openNativeThumbnailTarget(router)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    void openNativeThumbnailTarget(router)
  })

  const { isAuthenticated } = useAuth()
  stopAuthWatcher = watch(isAuthenticated, (authenticated) => {
    if (authenticated) void openPendingTarget(router)
  })
}

export async function removeNotificationActionListener() {
  stopAuthWatcher?.()
  stopAuthWatcher = null
  await actionListener?.remove()
  actionListener = null
  pendingTarget = null
  initialized = false
}

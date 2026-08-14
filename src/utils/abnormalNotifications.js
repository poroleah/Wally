import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { watch } from 'vue'
import { useAlarmSettings } from '@/composables/useAlarmSettings'
import { fetchRealtimeEventPage, useRealtimeEvents } from '@/composables/useRealtimeEvents'
import { useAuth } from '@/composables/useAuth'
import { ROUTES } from '@/constants'
import { createApiUrl, getClipUrl } from '@/endpoints'
import {
  createNotificationId,
  ensureNotificationPermission,
  NOTIFICATION_CHANNELS,
} from '@/utils/notifications'

let initialized = false
const CLIP_LOOKUP_TIMEOUT_MS = 120_000
const CLIP_LOOKUP_INTERVAL_MS = 2_000
const pendingClipCounts = new Set()

function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatDateQuery(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function notificationMetadata(event) {
  const raw = event.raw || {}
  const date = formatDateQuery(event.clipDate || event.detectedAt)
  const clip = String(firstValue(raw.name, raw.clip_name, raw.clipName, raw.clip_id, raw.clipId) || '')
  const logId = String(firstValue(raw.event_id, raw.eventId, raw.id) || '')
  const clipCount = Number(event.clipCount ?? raw.clip_count)
  const targetId = clip || logId

  return {
    type: 'abnormal',
    eventKey: String(event.key || ''),
    date,
    clip,
    clipCount: Number.isInteger(clipCount) ? clipCount : null,
    logId,
    route: ROUTES.FOOTPRINT,
    query: {
      ...(date ? { date } : {}),
      ...(targetId ? { clip: targetId } : {}),
      ...(Number.isInteger(clipCount) ? { clip_count: clipCount } : {}),
    },
  }
}

function thumbnailUrl(event, authToken) {
  const raw = event.raw || {}
  const direct = String(firstValue(
    event.notificationThumbnail,
    event.thumbnail,
    raw.thumbnail,
    raw.thumbnail_url,
    raw.thumbnailUrl,
    raw.image_url,
    raw.imageUrl,
    raw.poster,
    raw.poster_url,
    raw.posterUrl,
  ) || '')

  if (direct) {
    return direct.startsWith('/') ? createApiUrl(direct) : direct
  }

  if (raw.name) return getClipUrl(raw.name, raw.size || 0, authToken)
  return String(event.clip || '')
}

function hasNotificationMedia(event) {
  return Boolean(thumbnailUrl(event, ''))
}

function wait(delay) {
  return new Promise((resolve) => window.setTimeout(resolve, delay))
}

async function resolveNotificationClip(event) {
  if (hasNotificationMedia(event)) return event

  const targetClipCount = Number(event.clipCount ?? event.raw?.clip_count)
  if (!Number.isInteger(targetClipCount) || targetClipCount < 1) return null

  const deadline = Date.now() + CLIP_LOOKUP_TIMEOUT_MS
  let lastTotal = null
  while (Date.now() < deadline) {
    try {
      const latestPage = await fetchRealtimeEventPage({ limit: 20, offset: 0 })
      if (latestPage.total !== lastTotal) {
        lastTotal = latestPage.total
        console.info(`[WallyNotification] waiting clip_count=${targetClipCount} clips_total=${latestPage.total}`)
      }

      if (latestPage.total >= targetClipCount) {
        const targetOffset = latestPage.total - targetClipCount
        const match = targetOffset < latestPage.items.length
          ? latestPage.items[targetOffset]
          : (await fetchRealtimeEventPage({ limit: 20, offset: targetOffset })).items[0]

        if (match?.clip && match.clipName) {
          console.info(`[WallyNotification] clip resolved clip_count=${targetClipCount} name=${match.clipName} media=true`)
          return {
            ...event,
            clipDate: match.date,
            thumbnail: match.thumbnail,
            clip: match.clip,
            raw: {
              ...event.raw,
              ...match.raw,
              name: match.clipName,
            },
          }
        }
      }
    } catch (error) {
      console.warn(`[WallyNotification] clip lookup failed clip_count=${targetClipCount}`, error)
    }

    await wait(CLIP_LOOKUP_INTERVAL_MS)
  }

  console.error(`[WallyNotification] clip lookup timed out clip_count=${targetClipCount}; notification skipped`)
  return null
}

async function showAbnormalNotification(event) {
  const { settings } = useAlarmSettings()
  if (!settings.abnormal || !event?.key) return

  const allowed = await ensureNotificationPermission()
  if (!allowed || !settings.abnormal) return

  const keyword = String(event.behavior || event.keywords?.[0] || '이상행동').trim()
  const detail = String(event.vlmText || '').trim() || `${keyword} 이상행동이 감지되었습니다.`
  const id = createNotificationId(`abnormal:${event.key}`)

  if (Capacitor.getPlatform() === 'android' && window.WallyNotification?.showAbnormal) {
    const { getToken } = useAuth()
    const authToken = getToken() || ''
    const initialMetadata = notificationMetadata(event)
    console.info(`[WallyNotification] posting immediate alert clip_count=${initialMetadata.clipCount}`)
    window.WallyNotification.showAbnormal(
      id,
      `'${keyword}' 이상행동이 감지되었습니다`,
      detail,
      '',
      authToken,
      initialMetadata.date || '',
      initialMetadata.clip || initialMetadata.logId || '',
      initialMetadata.clipCount ?? -1,
    )

    const resolvedEvent = await resolveNotificationClip(event)
    if (!resolvedEvent) return
    const metadata = notificationMetadata(resolvedEvent)
    const mediaSource = thumbnailUrl(resolvedEvent, authToken)
    if (!mediaSource) return

    console.info(`[WallyNotification] updating alert with image clip=${metadata.clip}`)
    window.WallyNotification.showAbnormal(
      id,
      `'${keyword}' 이상행동이 감지되었습니다`,
      detail,
      mediaSource,
      authToken,
      metadata.date || '',
      metadata.clip || metadata.logId || '',
      metadata.clipCount ?? -1,
    )
    return
  }

  const resolvedEvent = await resolveNotificationClip(event)
  event = resolvedEvent || event
  const metadata = notificationMetadata(event)
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: `'${keyword}' 이상행동이 감지되었습니다`,
        body: '',
        largeBody: detail,
        smallIcon: 'ic_stat_wally',
        channelId: NOTIFICATION_CHANNELS.abnormal,
        autoCancel: true,
        extra: metadata,
      },
    ],
  })
}

export function initAbnormalNotifications() {
  if (initialized) return
  initialized = true

  const { detectedKeywordEvent } = useRealtimeEvents()
  watch(detectedKeywordEvent, (event) => {
    const clipCount = Number(event?.clipCount)
    if (!event || !Number.isInteger(clipCount) || pendingClipCounts.has(clipCount)) return

    pendingClipCounts.add(clipCount)
    void showAbnormalNotification(event)
      .catch((error) => console.error(`[WallyNotification] clip_count=${clipCount} notification failed`, error))
      .finally(() => pendingClipCounts.delete(clipCount))
  })
}

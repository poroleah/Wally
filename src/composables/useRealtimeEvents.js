import { computed, reactive, readonly, ref, watch } from 'vue'
import { API_ENDPOINTS, getClipUrl, getEventsUrl } from '@/endpoints'
import { authJson } from './useFetch'
import { useAuth } from './useAuth'

const MAX_RECONNECT_DELAY = 30000
const DEFAULT_LIMIT = 20
const SAVED_EVENT_KEYS_STORAGE_KEY = 'wally:vlmSavedEventKeys'
const MAX_SAVED_EVENT_KEYS = 80

const events = ref([])
const latestEvent = ref(null)
const loading = ref(false)
const error = ref('')
const connected = ref(false)
const eventVersion = ref(0)
const lastPayload = ref(null)
const detectedKeywordEvent = ref(null)

const realtimeState = reactive(createDefaultRealtimeState())

let started = false
let eventSource = null
let reconnectTimer = null
let reconnectDelay = 1000
let lastClipCount = null
let lastListOptions = { limit: DEFAULT_LIMIT }
let savedEventKeys = loadSavedEventKeys()
const attemptedEventKeys = new Set()

export class RealtimeEventApiError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'RealtimeEventApiError'
    this.cause = cause
  }
}

function createDefaultRealtimeState() {
  return {
    uptime: '-',
    infer_raw: '',
    infer_ms: 0,
    event_triggered: false,
    frame_w: 0,
    frame_h: 0,
    pipeline_state: 'idle',
    pipeline_state_detail: 'waiting_for_vlm',
    pipeline_source_protocol: '',
    pipeline_source_transport: '',
    pipeline_active_for_s: null,
    pipeline_last_frame_age_s: null,
    pipeline_restart_count: 0,
    cfg_n_frames: 0,
    cpu_percent: 0,
    ram_used_mb: 0,
    ram_total_mb: 0,
    disk_used_mb: 0,
    disk_total_mb: 0,
    disk_free_mb: 0,
    disk_path: '',
    gpu_load: 0,
    cpu_temp: 0,
    gpu_temp: 0,
    ptz_pan: null,
    ptz_tilt: null,
    ptz_saved_pan: null,
    ptz_saved_tilt: null,
    inference_prompt: '',
    trigger_keywords: '',
    clip_count: 0,
    segment_recorder_state: 'disabled',
    segment_recorder_error: '',
    segment_recorder_segment_count: 0,
    segment_recorder_last_segment_age_s: null,
    vlm_state: 'initializing',
    vlm_error: '',
    vlm_models: [],
    vlm_current_model: '',
  }
}

function resetRealtimeState() {
  Object.assign(realtimeState, createDefaultRealtimeState())
  lastPayload.value = null
  lastClipCount = null
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.clips)) return value.clips
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.results)) return value.results
  if (Array.isArray(value?.events)) return value.events
  return []
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function loadSavedEventKeys() {
  if (!hasWindow()) return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_EVENT_KEYS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, MAX_SAVED_EVENT_KEYS) : []
  } catch {
    return []
  }
}

function persistSavedEventKeys() {
  if (!hasWindow()) return
  window.localStorage.setItem(SAVED_EVENT_KEYS_STORAGE_KEY, JSON.stringify(savedEventKeys.slice(0, MAX_SAVED_EVENT_KEYS)))
}

function rememberSavedEventKey(key) {
  if (!key) return
  savedEventKeys = [key, ...savedEventKeys.filter((item) => item !== key)].slice(0, MAX_SAVED_EVENT_KEYS)
  persistSavedEventKeys()
}

function splitTriggerKeywords(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function findMatchedKeywords(text, triggerText) {
  const lowerText = String(text || '').toLowerCase()
  if (!lowerText) return []
  return splitTriggerKeywords(triggerText).filter((keyword) => lowerText.includes(keyword.toLowerCase()))
}

function resolvePayloadTimestamp(payload = {}) {
  return toDate(firstValue(
    payload.timestamp,
    payload.detected_at,
    payload.detectedAt,
    payload.created_at,
    payload.createdAt,
    payload.time,
  )) || new Date()
}

function buildDetectedClipKey(payload = {}, matchedKeywords = []) {
  return String(firstValue(
    payload.event_id,
    payload.eventId,
    payload.clip_id,
    payload.clipId,
    payload.name,
    payload.clip_count !== undefined ? 'clip-count:' + payload.clip_count : '',
    payload.timestamp,
    payload.detected_at,
    [firstValue(payload.infer_raw, payload.vlm_text, payload.description) || '', matchedKeywords.join('|')].join('::'),
  ))
}

function trackDetectedKeywordEvent(payload = {}) {
  if (payload.event_triggered !== true) return false

  const vlmText = String(firstValue(payload.infer_raw, payload.vlm_text, payload.vlmText, payload.description, payload.detail) || '').trim()
  const triggerText = firstValue(payload.trigger_keywords, realtimeState.trigger_keywords)
  const matchedKeywords = findMatchedKeywords(vlmText, triggerText)
  if (!vlmText || matchedKeywords.length === 0) return false

  const clipCount = Number(payload.clip_count)
  if (!Number.isInteger(clipCount) || clipCount < 1) return false

  const eventKey = buildDetectedClipKey(payload, matchedKeywords)
  if (savedEventKeys.includes(eventKey) || attemptedEventKeys.has(eventKey)) return false
  attemptedEventKeys.add(eventKey)
  rememberSavedEventKey(eventKey)

  const detectedAt = resolvePayloadTimestamp(payload)
  detectedKeywordEvent.value = {
    key: eventKey,
    keywords: matchedKeywords,
    behavior: matchedKeywords[0],
    vlmText,
    detectedAt,
    clipCount,
    raw: payload,
  }
  console.info(`[WallyNotification] detection accepted clip_count=${clipCount} event_triggered=true`)
  return true
}

function toDate(value) {
  if (!value) return null
  if (typeof value === 'number') return new Date(value > 10_000_000_000 ? value : value * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatDateQuery(date) {
  if (!date) return ''
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function formatTime(date) {
  if (!date) return ''
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function resolveEventDate(item = {}) {
  return toDate(firstValue(
    item.timestamp,
    item.mtime,
    item.created_at,
    item.createdAt,
    item.detected_at,
    item.detectedAt,
    item.time,
  ))
}

function resolveThumbnailUrl(item = {}) {
  return firstValue(
    item.thumbnail,
    item.thumbnail_url,
    item.thumbnailUrl,
    item.image_url,
    item.imageUrl,
    item.poster,
    item.poster_url,
    item.posterUrl,
  ) || ""
}

function resolveClipUrl(item = {}) {
  const direct = firstValue(
    item.clip,
    item.clip_url,
    item.clipUrl,
    item.video_url,
    item.videoUrl,
    item.image_url,
    item.imageUrl,
    item.thumbnail,
    item.thumbnail_url,
  )
  if (direct) return direct
  if (!item.name) return ''
  const { getToken } = useAuth()
  return getClipUrl(item.name, item.size || 0, getToken())
}

export function normalizeRealtimeEvent(item = {}, index = 0) {
  const date = resolveEventDate(item)
  const keywords = Array.isArray(item.keywords) ? item.keywords : splitTriggerKeywords(firstValue(item.keywords, item.trigger_keywords, item.triggerKeywords))
  const behavior = firstValue(item.behavior_type, item.behaviorType, item.type, item.category, keywords[0], '이상행동')
  const detail = firstValue(item.vlm_text, item.vlmText, item.description, item.detail, item.message, item.summary)
  const recap = detail || `${behavior}이 감지되었습니다.`

  return {
    id: firstValue(item.id, item.event_id, item.name, `event-${index}`),
    clipName: item.name || '',
    date,
    dateQuery: formatDateQuery(date),
    time: formatTime(date),
    behavior,
    keywords,
    recap,
    detail: recap,
    clip: resolveClipUrl(item),
    thumbnail: resolveThumbnailUrl(item),
    mediaType: firstValue(item.media_type, item.mediaType, item.content_type, item.contentType, item.name?.split('.').pop()),
    raw: item,
  }
}

function resolveDateFilterQuery(date) {
  return date ? formatDateQuery(toDate(date) || new Date(date)) : ''
}

function resolveDateParam(value) {
  const date = toDate(value) || new Date(value)
  return Number.isNaN(date.getTime()) ? '' : formatDateQuery(date)
}

function buildEventListQuery({ date, dateFrom = null, dateTo = null, limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const params = new URLSearchParams()
  if (date) {
    const day = resolveDateParam(date)
    if (day) {
      params.set('date_from', day)
      params.set('date_to', day)
    }
  } else {
    const from = resolveDateParam(dateFrom)
    const to = resolveDateParam(dateTo)
    if (from) params.set('date_from', from)
    if (to) params.set('date_to', to)
  }
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return params
}

export async function fetchRealtimeEventList(options = {}) {
  const page = await fetchRealtimeEventPage(options)
  return page.items
}

export async function fetchRealtimeEventPage(options = {}) {
  try {
    const params = buildEventListQuery(options)
    params.set('_', String(Date.now()))
    const data = await authJson(`${API_ENDPOINTS.clips}?${params}`, { cache: 'no-store' })
    const targetDateQuery = resolveDateFilterQuery(options.date)
    const items = asArray(data).map(normalizeRealtimeEvent)
    const filteredItems = targetDateQuery ? items.filter((item) => item.dateQuery === targetDateQuery) : items
    const total = Number(data?.total)
    return {
      items: filteredItems,
      total: Number.isFinite(total) ? total : filteredItems.length,
    }
  } catch (e) {
    throw new RealtimeEventApiError('실시간 이벤트 목록을 불러오지 못했습니다.', e)
  }
}

export async function fetchRealtimeEventDateKeys({ year, month, limit = 500 } = {}) {
  if (!year || !month) return new Set()
  const dateFrom = new Date(year, month - 1, 1)
  const dateTo = new Date(year, month, 0)
  const items = await fetchRealtimeEventList({ dateFrom, dateTo, limit })
  return new Set(items.map((item) => item.dateQuery).filter(Boolean))
}

export async function fetchRealtimeEventListAll({ pageSize = 100, maxItems = 1000, ...options } = {}) {
  const items = []
  let offset = 0

  while (items.length < maxItems) {
    const limit = Math.min(pageSize, maxItems - items.length)
    const page = await fetchRealtimeEventList({ ...options, limit, offset })
    items.push(...page)
    if (page.length < limit) break
    offset += limit
  }

  return items
}

async function refreshEventList(options = lastListOptions) {
  loading.value = true
  error.value = ''
  lastListOptions = { ...lastListOptions, ...options }

  try {
    const nextEvents = await fetchRealtimeEventList(lastListOptions)
    events.value = nextEvents
    latestEvent.value = nextEvents[0] || null
    return nextEvents
  } catch (e) {
    error.value = e.message || '실시간 이벤트 목록을 불러오지 못했습니다.'
    throw e
  } finally {
    loading.value = false
  }
}

function closeRealtimeConnection() {
  connected.value = false
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

async function reconnectWithFreshToken(previousToken) {
  const { getToken, refreshAccessToken, isPersistentSession, logout } = useAuth()
  let nextToken = getToken()
  if (!nextToken) return

  if (nextToken === previousToken) {
    if (!isPersistentSession.value) {
      error.value = '실시간 이벤트 인증이 만료되었습니다. 다시 로그인해주세요.'
      logout({ revoke: false })
      return
    }

    const refreshed = await refreshAccessToken().catch(() => false)
    if (!refreshed) {
      error.value = '실시간 이벤트 인증이 만료되었습니다. 다시 로그인해주세요.'
      closeRealtimeConnection()
      return
    }
    nextToken = getToken()
  }

  openRealtimeConnection(nextToken)
}

function scheduleReconnect(token) {
  if (!token || reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    void reconnectWithFreshToken(token)
  }, reconnectDelay)
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
}

function handleRealtimePayload(payload = {}) {
  lastPayload.value = payload
  Object.assign(realtimeState, payload)

  trackDetectedKeywordEvent(payload)

  const nextClipCount = Number(payload.clip_count)
  if (!Number.isFinite(nextClipCount)) {
    eventVersion.value += 1
    return
  }

  if (lastClipCount === null) {
    lastClipCount = nextClipCount
    return
  }

  if (nextClipCount !== lastClipCount) {
    lastClipCount = nextClipCount
    eventVersion.value += 1
    void refreshEventList({ ...lastListOptions, limit: lastListOptions.limit || DEFAULT_LIMIT })
  }
}

function openRealtimeConnection(token) {
  closeRealtimeConnection()
  if (!token || typeof EventSource === 'undefined') return

  eventSource = new EventSource(getEventsUrl(token))

  eventSource.onopen = () => {
    connected.value = true
    reconnectDelay = 1000
    error.value = ''
  }

  eventSource.onmessage = (event) => {
    try {
      handleRealtimePayload(JSON.parse(event.data))
    } catch {
      // Malformed SSE payloads are ignored so the stream can keep running.
    }
  }

  eventSource.onerror = () => {
    closeRealtimeConnection()
    scheduleReconnect(token)
  }
}

function startRealtimeEvents() {
  if (started) return
  started = true

  const { accessToken } = useAuth()
  watch(accessToken, (token) => {
    reconnectDelay = 1000
    if (!token) {
      closeRealtimeConnection()
      resetRealtimeState()
      events.value = []
      latestEvent.value = null
      return
    }
    openRealtimeConnection(token)
  }, { immediate: true })
}

export function useRealtimeEvents() {
  startRealtimeEvents()

  return {
    events: readonly(events),
    latestEvent: readonly(latestEvent),
    loading: readonly(loading),
    error: readonly(error),
    connected: readonly(connected),
    eventVersion: readonly(eventVersion),
    state: readonly(realtimeState),
    lastPayload: readonly(lastPayload),
    detectedKeywordEvent: readonly(detectedKeywordEvent),
    hasError: computed(() => !!error.value),
    loadEvents: refreshEventList,
    refreshEvents: refreshEventList,
    trackDetectedKeywordEvent,
  }
}

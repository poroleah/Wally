import { computed, readonly, ref, watch } from 'vue'
import { useProfile } from './useProfile'
import { fetchRealtimeEventList, fetchRealtimeEventListAll, useRealtimeEvents } from './useRealtimeEvents'
import { pad2 } from '@/utils/date'

const logs = ref([])
const recentAlerts = ref([])
const loading = ref(false)
const error = ref('')
const loaded = ref(false)
const realtimeConnected = ref(false)
let lastLoadOptions = { limit: 20 }
let realtimeStarted = false

function formatDayAmpm(date) {
  if (!date) return '오늘'
  const now = new Date()
  const today = now.toDateString() === date.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const day = today ? '오늘' : yesterday.toDateString() === date.toDateString() ? '어제' : `${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
  return `${day} ${date.getHours() < 12 ? '오전' : '오후'}`
}

function normalizeAlertItem(log, index = 0) {
  const { name, profileImg } = useProfile()
  const petName = name.value || '반려동물'
  return {
    id: log.id || `event-alert-${index}`,
    type: '이상행동',
    title: '이상행동 감지',
    content: "'" + petName + "'가 '" + (log.behavior || '이상행동') + "' 행동을 보였어요!",
    dayAmpm: formatDayAmpm(log.date),
    time: log.time,
    icon: profileImg.value || '/icons/Setting/Profile_Img.svg',
    clip: log.clip,
    clipName: log.clipName,
    dateQuery: log.dateQuery,
  }
}

function replaceLogs(items = []) {
  logs.value = items
}

function replaceRecentAlerts(items = []) {
  recentAlerts.value = items
}


async function loadLogs({ date = null, dateFrom = null, dateTo = null, force = false, limit = 50, all = false, maxItems = 1000 } = {}) {
  if (loading.value || (loaded.value && !force && !date && !dateFrom && !dateTo && !all)) return

  lastLoadOptions = { date, dateFrom, dateTo, limit, all, maxItems }
  loading.value = true
  error.value = ''

  try {
    const items = all
      ? await fetchRealtimeEventListAll({ date, dateFrom, dateTo, pageSize: limit, maxItems })
      : await fetchRealtimeEventList({ date, dateFrom, dateTo, limit })
    replaceLogs(items)
    replaceRecentAlerts(items.map(normalizeAlertItem))
    loaded.value = true
  } catch (e) {
    error.value = '기록을 불러오지 못했습니다.'
    replaceLogs([])
    replaceRecentAlerts([])
  } finally {
    loading.value = false
  }
}



function startRealtimeLogs() {
  if (realtimeStarted) return
  realtimeStarted = true

  const realtime = useRealtimeEvents()

  watch(realtime.connected, (isConnected) => {
    realtimeConnected.value = isConnected
  }, { immediate: true })

  watch(realtime.eventVersion, () => {
    void loadLogs({ ...lastLoadOptions, force: true })
  })
}

export function useLogs() {
  const hasError = computed(() => !!error.value)
  const isEmpty = computed(() => !loading.value && !error.value && logs.value.length === 0)

  const allAnomalyAlarms = () => recentAlerts.value

  return {
    logs: readonly(logs),
    recentAlerts: readonly(recentAlerts),
    loading: readonly(loading),
    error: readonly(error),
    realtimeConnected: readonly(realtimeConnected),
    hasError,
    isEmpty,
    loadLogs,
    startRealtimeLogs,
    replaceLogs,
    replaceRecentAlerts,
    allAnomalyAlarms,
  }
}

<template>
  <div ref="listRef" :class="$style.list">
    <div v-if="loading && displayedAlarms.length === 0" :class="$style.stateText">알림을 불러오는 중</div>
    <div v-else-if="displayedAlarms.length === 0 && error" :class="$style.stateText">{{ error }}</div>
    <div v-else-if="displayedAlarms.length === 0" :class="$style.stateText">알림이 없습니다.</div>
    <div
      v-for="alarm in displayedAlarms"
      v-else
      :key="alarm.id"
      :ref="(element) => setAlarmElement(alarm.id, element)"
      :class="[$style.alarmMotion, leavingIds.has(alarm.id) ? $style.alarmExiting : '']"
    >
      <AlarmItem :alarm="alarm" @click="openAlarm(alarm)" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants'
import { usePlans } from '@/composables/usePlans'
import { useLogs } from '@/composables/useLogs'
import { useAlarmSettings } from '@/composables/useAlarmSettings'
import AlarmItem from './AlarmItem.vue'

const props = defineProps({
  activeTab: String,
})
const emit = defineEmits(['clearing'])
const router = useRouter()

const { allAlarms } = usePlans()
const { allAnomalyAlarms, loading, error, loadLogs, startRealtimeLogs } = useLogs()
const { settings } = useAlarmSettings()

const DISMISSED_ALARM_IDS_STORAGE_KEY = 'wally:dismissedAlarmIds:v2'
const ALARM_HISTORY_START = new Date(2020, 0, 1)
const MAX_ALARM_STACK = 20
const CLEAR_BASE_EXIT_MS = 160
const CLEAR_BASE_GAP_MS = 80
const CLEAR_MIN_EXIT_MS = 40
const CLEAR_MIN_GAP_MS = 18
function loadDismissedIds() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(DISMISSED_ALARM_IDS_STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveDismissedIds(ids) {
  window.localStorage.setItem(DISMISSED_ALARM_IDS_STORAGE_KEY, JSON.stringify([...ids]))
}

const displayedAlarms = ref([])
const leavingIds = ref(new Set())
const dismissedIds = ref(loadDismissedIds())
const clearing = ref(false)
const listRef = ref(null)
const alarmElements = new Map()

function setAlarmElement(id, element) {
  if (element) {
    alarmElements.set(id, element)
  } else {
    alarmElements.delete(id)
  }
}

onMounted(() => {
  startRealtimeLogs()
  loadLogs({ dateFrom: ALARM_HISTORY_START, dateTo: new Date(), force: true, limit: 100, all: true, maxItems: 100 })
})

function openAlarm(alarm) {
  if (clearing.value) return
  if (!alarm?.clipName && !alarm?.dateQuery) return
  router.push({
    path: ROUTES.FOOTPRINT,
    query: {
      ...(alarm.dateQuery ? { date: alarm.dateQuery } : {}),
      ...(alarm.clipName ? { clip: alarm.clipName } : {}),
    },
  })
}

function sameAlarmList(a, b) {
  return a.length === b.length && a.every((item, index) => item.id === b[index]?.id)
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getClearTiming(count) {
  const extraItems = Math.max(0, count - 1)
  return {
    exitMs: Math.max(CLEAR_MIN_EXIT_MS, CLEAR_BASE_EXIT_MS - extraItems * 6),
    gapMs: Math.max(CLEAR_MIN_GAP_MS, CLEAR_BASE_GAP_MS - extraItems * 3),
  }
}

const alarms = computed(() => [
  ...(settings.abnormal ? allAnomalyAlarms() : []),
  ...(settings.schedule ? allAlarms() : []),
])

const filtered = computed(() => (
  props.activeTab === '전체' ? alarms.value : alarms.value.filter(a => a.type === props.activeTab)
))

const visibleAlarms = computed(() => (
  filtered.value
    .filter(alarm => !dismissedIds.value.has(alarm.id))
    .slice(0, MAX_ALARM_STACK)
))

watch(visibleAlarms, (items) => {
  if (clearing.value) return
  if (sameAlarmList(displayedAlarms.value, items)) return
  displayedAlarms.value = [...items]
}, { immediate: true })

async function clearAlarms() {
  if (clearing.value || displayedAlarms.value.length === 0) return

  clearing.value = true
  emit('clearing', true)

  const allIds = displayedAlarms.value.map((alarm) => alarm.id)
  const listRect = listRef.value?.getBoundingClientRect()
  const visibleIds = allIds.filter((id) => {
    const element = alarmElements.get(id)
    if (!element || !listRect) return false
    const rect = element.getBoundingClientRect()
    return rect.bottom > listRect.top && rect.top < listRect.bottom
  })
  const visibleIdSet = new Set(visibleIds)
  const hiddenIds = allIds.filter((id) => !visibleIdSet.has(id))

  if (hiddenIds.length > 0) {
    const hiddenIdSet = new Set(hiddenIds)
    displayedAlarms.value = displayedAlarms.value.filter((alarm) => !hiddenIdSet.has(alarm.id))
  }

  const animatedIds = [...visibleIds].reverse()
  const { exitMs, gapMs } = getClearTiming(animatedIds.length)

  for (const id of animatedIds) {
    leavingIds.value = new Set([...leavingIds.value, id])
    await wait(exitMs)
    displayedAlarms.value = displayedAlarms.value.filter((alarm) => alarm.id !== id)
    leavingIds.value = new Set([...leavingIds.value].filter((leavingId) => leavingId !== id))
    await wait(gapMs)
  }

  dismissedIds.value = new Set([...dismissedIds.value, ...allIds])
  saveDismissedIds(dismissedIds.value)
  clearing.value = false
  emit('clearing', false)
}

defineExpose({ clearAlarms })
</script>

<style module>
.list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  padding: 1.6rem 2rem calc(1.6rem + var(--wally-safe-bottom, env(safe-area-inset-bottom)));
  scroll-padding-bottom: calc(1.6rem + var(--wally-safe-bottom, env(safe-area-inset-bottom)));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.alarmMotion {
  transform: translateY(0);
  opacity: 1;
  transition:
    opacity 0.16s ease,
    transform 0.16s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: opacity, transform;
}
.alarmExiting {
  opacity: 0;
  transform: translateX(-8rem);
  pointer-events: none;
}
.stateText {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--log-muted);
  font-family: 'Malang', sans-serif;
  font-size: var(--alarm-state-font);
  text-align: center;
}
</style>

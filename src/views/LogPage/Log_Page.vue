<template>
  <div :class="$style.page">
    <LogHeader />
    <div :class="$style.dateCard">
      <span :class="$style.dateText">{{ displayDate }}</span>
      <img src="/icons/Log/Arrow_Right.svg" :class="[$style.dateArrow, $style.dateArrowPrev]" @click="prevDate" />
      <img src="/icons/Log/Arrow_Right.svg" :class="[$style.dateArrow, $style.dateArrowNext]" @click="nextDate" />
    </div>
    <div :class="$style.logListWrapper">
      <div :class="[$style.logList, hasStateCard && $style.stateLogList]">
        <div v-if="!hasStateCard" :class="$style.timelineLine" />
        <div v-if="!hasStateCard" :class="$style.timelineDot" />
        <div v-if="loading" :class="$style.stateText">기록을 불러오는 중</div>
        <div v-else-if="error" :class="$style.stateText">{{ error }}</div>
        <div v-else-if="isEmpty" :class="$style.stateText">기록이 없습니다.</div>
        <LogItem
          v-else
          v-for="(item, index) in logs"
          :key="item.id || index"
          :data-log-id="item.clipName || item.id"
          :class="isActiveLog(item) ? $style.activeLogItem : ''"
          :time="item.time"
          :recap="item.recap"
          :clip="item.clip"
          :thumbnail="item.thumbnail"
          :mediaType="item.mediaType"
          :detail="item.detail"
          :isLast="index === logs.length - 1"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import LogHeader from './Log_Header.vue'
import LogItem from './Log/Log.vue'
import { useLogs } from '@/composables/useLogs'

const route = useRoute()
function parseDateParam(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

const current = ref(route.query.date ? parseDateParam(route.query.date) : new Date())
const activeClipId = computed(() => String(route.query.clip || ''))

const displayDate = computed(() => {
  const y = current.value.getFullYear()
  const m = String(current.value.getMonth() + 1).padStart(2, '0')
  const d = String(current.value.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}.`
})

const prevDate = () => {
  const d = new Date(current.value)
  d.setDate(d.getDate() - 1)
  current.value = d
}

const nextDate = () => {
  const d = new Date(current.value)
  d.setDate(d.getDate() + 1)
  current.value = d
}

const { logs, loading, error, isEmpty, loadLogs, startRealtimeLogs } = useLogs()
const hasStateCard = computed(() => loading.value || error.value || isEmpty.value)

async function loadCurrentDate() {
  await loadLogs({ date: current.value, force: true })
  await scrollToActiveClip()
}

async function scrollToActiveClip() {
  if (!activeClipId.value) return
  await nextTick()
  const target = document.querySelector(`[data-log-id="${CSS.escape(activeClipId.value)}"]`)
  target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function isActiveLog(item) {
  if (!activeClipId.value) return false
  return item.id === activeClipId.value || item.clipName === activeClipId.value
}

onMounted(() => {
  startRealtimeLogs()
  loadCurrentDate()
})

watch(current, () => {
  loadCurrentDate()
})

watch(() => route.query.date, (date) => {
  if (!date) return
  const next = parseDateParam(date)
  if (!Number.isNaN(next.getTime())) current.value = next
})

watch(activeClipId, () => {
  scrollToActiveClip()
})
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
.page {
  position: fixed;
  inset: 0;
  background-color: var(--log-bg);
  color: var(--log-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dateCard {
  width: calc(100% - 4rem);
  margin: 0.8rem 2rem;
  height: 4.8rem;
  background: var(--log-surface);
  box-shadow: inset 0 0 0 0.06rem var(--log-border), var(--log-shadow);
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.dateText {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
}
.dateArrow {
  position: absolute;
  top: 50%;
  width: 2.4rem;
  height: 2.4rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  filter: var(--log-icon-filter);
}
.dateArrowPrev {
  left: 0;
  transform: translateY(-50%);
}
.dateArrowNext {
  right: 0;
  transform: translateY(-50%) rotate(180deg);
}
.logListWrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  padding-left: 2rem;
  overflow-y: auto;
  padding-bottom: 8rem;
}
.timelineLine {
  position: absolute;
  left: 0.8rem;
  top: 0.9rem;
  bottom: 0;
  width: 0.1rem;
  background-color: var(--log-muted);
  transform: translateX(-50%);
}
.timelineDot {
  position: absolute;
  left: 0.8rem;
  top: 0.9rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--log-muted);
  transform: translateX(-50%);
}
.logList {
  position: relative;
  display: flex;
  flex-direction: column;
}
.stateLogList {
  justify-content: center;
}
.activeLogItem {
  border-radius: 1rem;
  background-color: var(--log-accent-soft);
}
.stateText {
  width: calc(100% - 2rem);
  min-height: 0;
  margin: 0 2rem 0 0;
  color: var(--log-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Malang', sans-serif;
  font-size: 1rem;
  text-align: center;
}
@media (min-width: 48rem) and (orientation: portrait) {
  .dateCard {
    height: 5.8rem;
    margin: 1rem 2rem;
  }

  .dateText {
    font-size: 1.45rem;
  }

  .dateArrow {
    width: 3rem;
    height: 3rem;
  }

  .dateArrowPrev {
    left: 0.6rem;
  }

  .dateArrowNext {
    right: 0.6rem;
  }

  .logListWrapper {
    padding-left: 2.4rem;
  }

  .timelineLine,
  .timelineDot {
    left: 1rem;
  }

  .timelineDot {
    width: 0.62rem;
    height: 0.62rem;
  }

  .stateText {
    font-size: 1.28rem;
  }
}

</style>

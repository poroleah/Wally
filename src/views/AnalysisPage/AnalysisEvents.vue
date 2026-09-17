<template>
  <section :class="$style.events">
    <p v-if="items.length > 0" :class="$style.summary">총 {{ items.length }}건의 이벤트가 감지됐어요.</p>

    <div :class="$style.listWrapper">
      <div :class="[$style.list, hasStateText && $style.stateList]">
        <template v-if="!hasStateText">
          <div :class="$style.timelineLine" />
          <div :class="$style.timelineDot" />
        </template>
        <div v-if="hasStateText" :class="$style.stateText">
          발견된 이벤트가 없어요..
        </div>
        <template v-else>
          <LogItem
            v-for="(item, index) in items"
            :key="item.id || index"
            :time="item.time"
            :recap="item.recap"
            :clip="item.clip"
            :thumbnail="item.thumbnail"
            :mediaType="item.mediaType"
            :detail="item.detail"
            :isLast="index === items.length - 1"
          />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import LogItem from '@/views/LogPage/Log/Log.vue'
import { useLogs } from '@/composables/useLogs'

// 이벤트 탭 — 타임라인 페이지와 같은 이벤트 목록(useLogs)을 그날 기준으로 보인다.
const props = defineProps({
  date: { type: Date, required: true },
})

const { logs, loadLogs } = useLogs()

// 화면 확인용 하드코딩 이벤트 3건 — true로 켜면 서버 데이터가 없을 때 대신 보인다.
const SHOW_SAMPLE_EVENTS = false
const sampleThumb = (fill) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="${fill}"/></svg>`)
const SAMPLE_EVENTS = [
  { id: 'sample-1', time: '12:35', recap: '콩돌이가 10초 간격으로 3번 긁기 행동을 함', clip: sampleThumb('#d9cbb8'), mediaType: 'image' },
  { id: 'sample-2', time: '09:03', recap: '콩돌이가 1분내로 5번 헐떡거림', clip: sampleThumb('#cbbba6'), mediaType: 'image' },
  { id: 'sample-3', time: '08:49', recap: '콩돌이가 1분내로 5번 헐떡거림', clip: sampleThumb('#bfae99'), mediaType: 'image' },
]

const items = computed(() => (logs.value.length > 0 || !SHOW_SAMPLE_EVENTS ? logs.value : SAMPLE_EVENTS))
const hasStateText = computed(() => items.value.length === 0)

function load() {
  loadLogs({ date: props.date, force: true })
}

onMounted(load)
watch(() => props.date, load)
</script>

<style module>
/* 시안(1배율, px = 0.1rem): 요약 문구 top 142px(토글 아래 1.6rem), 목록 top 165px */
.events {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  /* 페이지 좌우 2rem 패딩을 상쇄 — LogItem이 자체 2rem 여백을 갖는다(타임라인 페이지와 동일) */
  margin: 1.6rem -2rem 0;
}
.summary {
  margin: 0 2rem;
  font-size: 1.2rem;
  line-height: 1.5;
  color: var(--log-text);
  opacity: 0.8;
  text-align: center;
}
.listWrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin-top: 0.5rem;
  padding-left: 2rem;
  padding-bottom: 2rem;
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
.list {
  position: relative;
  display: flex;
  flex-direction: column;
}
/* 빈 상태 시안: 문구만 화면 중앙(1.6rem, muted) */
.stateList {
  flex: 1;
  justify-content: center;
}
.stateText {
  width: calc(100% - 2rem);
  margin: 0 2rem 0 0;
  color: var(--log-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  text-align: center;
}

@media (min-width: 48rem) and (orientation: portrait) {
  .summary { font-size: 1.45rem; }
  .listWrapper { padding-left: 2.4rem; }
}
</style>

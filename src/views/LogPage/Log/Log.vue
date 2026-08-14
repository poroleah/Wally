<template>
  <div :class="$style.logItem">
    <LogTime :time="time" />
    <LogClip :clip="clip" :thumbnail="thumbnail" :mediaType="mediaType" :detail="detail || recap" />
    <LogRecap v-if="!clip" :recap="recap" />
    <div v-if="!isLast" :class="$style.divider" />
  </div>
</template>

<script setup>
import LogTime from './Time.vue'
import LogRecap from './Recap.vue'
import LogClip from './Clip.vue'

defineProps({
  time: String,
  recap: String,
  clip: String,
  thumbnail: String,
  mediaType: String,
  detail: String,
  isLast: Boolean,
})
</script>

<style module>
.logItem {
  width: calc(100% - 4rem);
  margin: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.6rem 0 0;
}
.divider {
  width: 100%;
  height: 0.05rem;
  background-color: var(--log-muted);
  margin-top: 0.3rem;
}
</style>

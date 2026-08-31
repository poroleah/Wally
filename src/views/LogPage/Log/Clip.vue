<template>
  <div v-if="clip" :class="$style.wrapper">
  <div :class="$style.clipBox" @click="isDetailOpen = true">
    <img v-if="thumbnailSrc" :src="thumbnailSrc" alt="클립 썸네일" :class="$style.clipImg" />
    <video
      v-else-if="isVideo"
      ref="videoRef"
      :src="clip"
      :class="$style.captureVideo"
      preload="auto"
      muted
      playsinline
      crossorigin="anonymous"
      @loadeddata="handleVideoLoaded"
      @seeked="captureVideoFrame"
    />
    <img v-else :src="clip" alt="클립 썸네일" :class="$style.clipImg" />
  </div>
    <div v-if="detail" :class="$style.detailRow">
      <img src="/icons/Log/Note.svg" alt="" :class="$style.iconNote" />
      <div :class="$style.detail">{{ detail }}</div>
    </div>
  </div>

  <ClipDetail v-model="isDetailOpen" :clip="clip" :mediaType="mediaType" :detail="detail" />
</template>

<script setup>
import { computed, ref } from 'vue'
import ClipDetail from '@/components/Media/ClipDetail.vue'
const props = defineProps({ clip: String, thumbnail: String, mediaType: String, detail: String })
const videoRef = ref(null)
const capturedThumbnail = ref('')
const isDetailOpen = ref(false)

const isVideo = computed(() => {
  const value = `${props.mediaType || props.clip || ''}`.toLowerCase()
  return ['mp4', 'webm', 'mov', 'video'].some((type) => value.includes(type))
})
const thumbnailSrc = computed(() => props.thumbnail || capturedThumbnail.value || (!isVideo.value ? props.clip : ''))

function captureVideoFrame() {
  const video = videoRef.value
  if (!video || capturedThumbnail.value) return
  try {
    const canvas = document.createElement('canvas')
    const width = Math.min(960, video.videoWidth || 960)
    const height = Math.max(1, Math.round(width * (video.videoHeight || 540) / (video.videoWidth || 960)))
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    context?.drawImage(video, 0, 0, canvas.width, canvas.height)
    capturedThumbnail.value = canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    capturedThumbnail.value = ''
  }
}

function handleVideoLoaded() {
  const video = videoRef.value
  if (!video) return
  const targetTime = Math.min(0.2, Math.max(0, (video.duration || 0) / 2))
  if (targetTime > 0 && Math.abs(video.currentTime - targetTime) > 0.01) {
    video.currentTime = targetTime
    return
  }
  captureVideoFrame()
}
</script>

<style module>
.wrapper {
  width: 100%;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (orientation: landscape) {
  .wrapper {
    background-color: #000;
  }
}
.clipBox {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 1rem;
  overflow: hidden;
  background: var(--log-surface-soft);
  box-shadow: inset 0 0 0 0.06rem var(--log-border), var(--log-shadow);
  position: relative;
}
@media (orientation: landscape) {
  .clipBox {
    width: auto;
    height: 50vh;
    margin: 0 auto;
  }
}
.clipImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  -webkit-tap-highlight-color: transparent;
}
.captureVideo {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.detailRow {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}
.iconNote {
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
  margin-top: 0.2rem;
  filter: var(--log-icon-filter);
}
.detail {
  flex: 1;
  min-width: 0;
  font-family: 'Malang', sans-serif;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--log-text);
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>

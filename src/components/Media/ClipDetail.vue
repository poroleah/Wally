<template>
  <Teleport to="body">
    <Transition name="clipfade">
      <div v-if="modelValue" class="clip-backdrop" @click="$emit('update:modelValue', false)" />
    </Transition>
    <Transition name="slideup">
      <div v-if="modelValue" :class="$style.planRegister">
        <SheetHeader title="영상보기" @close="$emit('update:modelValue', false)" />
        <div :class="$style.cilpDetail">
          <div :class="$style.clipWrapper">
            <div :class="$style.clipBox">
              <video
                v-if="isVideo"
                ref="videoRef"
                :class="[$style.cilpGroupIcon, !videoReady && $style.videoHidden]"
                :src="clip"
                autoplay
                :muted="isMuted"
                loop
                playsinline
                preload="auto"
                @loadeddata="startDetailVideo"
                @playing="videoReady = true"
              />
              <img v-else :class="$style.cilpGroupIcon" :src="clip" alt="" />
              <div v-if="isVideo && !videoReady" :class="$style.videoLoading">
                <img src="/icons/Brand/Logo_Mark_Dark.svg" :class="$style.loadingLogo" alt="" />
              </div>
              <div :class="$style.clipOverlay">
                <button type="button" :class="$style.iconBtn" aria-label="음소거" @click.stop="toggleMuted">
                  <img :src="isMuted ? '/icons/Log/Sound_Mute_Log.svg' : '/icons/Log/Sound_On.svg'" :class="$style.soundIcon" alt="" />
                </button>
                <button type="button" :class="[$style.iconBtn, isExpandPressed && $style.iconBtnPressed]" aria-label="확대" @click.stop="openExpanded">
                  <img src="/icons/Log/Zoom_Log.svg" :class="$style.soundIcon" alt="" />
                </button>
              </div>
            </div>
          </div>
          <div :class="$style.detailRow">
            <img :class="$style.iconNote" src="/icons/Log/Note.svg" alt="" />
            <div :class="$style.detail">{{ analysisText }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  <Teleport to="body">
    <div v-if="isExpanded" :class="$style.fullscreen" @click="isExpanded = false">
      <video
        v-if="isVideo"
        ref="expandedVideoRef"
        :src="clip"
        :class="[$style.fullImg, !expandedVideoReady && $style.videoHidden]"
        autoplay
        :muted="isMuted"
        loop
        playsinline
        preload="auto"
        @loadeddata="startExpandedVideo"
        @playing="expandedVideoReady = true"
      />
      <img v-else :src="clip" alt="" :class="$style.fullImg" />
      <div v-if="isVideo && !expandedVideoReady" :class="$style.fullscreenLoading">
        <img src="/icons/Brand/Logo_Mark_Dark.svg" :class="$style.loadingLogo" alt="" />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SheetHeader from '@/components/Sheet/SheetHeader.vue'

const props = defineProps({ modelValue: Boolean, clip: String, mediaType: String, detail: String, description: String, analysisText: String, summary: String })
const emit = defineEmits(['update:modelValue'])

const videoRef = ref(null)
const expandedVideoRef = ref(null)
const isMuted = ref(true)
const isExpanded = ref(false)
const videoReady = ref(false)
const expandedVideoReady = ref(false)
const isExpandPressed = ref(false)
let expandTimer = null

const analysisText = computed(() => props.detail || props.description || props.analysisText || props.summary || 'AI 분석 결과를 불러오지 못했습니다.')
const isVideo = computed(() => {
  const value = `${props.mediaType || props.clip || ''}`.toLowerCase()
  return ['mp4', 'webm', 'mov', 'video'].some((type) => value.includes(type))
})

function toggleMuted() {
  isMuted.value = !isMuted.value
  if (videoRef.value) videoRef.value.muted = isMuted.value
}

function playWhenReady(video) {
  if (!video) return
  video.muted = isMuted.value
  void video.play().catch(() => {})
}

function startDetailVideo() {
  playWhenReady(videoRef.value)
}

function startExpandedVideo() {
  playWhenReady(expandedVideoRef.value)
}

function openExpanded() {
  if (expandTimer) clearTimeout(expandTimer)
  isExpandPressed.value = true
  expandTimer = setTimeout(() => {
    isExpandPressed.value = false
    expandedVideoReady.value = false
    isExpanded.value = true
    expandTimer = null
  }, 140)
}

function closeDetail() {
  emit('update:modelValue', false)
}

function handleAndroidBack(event) {
  if (isExpanded.value) {
    event.preventDefault()
    isExpanded.value = false
    return
  }

  if (!props.modelValue) return
  event.preventDefault()
  closeDetail()
}

watch(() => props.modelValue, (open) => {
  if (open) videoReady.value = false
  if (!open) isExpanded.value = false
})

watch(() => props.clip, () => {
  videoReady.value = false
  expandedVideoReady.value = false
})

onMounted(() => {
  window.addEventListener('wally:android-back', handleAndroidBack)
})

onBeforeUnmount(() => {
  window.removeEventListener('wally:android-back', handleAndroidBack)
  if (expandTimer) clearTimeout(expandTimer)
})
</script>

<style module>
.planRegister {
  --settings-text: var(--log-text);
  --settings-icon-filter: var(--log-icon-filter);
  --settings-close-icon-filter: var(--log-close-icon-filter);
  --settings-close-icon-shadow: var(--log-close-icon-shadow);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--log-bg);
  overflow-y: auto;
  text-align: center;
  font-size: 1.6rem;
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
  z-index: 300;
  display: flex;
  flex-direction: column;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.cilpDetail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 0 2rem 2rem;
  text-align: left;
  font-size: 1rem;
  overflow-y: auto;
}
.clipWrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}
@media (orientation: landscape) {
  .clipWrapper {
    background-color: #000;
  }
}
.clipBox {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 1rem;
  overflow: hidden;
  background: var(--log-surface-soft);
  box-shadow: inset 0 0 0 0.06rem var(--log-border), var(--log-shadow);
}
@media (orientation: landscape) {
  .clipBox {
    width: auto;
    height: 50vh;
    border-radius: 0;
  }
}
.cilpGroupIcon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.videoHidden {
  opacity: 0;
}
.videoLoading,
.fullscreenLoading {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
  pointer-events: none;
}
.loadingLogo {
  width: 100%;
  height: 90px;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  object-fit: contain;
}
.clipOverlay {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 2;
}
.clipOverlay > * {
  pointer-events: auto;
}
.iconBtn {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--log-surface-soft);
  cursor: pointer;
  transition: transform 0.14s ease, filter 0.14s ease;
  -webkit-tap-highlight-color: transparent;
}
.iconBtn:active,
.iconBtnPressed {
  transform: scale(0.86);
  filter: brightness(0.94);
}
.soundIcon {
  width: 2rem;
  height: 2rem;
  display: block;
}
.fullscreen {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.fullscreenLoading {
  z-index: 401;
}
.fullImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.detailRow {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}
.iconNote {
  filter: var(--log-icon-filter);
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  margin-top: 0.2rem;
}
.detail {
  flex: 1;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--log-text);
  white-space: pre-line;
}
</style>

<style>
.clip-backdrop {
  position: fixed;
  inset: 0;
  z-index: 299;
  background-color: rgba(0, 0, 0, 0.4);
}
.clipfade-enter-active,
.clipfade-leave-active {
  transition: opacity 0.3s ease;
}
.clipfade-enter-from,
.clipfade-leave-to {
  opacity: 0;
}
.slideup-enter-active,
.slideup-leave-active {
  transition: transform 0.35s ease;
}
.slideup-enter-from,
.slideup-leave-to {
  transform: translateY(100%);
}
</style>

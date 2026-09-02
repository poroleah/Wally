<template>
  <div class="homeDrawer" role="dialog" aria-label="말하기">
    <button type="button" class="closeButton" aria-label="닫기" @click="emit('close')">
      <span class="iconClose" aria-hidden="true"></span>
    </button>
    <b class="title">말하기</b>
    <button type="button" class="micGroup" :class="{ micGroupOn: isMicOn }" :aria-pressed="isMicOn" :aria-busy="isMicPending" :disabled="isMicPending" aria-label="마이크 켜기/끄기" @click="toggleMic">
      <img class="micLayer micOuter" src="/icons/Home/Bar/Mic/Ellipse 1.svg" alt="" />
      <img class="micLayer micMiddle" src="/icons/Home/Bar/Mic/Ellipse 2.svg" alt="" />
      <img class="micLayer micInner" src="/icons/Home/Bar/Mic/Ellipse 3.svg" alt="" />
      <img class="micIcon" src="/icons/Home/Bar/Mic/Frame.svg" alt="" />
    </button>
    <div class="barGroup" aria-hidden="true">
      <span v-for="(bar, i) in bars" :key="i" class="micBar" :style="bar"></span>
    </div>
    <span v-if="isMicOn" class="statusChip">
      <span class="statusChipDot"></span>전송 중
    </span>
    <div class="volHead">
      <span class="volLabel">스피커 음량</span>
      <span class="volValue">{{ volume }}%</span>
    </div>
    <div class="soundBar">
      <button type="button" class="soundIconBtn" aria-label="음량 줄이기" @click="slideVolumeTo(Math.max(volume - 20, 0))">
        <span class="soundIcon soundIconMute" aria-hidden="true"></span>
      </button>
      <input
        v-model.number="volume"
        type="range"
        class="volRange"
        min="0"
        max="100"
        step="5"
        aria-label="스피커 음량"
        :style="{ backgroundImage: volumeFill }"
        @pointerdown="stopVolumeSlide"
      >
      <button type="button" class="soundIconBtn" aria-label="음량 키우기" @click="slideVolumeTo(Math.min(volume + 20, 100))">
        <span class="soundIcon soundIconOn" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const emit = defineEmits(['close'])

const VOLUME_STORAGE_KEY = 'wally:speakerVolume'

function loadStoredVolume() {
  try {
    const stored = Number(localStorage.getItem(VOLUME_STORAGE_KEY))
    if (Number.isFinite(stored) && stored >= 0 && stored <= 100) {
      return Math.round(stored / 5) * 5
    }
  } catch { /* 저장소 접근 불가 시 기본값 */ }
  return 50
}

const volume = ref(loadStoredVolume())
watch(volume, (v) => {
  try { localStorage.setItem(VOLUME_STORAGE_KEY, String(v)) } catch { /* noop */ }
  // 단계 이동마다 짧은 진동 틱 — 드르륵 감각 (지원 기기 한정)
  try { navigator.vibrate?.(8) } catch { /* noop */ }
})
const volumeFill = computed(() =>
  `linear-gradient(to right, #ffb085 ${volume.value}%, #eee8de ${volume.value}%)`,
)

// 아이콘 버튼으로 0%/100% 이동 시 5%씩 드르륵 훑으며 이동
let volumeSlideTimer = null

function stopVolumeSlide() {
  window.clearInterval(volumeSlideTimer)
  volumeSlideTimer = null
}

function slideVolumeTo(target) {
  stopVolumeSlide()
  const direction = target > volume.value ? 5 : -5
  if (volume.value === target) return
  volumeSlideTimer = window.setInterval(() => {
    const next = volume.value + direction
    volume.value = direction > 0 ? Math.min(next, target) : Math.max(next, target)
    if (volume.value === target) stopVolumeSlide()
  }, 24)
}
const isMicOn = ref(false)
const isMicPending = ref(false)
const targetAmplitude = ref(0)
const currentAmplitude = ref(0)
const waveTime = ref(0)

let animationFrame = 0
let audioContext
let analyser
let timeData
let mediaStream

const toggleMic = async () => {
  if (isMicPending.value) return

  if (isMicOn.value) {
    isMicOn.value = false
    stopWaveLoop()
    return
  }

  isMicPending.value = true
  const ready = await startAudioInput()
  isMicPending.value = false

  if (!ready) {
    isMicOn.value = false
    return
  }

  isMicOn.value = true
  startWaveLoop()
}

// 시안 기준 막대 높이 프로필(px): 가운데가 봉우리인 10개 막대
const BAR_HEIGHTS = [6, 8, 10, 22, 30, 14, 16, 12, 8, 6]
const bars = computed(() => BAR_HEIGHTS.map((maxPx, i) => {
  if (!isMicOn.value) return { height: '0.4rem', opacity: 0.35 }

  const wobble = 0.5 + 0.5 * Math.sin(waveTime.value * (2.1 + (i % 4) * 0.55) + i * 1.7)
  const strength = Math.min(currentAmplitude.value * (0.45 + wobble * 0.55) * 1.6, 1)
  return {
    height: `${(0.4 + (maxPx / 10 - 0.4) * strength).toFixed(2)}rem`,
    opacity: Number((0.55 + strength * 0.45).toFixed(2)),
  }
}))

const readMicLevel = () => {
  if (!analyser || !timeData) return 0

  analyser.getByteTimeDomainData(timeData)
  const total = timeData.reduce((sum, value) => {
    const centered = (value - 128) / 128
    return sum + centered * centered
  }, 0)
  const rms = Math.sqrt(total / timeData.length)

  return Math.min(Math.max((rms - 0.01) * 8.5, 0), 1)
}

const startAudioInput = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: false,
        noiseSuppression: false,
      },
    })
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    audioContext = new AudioContextClass()
    await audioContext.resume()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.68
    timeData = new Uint8Array(analyser.fftSize)
    audioContext.createMediaStreamSource(mediaStream).connect(analyser)
    return true
  } catch {
    analyser = undefined
    timeData = undefined
    mediaStream?.getTracks().forEach((track) => track.stop())
    mediaStream = undefined
    void audioContext?.close()
    audioContext = undefined
    return false
  }
}

const startWaveLoop = () => {
  cancelAnimationFrame(animationFrame)

  const draw = () => {
    waveTime.value += 0.045
    targetAmplitude.value = readMicLevel()
    currentAmplitude.value += (targetAmplitude.value - currentAmplitude.value) * 0.12
    animationFrame = requestAnimationFrame(draw)
  }

  if (analyser && timeData) draw()
}

const stopWaveLoop = () => {
  cancelAnimationFrame(animationFrame)
  animationFrame = 0
  targetAmplitude.value = 0
  currentAmplitude.value = 0
  analyser = undefined
  timeData = undefined

  mediaStream?.getTracks().forEach((track) => track.stop())
  mediaStream = undefined

  void audioContext?.close()
  audioContext = undefined
}


onBeforeUnmount(() => {
  stopVolumeSlide()
  stopWaveLoop()
})
</script>

<style scoped>
.homeDrawer {
  position: relative;
  z-index: 90;
  width: 100%;
  flex: 1 1 auto;
  /* 절대 배치된 스피커 음량 영역(~31rem)까지 항상 담기도록 최소 높이 고정 */
  min-height: 31.6rem;
  margin-top: 2.4rem;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--home-panel-bg);
  overflow: hidden;
  text-align: center;
  font-size: 1.6rem;
  color: var(--home-text);
  font-family: Malang, "Hancom MalangMalang", sans-serif;
  box-shadow: 0 -1.2rem 2.4rem rgba(45, 41, 38, 0.08);
}

.closeButton {
  position: absolute;
  top: 1.4rem;
  left: 2rem;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.closeButton:focus,
.closeButton:focus-visible,
.micGroup:focus,
.micGroup:focus-visible {
  outline: none;
}

.iconClose {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-text);
  mask: url("/icons/Common/Close.svg") center / contain no-repeat;
  -webkit-mask: url("/icons/Common/Close.svg") center / contain no-repeat;
}

.title {
  position: absolute;
  width: 6.2rem;
  top: 1.4rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-block;
  height: 2.4rem;
  font-family: MalangBold, Malang, "Hancom MalangMalang", sans-serif;
}

.micGroup {
  position: absolute;
  top: 6.4rem;
  left: 50%;
  width: 13rem;
  height: 13rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transform: translateX(-50%);
  transition: transform 0.18s ease;
  -webkit-tap-highlight-color: transparent;
}

.micGroup:active {
  transform: translateX(-50%) scale(0.95);
}

.micGroup:disabled {
  cursor: default;
}

.micGroupOn {
  transform: translateX(-50%);
}

.micGroupOn:active {
  transform: translateX(-50%) scale(0.95);
}

.micLayer,
.micIcon {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  object-fit: contain;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.micOuter {
  width: 13rem;
  height: 13rem;
  transition: filter 0.18s ease, opacity 0.18s ease;
}

.micGroupOn .micOuter {
  opacity: 1;
  animation: micOrangeGlow 1.42s ease-in-out infinite;
}

.micMiddle {
  width: 11.5rem;
  height: 11.5rem;
  opacity: 0.82;
}

body.theme-dark .micMiddle,
#app.theme-dark .micMiddle {
  opacity: 0.9;
  filter: saturate(1.08) contrast(1.06);
}

.micGroupOn .micMiddle {
  opacity: 1;
  animation: micOrangeGlow 1.42s 0.18s ease-in-out infinite;
}

.micInner {
  width: 11rem;
  height: 10.8rem;
  opacity: 0.9;
}

.micGroupOn .micInner {
  opacity: 1;
}

.micIcon {
  width: 2.9rem;
  height: 4.4rem;
  transition: transform 0.18s ease, filter 0.18s ease;
}

.barGroup {
  position: absolute;
  top: 21rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  height: 3rem;
  pointer-events: none;
}

.micBar {
  width: 0.4rem;
  border-radius: 0.2rem;
  background-color: #ffb085;
  transition: height 0.15s ease, opacity 0.15s ease;
}

.statusChip {
  position: absolute;
  top: 1.4rem;
  right: 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  height: 2.6rem;
  padding: 0 1.1rem;
  border-radius: 0.8rem;
  background-color: color-mix(in srgb, var(--home-accent) 18%, var(--home-panel-bg));
  color: var(--home-accent);
  font-size: 1.3rem;
  font-weight: 700;
}

.statusChipDot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background-color: currentColor;
}

.volHead {
  position: absolute;
  top: 25.7rem;
  right: 1.6rem;
  left: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
  color: var(--home-text);
}

.soundBar {
  position: absolute;
  top: 27rem;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  height: 4rem;
  padding: 0 1.6rem;
}

.soundIconBtn {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.28s cubic-bezier(0.34, 1.86, 0.44, 1);
}

.soundIconBtn:active {
  transform: scale(0.95);
  transition-duration: 0.08s;
}

.soundIconBtn:focus,
.soundIconBtn:focus-visible {
  outline: none;
}

.soundIcon {
  display: block;
  width: 2.4rem;
  height: 2.4rem;
  background-color: var(--home-text);
}

.soundIconMute {
  mask: url('/icons/Home/Cam/Cam_SoundMute_Line.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_SoundMute_Line.svg') center / contain no-repeat;
}

.soundIconOn {
  mask: url('/icons/Home/Cam/Cam_Sound.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_Sound.svg') center / contain no-repeat;
}

.volRange {
  flex: 1;
  min-width: 0;
  height: 0.8rem;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 0.4rem;
  background-color: #eee8de;
  outline: none;
  cursor: pointer;
}

.volRange::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 1.6rem;
  height: 1.6rem;
  border: 0;
  border-radius: 50%;
  background-color: #fffbf5;
  box-shadow: 0.2rem 0.2rem 0.4rem rgba(0, 0, 0, 0.25);
}

.volRange::-moz-range-thumb {
  width: 1.6rem;
  height: 1.6rem;
  border: 0;
  border-radius: 50%;
  background-color: #fffbf5;
  box-shadow: 0.2rem 0.2rem 0.4rem rgba(0, 0, 0, 0.25);
}

@keyframes micOrangeGlow {
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 0 rgba(255, 176, 133, 0));
  }

  42% {
    filter: brightness(1.18) drop-shadow(0 0 1.15rem rgba(255, 176, 133, 0.72));
  }
}

@media (orientation: landscape) {
  .homeDrawer {
    display: none;
  }
}

:global(html.home-force-portrait) .homeDrawer {
  display: block;
}
</style>

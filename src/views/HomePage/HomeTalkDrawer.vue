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
    <div class="waveGroup" aria-hidden="true">
      <svg class="waveSvg" viewBox="0 0 360 148" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path :d="waveOnePath" fill="url(#talkWaveBase)" opacity="0.76" />
        <path :d="waveTwoPath" fill="url(#talkWaveTop)" :opacity="waveTwoOpacity" />
        <path :d="waveThreePath" fill="#FFDECC" :opacity="waveThreeOpacity" />
        <path :d="waveOneLinePath" stroke="#FF955C" stroke-width="0.96" stroke-miterlimit="10" :opacity="waveLineOpacity" />
        <path :d="waveTwoLinePath" stroke="#FF955C" stroke-width="0.96" stroke-miterlimit="10" :opacity="waveLineOpacity" />
        <path :d="waveThreeLinePath" stroke="#DD8D61" stroke-width="0.96" stroke-miterlimit="10" :opacity="waveLineOpacity" />
        <defs>
          <linearGradient id="talkWaveTop" x1="180" y1="20" x2="180" y2="0" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFCBAF" />
            <stop offset="1" stop-color="var(--home-accent)" />
          </linearGradient>
          <linearGradient id="talkWaveBase" x1="180" y1="124" x2="180" y2="25" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFDECC" />
            <stop offset="1" stop-color="var(--home-accent)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const emit = defineEmits(['close'])
const isMicOn = ref(false)
const isMicPending = ref(false)
const targetAmplitude = ref(0)
const currentAmplitude = ref(0)
const targetSeparation = ref(0)
const currentSeparation = ref(0)
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

const rounded = (value) => Number(value.toFixed(2))
const waveOffset = (time, speed, size, shift = 0) => Math.sin(time * speed + shift) * size

const waveAmplitude = computed(() => currentAmplitude.value)
const separationAmount = computed(() => currentSeparation.value)
const waveLineOpacity = computed(() => rounded(Math.min(separationAmount.value * 1.15, 1)))
const waveTwoOpacity = computed(() => rounded(0.04 + separationAmount.value * 0.58))
const waveThreeOpacity = computed(() => rounded(0.04 + separationAmount.value * 0.64))

const buildWavePoints = ({ baseY, amplitudeRatio, speed, phase }) => {
  const separation = separationAmount.value
  const amplitude = waveAmplitude.value * amplitudeRatio * (0.55 + separation * 0.65)
  const yBase = 33 + (baseY - 33) * separation
  const points = []

  for (let i = 0; i <= 10; i += 1) {
    const x = (360 / 10) * i
    const primary = waveOffset(waveTime.value, speed, amplitude, phase + i * 0.82)
    const secondary = waveOffset(waveTime.value, speed * 0.56, amplitude * 0.38, phase * 0.7 + i * 1.36)
    points.push([rounded(x), rounded(yBase + primary + secondary)])
  }

  return points
}

const buildWaveLinePath = (settings) => {
  const points = buildWavePoints(settings)
  return points.map(([x, y], index) => (index === 0 ? 'M' : 'L') + x + ' ' + y).join(' ')
}

const buildWaveFillPath = (settings) => {
  const points = buildWavePoints(settings)
  const topLine = points.map(([x, y]) => 'L' + x + ' ' + y).join(' ')
  return 'M0 148 ' + topLine + ' L360 148 Z'
}

const waveOneSettings = { baseY: 48, amplitudeRatio: 18, speed: 1.15, phase: 0.2 }
const waveTwoSettings = { baseY: 38, amplitudeRatio: 13, speed: 0.88, phase: 1.9 }
const waveThreeSettings = { baseY: 56, amplitudeRatio: 22, speed: 1.36, phase: 3.4 }

const waveOnePath = computed(() => buildWaveFillPath(waveOneSettings))
const waveTwoPath = computed(() => buildWaveFillPath(waveTwoSettings))
const waveThreePath = computed(() => buildWaveFillPath(waveThreeSettings))
const waveOneLinePath = computed(() => buildWaveLinePath(waveOneSettings))
const waveTwoLinePath = computed(() => buildWaveLinePath(waveTwoSettings))
const waveThreeLinePath = computed(() => buildWaveLinePath(waveThreeSettings))

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
    const level = readMicLevel()
    targetAmplitude.value = level
    targetSeparation.value = Math.min(Math.max((level - 0.12) / 0.3, 0), 1)
    currentAmplitude.value += (targetAmplitude.value - currentAmplitude.value) * 0.12
    currentSeparation.value += (targetSeparation.value - currentSeparation.value) * 0.08
    animationFrame = requestAnimationFrame(draw)
  }

  if (analyser && timeData) draw()
}

const stopWaveLoop = () => {
  cancelAnimationFrame(animationFrame)
  animationFrame = 0
  targetAmplitude.value = 0
  currentAmplitude.value = 0
  targetSeparation.value = 0
  currentSeparation.value = 0
  analyser = undefined
  timeData = undefined

  mediaStream?.getTracks().forEach((track) => track.stop())
  mediaStream = undefined

  void audioContext?.close()
  audioContext = undefined
}


onBeforeUnmount(stopWaveLoop)
</script>

<style scoped>
.homeDrawer {
  position: relative;
  z-index: 90;
  width: 100%;
  flex: 1 1 auto;
  min-height: clamp(27.2rem, 58dvh, 31.8rem);
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
  top: 5.4rem;
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

.waveGroup {
  position: absolute;
  left: 50%;
  bottom: -2.6rem;
  width: 100%;
  height: 14.8rem;
  pointer-events: none;
  overflow: hidden;
  transform: translateX(-50%);
}

.waveSvg {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: block;
  width: 100%;
  height: 14.8rem;
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

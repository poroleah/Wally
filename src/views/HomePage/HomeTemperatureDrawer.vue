<template>
  <div :class="$style.homeDrawer" role="dialog" aria-label="온도">
    <button type="button" :class="$style.closeButton" aria-label="닫기" @click="emit('close')">
      <span :class="$style.iconClose" aria-hidden="true"></span>
    </button>

    <b :class="$style.title">온도</b>

    <div :class="$style.temperature" aria-hidden="true">
      <svg :class="[$style.heatGauge, isWarm ? $style.heatGaugeWarm : $style.heatGaugeCool]" viewBox="0 0 320 170" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path :class="$style.heatTrack" d="M20 155A140 140 0 0 1 300 155" />
        <path :class="$style.heatValue" d="M20 155A140 140 0 0 1 300 155" pathLength="100" :style="{ strokeDashoffset: heatValueOffset }" />
      </svg>
      <div :class="$style.temperatureChild" :style="temperatureKnobStyle"></div>
    </div>

    <b :class="$style.titleHope">희망 온도</b>
    <div :class="$style.temperatureTarget" aria-live="polite">
      <b :class="$style.targetValue">{{ targetTemperature }}</b>
      <span :class="$style.iconCelsius" aria-hidden="true"></span>
    </div>

    <button
      type="button"
      :class="[$style.adjustButton, $style.iconPlus]"
      aria-label="희망 온도 올리기"
      @click="raiseTemperature"
    >
      <img :class="$style.adjustIcon" src="/icons/Home/Bar/Tem/Tem_Plus.svg" alt="" />
    </button>
    <button
      type="button"
      :class="[$style.adjustButton, $style.iconMinus]"
      aria-label="희망 온도 내리기"
      @click="lowerTemperature"
    >
      <img :class="$style.adjustIcon" src="/icons/Home/Bar/Tem/Tem_Minus.svg" alt="" />
    </button>

    <b :class="$style.titleCurrent">현재 온도</b>
    <div :class="$style.temperatureCurrent">
      <b :class="$style.currentValue">{{ currentTemperature }}</b>
      <span :class="$style.iconCelsius2" aria-hidden="true"></span>
    </div>

    <button
      type="button"
      :class="[$style.toggle, isWarm ? $style.toggleWarm : $style.toggleCool]"
      :aria-pressed="isWarm"
      :aria-label="isWarm ? '난방 모드' : '냉방 모드'"
      @click="toggleMode"
    >
      <span :class="$style.toggleChild"></span>
      <span :class="$style.toggleItem"></span>
      <img :class="[$style.modeIcon, isWarm ? $style.modeIconWarm : $style.modeIconCool]" :src="isWarm ? '/icons/Home/Bar/Tem/Tem_Fire.svg' : '/icons/Home/Bar/Tem/Tem_Cool_Toggle.svg'" alt="" />
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const emit = defineEmits(['close'])

const targetTemperature = ref(25)
const currentTemperature = ref(23)
const isWarm = ref(true)

const temperatureRange = computed(() => (isWarm.value ? { min: 20, max: 34 } : { min: 18, max: 24 }))
const currentTemperatureRatio = computed(() => Math.min(Math.max(currentTemperature.value / 50, 0), 1))
const heatValueOffset = computed(() => String(100 - currentTemperatureRatio.value * 100))
const temperatureKnobStyle = computed(() => {
  const angle = Math.PI * (1 - currentTemperatureRatio.value)
  const x = 160 + 140 * Math.cos(angle)
  const y = 155 - 140 * Math.sin(angle)
  return {
    left: (x / 320) * 100 + '%',
    top: (y / 170) * 100 + '%',
  }
})

function raiseTemperature() {
  targetTemperature.value = Math.min(targetTemperature.value + 1, temperatureRange.value.max)
  currentTemperature.value = targetTemperature.value
}

function lowerTemperature() {
  targetTemperature.value = Math.max(targetTemperature.value - 1, temperatureRange.value.min)
  currentTemperature.value = targetTemperature.value
}

function toggleMode() {
  isWarm.value = !isWarm.value
  targetTemperature.value = isWarm.value ? 25 : 22
  currentTemperature.value = isWarm.value ? 23 : 25
}
</script>

<style module>
.homeDrawer {
  position: relative;
  z-index: 90;
  width: 100%;
  flex: 1 1 clamp(27.2rem, 58dvh, 31.8rem);
  min-height: clamp(27.2rem, 58dvh, 31.8rem);
  margin-top: 2.4rem;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--home-panel-bg);
  overflow: hidden;
  text-align: center;
  font-size: 1.6rem;
  color: var(--home-text);
  font-family: 'Malang', 'Hancom MalangMalang', sans-serif;
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
.adjustButton:focus,
.adjustButton:focus-visible,
.toggle:focus,
.toggle:focus-visible {
  outline: none;
}

.iconClose {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-text);
  mask: url('/icons/Common/Close.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Common/Close.svg') center / contain no-repeat;
}

.title,
.titleHope,
.titleCurrent {
  position: absolute;
  display: inline-block;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
  color: var(--home-text);
}

.title {
  width: 6.2rem;
  top: 1.4rem;
  left: 50%;
  height: 2.4rem;
  transform: translateX(-50%);
}

.temperature {
  position: absolute;
  top: 5.8rem;
  left: 50%;
  width: min(32rem, calc(100% - 4rem));
  max-width: calc(100% - 4rem);
  aspect-ratio: 320 / 170;
  height: auto;
  transform: translateX(-50%);
  overflow: visible;
  background-color: transparent;
}

.heatGauge {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.heatTrack,
.heatValue {
  stroke-width: 12;
  stroke-linecap: round;
}

.heatTrack {
  /* 말하기 드로어 음량 슬라이더 트랙과 동일한 색 */
  stroke: #eee8de;
}

.heatValue {
  stroke-dasharray: 100;
  transition: stroke-dashoffset 0.24s ease, stroke 0.24s ease;
}

.heatGaugeWarm .heatValue {
  stroke: #ffad83;
}

.heatGaugeCool .heatValue {
  stroke: var(--home-cool);
}

.temperatureChild {
  position: absolute;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 50%;
  border: 0;
  background-color: var(--home-panel-bg);
  box-shadow: 0 0.12rem 0.26rem rgba(45, 41, 38, 0.22);
  transform: translate(-50%, -50%);
  transition: left 0.24s ease, top 0.24s ease, background-color 0.24s ease, box-shadow 0.24s ease;
}

:global(:root.theme-dark) .temperatureChild,
:global(body.theme-dark) .temperatureChild,
:global(#app.theme-dark) .temperatureChild {
  /* 말하기 드로어 음량 토글과 동일한 룩 */
  background-color: #fffbf5;
  box-shadow: 0.2rem 0.2rem 0.4rem rgba(0, 0, 0, 0.25);
}

.titleHope {
  width: 6.2rem;
  top: 14.8rem;
  left: 50%;
  height: 2.1rem;
  transform: translateX(-50%);
}

.temperatureTarget {
  position: absolute;
  top: 17.5rem;
  left: 50%;
  width: 6.4rem;
  height: 3.1rem;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

.targetValue {
  min-width: 4.3rem;
  height: 3.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.6rem;
  line-height: 1;
}

.iconCelsius {
  width: 2.4rem;
  height: 2.4rem;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  display: block;
  background-color: var(--home-text);
  mask: url(/icons/Home/Bar/Tem/Tem_Celsius.svg) center / contain no-repeat;
  -webkit-mask: url(/icons/Home/Bar/Tem/Tem_Celsius.svg) center / contain no-repeat;
}

.adjustButton {
  position: absolute;
  top: 18.2rem;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 1rem;
  background: var(--home-control-hover);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.adjustButton:active {
  transform: scale(0.94);
}

.adjustIcon {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  object-fit: contain;
}

.iconMinus {
  left: calc(50% - 8.9rem);
}

.iconPlus {
  left: calc(50% + 6.5rem);
}

.titleCurrent {
  width: 5.4rem;
  top: 22.8rem;
  left: 50%;
  height: 1.7rem;
  transform: translateX(-50%);
  font-size: 1.297rem;
}

.temperatureCurrent {
  position: absolute;
  top: 24.988rem;
  left: 50%;
  height: 2.51rem;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

.currentValue {
  width: 3.48rem;
  height: 2.51rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.917rem;
  line-height: 1;
}

.iconCelsius2 {
  width: 1.94rem;
  height: 1.94rem;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  display: block;
  background-color: var(--home-text);
  mask: url(/icons/Home/Bar/Tem/Tem_Celsius.svg) center / contain no-repeat;
  -webkit-mask: url(/icons/Home/Bar/Tem/Tem_Celsius.svg) center / contain no-repeat;
}

.toggle {
  position: absolute;
  top: 1.5rem;
  right: 2rem;
  width: 4.3rem;
  height: 2.3rem;
  padding: 0;
  border: 0;
  border-radius: 2rem;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s ease;
}

.toggleChild {
  position: absolute;
  inset: 0;
  border: 0.1rem solid var(--settings-toggle-border);
  border-radius: 2rem;
  background-color: var(--settings-toggle-bg);
  box-shadow: var(--settings-toggle-shadow);
  transition: background-color 0.24s ease, border-color 0.24s ease;
}

.toggleWarm .toggleChild {
  border-color: var(--settings-toggle-on);
  background-color: var(--settings-toggle-on);
}

.toggleCool .toggleChild {
  border-color: var(--home-cool);
  background-color: var(--home-cool);
}

.toggleItem {
  position: absolute;
  top: calc(50% - 0.95rem);
  left: 4.65%;
  width: 44.19%;
  height: 1.9rem;
  border-radius: 50%;
  background-color: var(--settings-toggle-thumb);
  box-shadow: var(--settings-toggle-thumb-shadow);
  transition: left 0.24s ease;
}

.toggleWarm .toggleItem {
  left: 51.16%;
}

.toggleCool .toggleItem {
  left: 4.65%;
}

.modeIcon {
  position: absolute;
  top: 0.5rem;
  width: 1.3rem;
  height: 1.3rem;
  display: block;
  object-fit: contain;
}

.modeIconWarm {
  left: 2.5rem;
}

.modeIconCool {
  left: 0.5rem;
}

.toggle:active {
  transform: scale(0.97);
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

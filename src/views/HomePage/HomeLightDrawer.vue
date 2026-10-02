<template>
  <div :class="[$style.homeDrawer, $style.lightRedesign]" role="dialog" aria-label="조명">
    <button type="button" :class="$style.closeButton" aria-label="닫기" @click="emit('close')"><span :class="$style.iconClose" aria-hidden="true"></span></button>
    <b :class="$style.drawerTitle">조명</b>
    <div :class="$style.redesignHeader">
      <span :class="$style.nameText">{{ houseName }}</span>
      <button type="button" :class="[$style.toggle, isOn ? $style.toggleOn : '']" :aria-pressed="isOn" :disabled="!connected || device.busy" aria-label="조명 켜기 또는 끄기" @click="togglePower"><span :class="$style.toggleTrack"></span><span :class="$style.toggleThumb"></span></button>
    </div>
    <img
      v-theme-src="{ light: lampOffIconSrc, dark: lampOffIconSrc }"
      :class="$style.pendantLamp"
      :src="lampOffIconSrc"
      alt=""
    />
    <img
      v-theme-src="{ light: visibleLampIconSrc, dark: visibleLampIconSrc }"
      :class="[$style.pendantLamp, $style.pendantLampGlow, brightness > 0 && $style.pendantLampGlowVisible]"
      :src="visibleLampIconSrc"
      alt=""
    />
    <div :class="[$style.dial, !isOn ? $style.dialOff : '']" aria-label="조명 밝기">
      <svg :class="$style.dialProgress" viewBox="0 0 120 180" aria-hidden="true">
        <image href="/icons/Home/Bar/Light/Shadow.svg" x="20.72949" y="5.72969" width="87" height="168" />
        <!-- Keep the dedicated on/off artwork clear of the arc. -->
        <image href="/icons/Home/Bar/Light/Bar_Light_On_Setting.svg" x="-1.4" y="0.53" width="18.8" height="21.95" preserveAspectRatio="xMidYMin meet" />
        <image href="/icons/Home/Bar/Light/Bar_Light_Off_Setting.svg" x="-0.88" y="160.6" width="17.77" height="18.81" preserveAspectRatio="xMidYMax meet" />
        <path
          :class="$style.dialProgressValue"
          d="M24.0001 169.918 C68.4361 169.918 104.459 133.895 104.459 89.4594 C104.459 45.0233 68.436 9.00078 24 9.00078"
          pathLength="100"
          :style="{
            strokeDasharray: '100 100',
            strokeDashoffset: 100 - animatedBrightness,
            opacity: animatedBrightness > 0 ? 1 : 0,
          }"
        />
        <circle
          :class="$style.dialProgressMarker"
          :cx="dialMarker.x"
          :cy="dialMarker.y"
          :style="{ opacity: animatedBrightness > 0 ? 1 : 0 }"
          r="6.868"
        />
      </svg>
    </div>
    <div :class="[$style.brightnessControl, !isOn ? $style.percentOff : '']">
      <button type="button" :class="$style.brightnessButton" aria-label="밝기 낮추기" :disabled="!isOn || brightness === 0" @click="setBrightness(Math.max(0, brightness - 20))">−</button>
      <div :class="$style.number"><b :class="$style.percentValue">{{ brightness }}</b><b :class="$style.percentUnit">%</b></div>
      <button type="button" :class="$style.brightnessButton" aria-label="밝기 높이기" :disabled="!isOn || brightness === 100" @click="setBrightness(Math.min(100, brightness + 20))">+</button>
    </div>
  </div>
  <div :class="$style.homeDrawer" role="dialog" aria-label="조명">
    <button type="button" :class="$style.closeButton" aria-label="닫기" @click="emit('close')">
      <span :class="$style.iconClose" aria-hidden="true"></span>
    </button>
    <b :class="$style.drawerTitle">조명</b>
    <img v-theme-src="{ light: lampIconSrc, dark: lampIconSrc }" :class="$style.lampIcon" :src="lampIconSrc" alt="" />
    <div :class="$style.contentFrame">
      <div :class="$style.titleFrame">
        <div :class="$style.homeName">
          <div :class="$style.nameText">{{ houseName }}</div>
        </div>
        <button type="button" :class="[$style.toggle, isOn ? $style.toggleOn : '']" :aria-pressed="isOn" aria-label="조명 켜기/끄기" @click="togglePower">
          <span :class="$style.toggleTrack"></span>
          <span :class="$style.toggleThumb"></span>
        </button>
      </div>
      <div :class="[$style.percentFrame, isOn ? '' : $style.percentOff]">
        <div :class="$style.number">
          <b :class="$style.percentValue">{{ brightness }}</b>
          <b :class="$style.percentUnit">%</b>
        </div>
      </div>
    </div>
    <div :class="$style.lightControlFrame" aria-label="조명 밝기">
      <img :class="$style.lightSettingIcon" src="/icons/Home/Bar/Light/Bar_Light_Off_Setting.svg" alt="" />
      <div :class="$style.lightControl" role="group" aria-label="조명 밝기 선택">
              <span :class="$style.lightTrack" aria-hidden="true"></span>
              <span
                v-for="step in brightnessSteps"
                :key="step"
                :class="$style.lightDot"
                :style="{ left: step + '%' }"
                aria-hidden="true"
              ></span>
              <span :class="$style.lightThumb" :style="{ left: brightness + '%' }" aria-hidden="true"></span>
              <button
                v-for="step in brightnessSteps"
                :key="'button-' + step"
                type="button"
                :class="$style.lightStepButton"
                :style="{ left: step + '%' }"
                :aria-label="step + '%'"
                :aria-pressed="step === brightness"
                @click="setBrightness(step)"
              ></button>
            </div>
      <img :class="$style.lightSettingIcon" src="/icons/Home/Bar/Light/Bar_Light_On_Setting.svg" alt="" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useProfile } from '@/composables/useProfile'
import { useDevices } from '@/composables/useDevices'

// UI는 Wally 시안 그대로 두고, 전원·밝기만 babycat /device(보드)에 보낸다.
// 화면 값은 로컬 상태가 기준이고, 서버가 값을 알려 주면(응답·SSE) 그때 덮어쓴다.
// 서버에 /device가 없거나(404) 응답이 없어도 화면은 이전처럼 동작한다.
const emit = defineEmits(['close'])
const { name } = useProfile()
const { device, refresh, apply } = useDevices()
onMounted(() => { refresh() })

const brightnessSteps = [0, 20, 40, 60, 80, 100]

// ── 목업 상태: 서버가 /device를 한 번도 알려 주지 않은 동안(미배포 205 등)만 쓴다 ──

// ── 서버 상태: connected가 되면 목업은 완전히 배제하고 서버 값만 표시한다 ──
const connected = computed(() => device.connected)
const powerOverride = ref(null)
const isOn = computed(() => connected.value && (powerOverride.value ?? device.power === true))
// 서버 밝기(0~100)를 시안 단계 중 가장 가까운 값으로 표시. 미확인(null)·꺼짐은 0
const brightness = computed(() => {
  if (!connected.value) return 0
  if (powerOverride.value === true && !(device.brightness > 0)) return 0
  if (powerOverride.value === false) return 0
  if (device.brightness == null || device.power !== true) return 0
  return brightnessSteps.reduce((best, step) =>
    Math.abs(step - device.brightness) < Math.abs(best - device.brightness) ? step : best, brightnessSteps[0])
})

// 보드 연결 시: 화면을 직접 바꾸지 않고 서버에만 보낸다. 응답값이 computed로 반영된다.
// 단계값(0, 20 …)은 그대로 유지하되, 다이얼은 연속값으로 보간한다.
const animatedBrightness = ref(brightness.value)
let brightnessAnimationFrame = 0
watch(brightness, (nextBrightness) => {
  const startBrightness = animatedBrightness.value
  const distance = nextBrightness - startBrightness
  const startedAt = performance.now()
  const duration = 260
  cancelAnimationFrame(brightnessAnimationFrame)

  const animate = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2
    animatedBrightness.value = startBrightness + distance * eased
    if (progress < 1) brightnessAnimationFrame = requestAnimationFrame(animate)
  }
  brightnessAnimationFrame = requestAnimationFrame(animate)
})

async function togglePower() {
  if (!connected.value) return
  const next = !isOn.value
  powerOverride.value = next
  const applied = await apply({ power: next })
  if (!applied) powerOverride.value = null
}
const houseName = computed(() => (name.value || '반려동물') + ' 하우스')
const lampOffIconSrc = '/icons/Home/Bar/Light/Lamp_0.svg'
const lampIconSrc = computed(() => `/icons/Home/Bar/Light/Lamp_${brightness.value}.svg`)
const visibleLampIconSrc = ref(lampIconSrc.value)
let lampFadeTimer

// Keep the last lit image above the 0% lamp until its fade-out finishes.
watch(brightness, (value) => {
  clearTimeout(lampFadeTimer)
  if (value > 0) {
    visibleLampIconSrc.value = `/icons/Home/Bar/Light/Lamp_${value}.svg`
    return
  }
  lampFadeTimer = setTimeout(() => {
    visibleLampIconSrc.value = lampOffIconSrc
  }, 560)
})

onBeforeUnmount(() => {
  clearTimeout(lampFadeTimer)
  cancelAnimationFrame(brightnessAnimationFrame)
})

// 100%는 다이얼 위쪽, 0%는 아래쪽이다. 원본 SVG의 원 중심·반지름을 사용한다.
const dialMarker = computed(() => {
  const angle = (90 - animatedBrightness.value * 1.8) * Math.PI / 180
  const radius = 80.459
  return {
    x: 24 + radius * Math.cos(angle),
    y: 89.459 + radius * Math.sin(angle),
  }
})
// Brightness and device power are independent: 0% darkens the lamp without
// disabling the light/sensor device. Only the main toggle sends power:false.
function setBrightness(value) {
  if (!connected.value) return
  apply({ brightness: value })
}
</script>

<style module>
.homeDrawer {
  position: relative;
  z-index: 90;
  width: 100%;
  /* 홈 드로어 4종 공통 높이 42rem. 작은 화면에서는 뷰포트에 맞춰 줄어든다 */
  flex: 0 0 auto;
  height: min(clamp(27.2rem, 70dvh, 42rem), calc(100dvh - 9rem));
  margin-top: 2.4rem;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--home-panel-bg);
  overflow: hidden;
  text-align: center;
  font-size: 1.4rem;
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

.lampIcon {
  position: absolute;
  /* 좌측 콘텐츠 블록보다 1rem 아래 — 블록 세로 중앙에 램프 중심을 맞춘 값 */
  top: 8.6rem; /* 시안 65px × 1.33 — 콘텐츠 블록과 같은 높이에서 시작 */
  right: 3.1rem;
  width: 11.3rem; /* 시안 85px × 1.33 */
  height: 14.6rem; /* 시안 109.6px × 1.33 */
  display: block;
  object-fit: contain;
  pointer-events: none;
}

.contentFrame {
  position: absolute;
  /* 블록·램프·밝기 컨트롤을 시안 간격 그대로 한 묶음으로 카드 세로 중앙에 둔다.
     (공통 420px 카드: 12.2rem, 시안 316px: 9rem) */
  top: 8.6rem; /* 시안 65px × 1.33 (316px 시안을 420px 카드에 비례 확대) */
  left: 3.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3.5rem; /* 시안 26px × 1.33 */
}

.titleFrame {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1.6rem; /* 시안 12px × 1.33 */
}

.homeName {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.nameText {
  position: relative;
  letter-spacing: 0.01em;
  line-height: 100%;
}

.toggle {
  width: 4.3rem;
  height: 2.3rem;
  position: relative;
  padding: 0;
  border: 0;
  border-radius: 2rem;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: transform 0.18s ease;
}

.toggleTrack {
  position: absolute;
  inset: 0;
  border: 0.1rem solid var(--settings-toggle-border);
  border-radius: 2rem;
  background-color: var(--settings-toggle-bg);
  box-shadow: var(--settings-toggle-shadow);
  transition: background-color 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}

.toggleOn .toggleTrack {
  border-color: var(--settings-toggle-on);
  background-color: var(--settings-toggle-on);
  box-shadow: inset 0 0 0.2rem rgba(255, 255, 255, 0.18), 0 0.1rem 0.35rem rgba(255, 176, 133, 0.28);
}

/* Match the camera control in dark mode: a plain dark track, without the
   light outline contributed by the shared settings-toggle tokens. */
:global(:root.theme-dark) .toggleTrack,
:global(body.theme-dark) .toggleTrack,
:global(#app.theme-dark) .toggleTrack,
:global(:root.theme-dark) .toggleOn .toggleTrack,
:global(body.theme-dark) .toggleOn .toggleTrack,
:global(#app.theme-dark) .toggleOn .toggleTrack {
  border: 0;
  box-shadow: none;
}

.toggleThumb {
  position: absolute;
  width: 44.19%;
  height: 1.9rem;
  top: calc(50% - 0.95rem);
  left: 4.65%;
  border-radius: 50%;
  background-color: var(--settings-toggle-thumb);
  box-shadow: var(--settings-toggle-thumb-shadow);
  transition: left 0.24s ease, transform 0.18s ease, box-shadow 0.24s ease;
}

.toggleOn .toggleThumb {
  left: 51.16%;
}

.toggle:hover .toggleTrack {
  box-shadow: var(--settings-toggle-shadow), 0 0.1rem 0.35rem rgba(255, 176, 133, 0.16);
}

.toggle:hover .toggleThumb {
  transform: scale(1.04);
}

.toggle:active {
  transform: scale(0.97);
}

.toggle:active .toggleThumb {
  transform: scale(0.96);
}

.percentFrame {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  font-size: 5rem;
}

/* 조명 꺼짐 — 숫자·% 를 비활성 색으로 */
.percentOff {
  color: var(--home-muted);
}

.number {
  min-width: 6.4rem;
  height: 4.3rem;
  display: flex;
  align-items: flex-end;
}

.percentValue {
  height: 4.5rem;
  width: auto;
  position: relative;
  letter-spacing: 0.01em;
  line-height: 100%;
  display: inline-block;
  flex-shrink: 0;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

.percentUnit {
  position: relative;
  font-size: 2.4rem;
  letter-spacing: 0.01em;
  line-height: 100%;
  flex-shrink: 0;
  margin-left: 0.2rem;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

.lightControlFrame {
  /* 시안: 아이콘 30px @ x=20/309, 트랙 63~298px, 세로 중심 232px */
  position: absolute;
  /* 다른 드로어 하단선(33.5rem)보다 1.5rem 위 — 시각적으로 아래로 치우쳐 보여 소폭 올림 */
  top: 32rem;
  right: 2rem;
  left: 2rem;
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) 4rem; /* 전구 아이콘 30px × 1.33 */
  align-items: center;
  gap: 1.2rem;
}

.lightSettingIcon {
  width: 4rem;
  height: 4rem;
  display: block;
  object-fit: contain;
}

.lightControl {
  position: relative;
  width: 100%;
  height: 1.6rem;
  display: block;
}

.lightTrack {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 0.2rem;
  border-radius: 0.1rem;
  background-color: var(--home-muted);
  transform: translateY(-50%);
}

.lightDot {
  position: absolute;
  top: 50%;
  width: 0.8rem;
  height: 0.8rem;
  border: 0.15rem solid var(--home-muted);
  border-radius: 50%;
  background-color: var(--home-panel-bg);
  transform: translate(-50%, -50%);
}

.lightThumb {
  position: absolute;
  top: 50%;
  width: 1.6rem;
  height: 1.6rem;
  border: 0.2rem solid var(--home-panel-bg);
  border-radius: 50%;
  background-color: var(--home-accent);
  transform: translate(-50%, -50%);
  transition: left 0.18s ease;
  z-index: 2;
}

.lightStepButton {
  position: absolute;
  top: 50%;
  width: 2.8rem;
  height: 2.8rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transform: translate(-50%, -50%);
  -webkit-tap-highlight-color: transparent;
}

.lightStepButton:focus,
.lightStepButton:focus-visible {
  outline: none;
}

.drawerTitle {
  position: absolute;
  width: 6.2rem;
  top: 1.4rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.6rem;
  display: inline-block;
  color: var(--home-text);
  height: 2.4rem;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

@media (orientation: landscape) {
  .homeDrawer {
    display: none;
  }
}

:global(html.home-force-portrait) .homeDrawer {
  display: block;
}
@media (min-width: 48rem) and (orientation: portrait) {
  .homeDrawer {
    flex-basis: clamp(23rem, 40dvh, 27.5rem);
    height: clamp(23rem, 40dvh, 27.5rem);
    min-height: clamp(23rem, 40dvh, 27.5rem);
    margin-top: 1.4rem;
    border-radius: 1.8rem 1.8rem 0 0;
  }

  .contentFrame {
    top: 5.8rem;
    left: 4rem;
    gap: 3.2rem;
  }

  .nameText {
    font-size: 1.6rem;
    line-height: 1.2;
  }

  .lampIcon {
    top: 5.4rem;
    right: 4rem;
    width: 7.6rem;
    height: 9.8rem;
  }

  .lightControlFrame {
    top: auto;
    bottom: 2.6rem;
    left: 50%;
    right: auto;
    width: min(calc(100% - 6.4rem), 40rem);
    transform: translateX(-50%);
    grid-template-columns: 3.8rem minmax(0, 30rem) 3.8rem;
    gap: 1.2rem;
  }

  .lightSettingIcon {
    width: 3.8rem;
    height: 3.8rem;
  }
}

.homeDrawer:not(.lightRedesign) {
  display: none;
}

.lightRedesign {
  margin-top: 2.4rem;
  display: block;
}

.lightRedesign .drawerTitle {
  top: 1.2rem;
}

.lightRedesign .closeButton {
  top: 3.5%;
  left: 4.5%;
}

.redesignHeader {
  position: absolute;
  top: 17%;
  left: 5.7%;
  display: flex;
  flex-direction: column;
  /* Keep the switch aligned with the house name, like the reference layout. */
  align-items: flex-start;
  gap: 3rem;
}

.redesignHeader .nameText {
  font-size: 1.4rem;
  color: var(--home-text);
}

.redesignHeader .toggle {
  width: 4.3rem;
  height: 2.3rem;
}

.pendantLamp {
  position: absolute;
  /* Figma frame: 138px wide in a 580px drawer. */
  top: 16%;
  left: 69%;
  width: 27%;
  height: auto;
  /* Preserve its anchor while giving the hanging cord a little more length. */
  transform: translateX(-50%) scaleY(1.08);
  transform-origin: top center;
}

.pendantLampGlow {
  opacity: 0;
  transition: opacity 0.56s ease-in-out;
}

.pendantLampGlowVisible {
  opacity: 1;
}

.dial {
  position: absolute;
  /* Slightly enlarged while retaining the shared drawer bottom inset. */
  bottom: 4rem; /* Other home drawers use the shared 4rem content inset. */
  left: 5.5%;
  width: 37%;
  aspect-ratio: 2 / 3;
}

.dialImage {
  width: 100%;
  height: 100%;
  display: block;
}

.dialProgress {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.dialProgressBase,
.dialProgressValue {
  fill: none;
  stroke-width: 7.8;
  stroke-linecap: round;
}

.dialProgressBase {
  stroke: #eee8de;
}

.dialProgressValue {
  stroke: #ffce31;
  /* A fixed dash moves by the same amount and duration at every brightness
     step, including the first 0 → 20% change. */
  transition: stroke-dashoffset 0.56s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
}

.dialProgressMarker {
  fill: #fffbf5;
  filter: drop-shadow(1.30827px 1.30827px 1.30827px rgba(0, 0, 0, 0.25));
  transition: cx 0.56s cubic-bezier(0.22, 1, 0.36, 1), cy 0.56s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
}

.dialShadow {
  position: absolute;
  top: 5%;
  left: 13.333%;
  width: 44.722%;
  height: 89.389%;
  display: block;
  overflow: visible;
}

.dialValue {
  fill: none;
  stroke-width: 0.42rem;
  stroke-linecap: round;
}

.dialValue {
  /* Active arc color from the light-control design. */
  stroke: #ffce31;
  stroke-dasharray: 100;
  transition: stroke-dashoffset 0.24s ease;
}

.dialMarker {
  position: absolute;
  /* Figma: 13.7px circle in the 180px light frame. */
  width: 7.611%;
  height: 7.611%;
  border: 0;
  border-radius: 50%;
  background: #fffbf5;
  box-shadow: 0.1308rem 0.1308rem 0.262rem rgba(0, 0, 0, 0.25);
  transform: translate(-50%, -50%) rotate(-90deg);
  transform-origin: 0 0;
  transition: left 0.24s ease, top 0.24s ease;
}

.dialOff .dialValue {
  stroke: var(--home-muted);
}

.dialOff {
  opacity: 0.55;
}

.dialIcon {
  position: absolute;
  width: 8.889%;
  height: auto;
  object-fit: contain;
}

.dialIconOn {
  top: 0.556%;
  /* The exported Figma icon is rotated around its left edge, so its visual
     bounds begin at x=0 while the arc begins at x=24. */
  left: 0;
}

.dialIconOff {
  top: 90.556%;
  left: 0;
}

.brightnessControl {
  position: absolute;
  bottom: 10rem;
  /* Keep the percentage centred beneath the pendant lamp. */
  left: 69%;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 3.2rem 10rem 3.2rem;
  align-items: center;
  column-gap: 1rem;
  color: var(--home-muted);
}

.brightnessControl:not(.percentOff) {
  color: var(--home-text);
}

.brightnessControl .number {
  min-width: 0;
  height: 5rem;
  justify-content: center;
}

.brightnessControl .percentValue {
  height: auto;
  font-size: 5.4rem;
  color: inherit;
}

.brightnessControl .percentUnit {
  font-size: 2.6rem;
  color: inherit;
}

.brightnessButton {
  width: 3.2rem;
  height: 3.2rem;
  padding: 0;
  border: 0;
  border-radius: 1rem;
  background: transparent;
  color: var(--home-text);
  font-family: inherit;
  font-size: 2.8rem;
  line-height: 1;
  cursor: pointer;
}

/* The % sign adds visual weight on the right of the value, so tuck the plus
   button in slightly for optical balance without moving the value itself. */
.brightnessButton:last-child {
  transform: translateX(-0.4rem);
}

.brightnessButton:disabled {
  color: var(--home-muted);
  cursor: default;
}

/* 0%/100% at an active light are still endpoints, not a disabled control. */
.brightnessControl:not(.percentOff) .brightnessButton:disabled {
  color: var(--home-text);
}

.brightnessButton:focus,
.brightnessButton:focus-visible {
  outline: none;
}

</style>

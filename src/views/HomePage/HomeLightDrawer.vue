<template>
  <div :class="$style.homeDrawer" role="dialog" aria-label="조명">
    <button type="button" :class="$style.closeButton" aria-label="닫기" @click="emit('close')">
      <span :class="$style.iconClose" aria-hidden="true"></span>
    </button>
    <b :class="$style.drawerTitle">조명</b>
    <img v-theme-src="{ light: lampIconSrc, dark: lampIconDarkSrc }" :class="$style.lampIcon" :src="lampIconSrc" alt="" />
    <div :class="$style.contentFrame">
      <div :class="$style.titleFrame">
        <div :class="$style.homeName">
          <div :class="$style.nameText">{{ houseName }}</div>
        </div>
        <button type="button" :class="[$style.toggle, isOn ? $style.toggleOn : '']" :aria-pressed="isOn" aria-label="조명 켜기/끄기" @click="isOn = !isOn">
          <span :class="$style.toggleTrack"></span>
          <span :class="$style.toggleThumb"></span>
        </button>
      </div>
      <div :class="$style.percentFrame">
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
import { computed, ref } from 'vue'
import { useProfile } from '@/composables/useProfile'

const emit = defineEmits(['close'])
const { name } = useProfile()
const isOn = ref(true)
const brightnessSteps = [0, 20, 40, 60, 80, 100]
const brightness = ref(60)
const houseName = computed(() => (name.value || '반려동물') + ' 하우스')
const lampIconSrc = computed(() => "/icons/Home/Bar/Light/Light_" + brightness.value + ".svg")
const lampIconDarkSrc = computed(() => [20, 40, 60, 80].includes(brightness.value)
  ? "/icons/Home/Bar/Light/Light_" + brightness.value + "_Dark.svg"
  : lampIconSrc.value)

function setBrightness(value) {
  brightness.value = value
}
</script>

<style module>
.homeDrawer {
  position: relative;
  z-index: 90;
  width: 100%;
  flex: 1 1 clamp(27.2rem, 62dvh, 34.8rem);
  min-height: clamp(27.2rem, 62dvh, 34.8rem);
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
  top: 6.6rem;
  right: 3.2rem;
  width: 8.5rem;
  height: 10.96rem;
  display: block;
  object-fit: contain;
  pointer-events: none;
}

.contentFrame {
  position: absolute;
  top: 7.3rem;
  left: 3.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5.4rem;
}

.titleFrame {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1.2rem;
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

.number {
  min-width: 8.8rem;
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
  margin-left: 0.3rem;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

.lightControlFrame {
  position: absolute;
  left: 50%;
  bottom: 5.2rem;
  width: min(calc(100% - 3.2rem), 33.3rem);
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 3.2rem minmax(0, 25.1rem) 3.2rem;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
}

.lightSettingIcon {
  width: 3.2rem;
  height: 3.2rem;
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
  width: 1.4rem;
  height: 1.4rem;
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
    bottom: 2.6rem;
    width: min(calc(100% - 6.4rem), 40rem);
    grid-template-columns: 3.8rem minmax(0, 30rem) 3.8rem;
    gap: 1.2rem;
  }

  .lightSettingIcon {
    width: 3.8rem;
    height: 3.8rem;
  }
}

</style>

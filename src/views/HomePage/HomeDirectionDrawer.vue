<template>
  <div :class="$style.homeDrawer" role="dialog" aria-label="방향 제어">
    <button type="button" :class="$style.closeButton" aria-label="닫기" @click="close">
      <span :class="$style.iconClose" aria-hidden="true"></span>
    </button>
    <b :class="$style.title">카메라 이동</b>
    <button type="button" :class="[$style.cornerAction, $style.gotoAction]" aria-label="저장된 위치로 되돌아가기" @click="gotoHome">
      <svg :class="$style.cornerIcon" viewBox="0 0 18 18" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 6L0.293 6.707L-0.414 6L0.293 5.293L1 6ZM6 18C5.735 18 5.48 17.895 5.293 17.707C5.105 17.519 5 17.265 5 17C5 16.735 5.105 16.48 5.293 16.293C5.48 16.105 5.735 16 6 16V18ZM5.293 11.707L0.293 6.707L1.707 5.293L6.707 10.293L5.293 11.707ZM0.293 5.293L5.293 0.293L6.707 1.707L1.707 6.707L0.293 5.293ZM1 5H11.5V7H1V5ZM11.5 18H6V16H11.5V18ZM18 11.5C18 13.224 17.315 14.877 16.096 16.096C14.877 17.315 13.224 18 11.5 18V16C12.091 16 12.676 15.884 13.222 15.657C13.768 15.431 14.264 15.1 14.682 14.682C15.1 14.264 15.431 13.768 15.657 13.222C15.884 12.676 16 12.091 16 11.5H18ZM11.5 5C13.224 5 14.877 5.685 16.096 6.904C17.315 8.123 18 9.776 18 11.5H16C16 10.909 15.884 10.324 15.657 9.778C15.431 9.232 15.1 8.736 14.682 8.318C14.264 7.9 13.768 7.569 13.222 7.342C12.676 7.116 12.091 7 11.5 7V5Z" fill="currentColor"/>
      </svg>
    </button>
    <button type="button" :class="[$style.cornerAction, $style.saveAction]" aria-label="현재 위치 저장" @click="saveHome">
      <svg :class="$style.cornerIcon" viewBox="-1 -1 18 24" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.123 17.325C5.244 15.787 1 11.775 1 6.923C1.001 6.012 1.182 5.11 1.534 4.27C1.886 3.43 2.401 2.668 3.05 2.028C4.369 0.727 6.147 -0.002 8 0C9.853 -0.002 11.631 0.727 12.95 2.028C13.598 2.668 14.113 3.43 14.464 4.271C14.816 5.111 14.998 6.012 15 6.923C15 11.775 10.756 15.787 8.877 17.325L8.873 17.328C8.606 17.547 8.471 17.657 8.271 17.713C8.115 17.757 7.885 17.757 7.729 17.713C7.532 17.658 7.398 17.549 7.137 17.337L7.123 17.325Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6C6 6.53 6.211 7.039 6.586 7.414C6.961 7.789 7.47 8 8 8C8.53 8 9.039 7.789 9.414 7.414C9.789 7.039 10 6.53 10 6C10 5.47 9.789 4.961 9.414 4.586C9.039 4.211 8.53 4 8 4C7.47 4 6.961 4.211 6.586 4.586C6.211 4.961 6 5.47 6 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div :class="[$style.iconDpad, isDirectionPressed ? $style.iconDpadPressed : '']">
      <img :class="$style.vectorIcon" src="/icons/Home/Cam/Cam_Direction.svg" alt="" />
      <span :class="$style.vectorIcon2" aria-hidden="true"></span>
      <button type="button" :class="[$style.padHit, $style.padUp]" aria-label="위로 이동" @pointerdown.prevent="move(0, 1)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
      <button type="button" :class="[$style.padHit, $style.padLeft]" aria-label="왼쪽으로 이동" @pointerdown.prevent="move(-1, 0)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
      <button type="button" :class="[$style.padHit, $style.padRight]" aria-label="오른쪽으로 이동" @pointerdown.prevent="move(1, 0)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
      <button type="button" :class="[$style.padHit, $style.padDown]" aria-label="아래로 이동" @pointerdown.prevent="move(0, -1)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { usePtz } from '@/composables/usePtz'

const emit = defineEmits(['close'])
const { startMove, stopMove, saveHome, gotoHome } = usePtz()
let moving = false
const isDirectionPressed = ref(false)

function close() {
  stop()
  emit('close')
}

function move(pan, tilt) {
  moving = true
  isDirectionPressed.value = true
  startMove(pan, tilt)
}

function stop() {
  isDirectionPressed.value = false
  if (!moving) return
  moving = false
  stopMove()
}

onBeforeUnmount(stop)
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
.closeButton:focus-visible {
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

.title {
  position: absolute;
  top: 1.4rem;
  left: 50%;
  width: 8.2rem;
  height: 2.4rem;
  display: inline-block;
  transform: translateX(-50%);
  color: var(--home-text);
  font-family: 'MalangBold', 'Hancom MalangMalang', sans-serif;
  font-size: 1.6rem;
  line-height: 2.4rem;
  text-align: center;
}

.iconDpad {
  position: absolute;
  top: 8.3rem;
  left: 50%;
  width: min(20rem, calc(100% - 8rem));
  aspect-ratio: 1;
  height: auto;
  overflow: hidden;
  transform: translateX(-50%);
  transition: transform 0.12s ease;
  transform-origin: center;
}

.iconDpadPressed {
  transform: translateX(-50%) scale(0.96);
}

.vectorIcon {
  position: absolute;
  height: 62.5%;
  width: 62.5%;
  top: 18.76%;
  right: 18.74%;
  bottom: 18.74%;
  left: 18.76%;
  max-width: 100%;
  overflow: hidden;
  max-height: 100%;
  opacity: 0;
  pointer-events: none;
}

.vectorIcon2 {
  position: absolute;
  height: 100.05%;
  width: 100%;
  top: 0;
  right: -0.03%;
  bottom: -0.05%;
  left: 0.03%;
  max-width: 100%;
  overflow: hidden;
  max-height: 100%;
  background-color: var(--home-text);
  mask: url('/icons/Home/Cam/Cam_Direction.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_Direction.svg') center / contain no-repeat;
  pointer-events: none;
}

.padHit {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

.padHit:focus,
.padHit:focus-visible,
.cornerAction:focus,
.cornerAction:focus-visible {
  outline: none;
}

.cornerAction {
  position: absolute;
  right: 1.8rem;
  width: 3.2rem;
  height: 3.2rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.gotoAction {
  top: 8.3rem;
  right: 2rem;
  width: 3.2rem;
  height: 3.2rem;
}

.saveAction {
  top: min(25.1rem, calc(100% - 4.6rem));
  right: 2rem;
  bottom: auto;
  width: 3.2rem;
  height: 3.2rem;
}

.cornerIcon {
  position: relative;
  width: 2.6rem;
  height: 2.6rem;
  display: block;
  color: var(--home-text);
}

.gotoAction .cornerIcon {
  width: 2.1rem;
  height: 2.1rem;
}


.padUp {
  left: 37%;
  top: 10%;
  width: 26%;
  height: 27%;
}

.padLeft {
  left: 10%;
  top: 37%;
  width: 27%;
  height: 26%;
}

.padRight {
  left: 63%;
  top: 37%;
  width: 27%;
  height: 26%;
}

.padDown {
  left: 37%;
  top: 63%;
  width: 26%;
  height: 27%;
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

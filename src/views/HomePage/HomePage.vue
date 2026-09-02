<template>
  <div
    ref="page"
    :class="$style.page"
    @touchstart="handlePullStart"
    @touchmove="handlePullMove"
    @touchend="handlePullEnd"
    @touchcancel="cancelPull"
  >
    <div
      :class="[$style.pullIndicator, isRefreshing ? $style.refreshing : '']"
      :style="pullIndicatorStyle"
      role="status"
      aria-label="영상 새로고침"
    >
      <img :class="$style.pullRefreshIcon" src="/icons/Home/Cam/Cam_Restart.svg" alt="" aria-hidden="true" />
    </div>
    <div :class="[$style.pageContent, isPulling ? $style.pulling : '']" :style="pullContentStyle">
      <div :class="$style.topArea">
        <AppLogo />
        <StateBar />
      </div>
      <div :class="$style.videoArea">
        <CamView ref="camView" @ptz-change="handlePtzChange" />
      </div>
      <div :class="$style.homeIconsArea">
        <HomeBar :active-control="activeHomeControl" @control="handleHomeControl" />
      </div>
    </div>
    <Transition name="homeDrawerBackdrop">
      <button
        v-if="activeHomeControl"
        type="button"
        :class="$style.drawerBackdrop"
        aria-label="홈 제어 닫기"
        @click="closeActiveHomeControl"
      />
    </Transition>
    <Transition name="homeDrawerSlide" mode="out-in">
      <div v-if="activeHomeControl" :key="activeHomeControl" :class="$style.drawerMotion">
        <HomeLightDrawer v-if="activeHomeControl === 'light'" @close="closeHomeControl" />
        <HomeTemperatureDrawer v-else-if="activeHomeControl === 'temperature'" @close="closeHomeControl" />
        <HomeTalkDrawer v-else-if="activeHomeControl === 'mic'" @close="closeHomeControl" />
        <HomeDirectionDrawer v-else-if="activeHomeControl === 'direction'" @close="closeDirectionDrawer" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AppLogo from '@/components/Brand/AppLogo.vue'
import { useHomeData } from '@/composables/useHomeData'
import StateBar from './StateBar.vue'
import CamView from './CamView.vue'
import HomeBar from './HomeBar.vue'
import HomeDirectionDrawer from './HomeDirectionDrawer.vue'
import HomeLightDrawer from './HomeLightDrawer.vue'
import HomeTemperatureDrawer from './HomeTemperatureDrawer.vue'
import HomeTalkDrawer from './HomeTalkDrawer.vue'
import { getReliableLandscape, ORIENTATION_DEBOUNCE_MS } from '@/utils/viewportOrientation'

const { loadHomeData } = useHomeData()
const camView = ref(null)
const page = ref(null)
const activeHomeControl = ref(null)
const pullDistance = ref(0)
const isPulling = ref(false)
const isRefreshing = ref(false)
let pullStartX = 0
let pullStartY = 0
let pullEligible = false
let wasLandscape = false
const PULL_THRESHOLD = 72
const MAX_PULL_DISTANCE = 112

const pullContentStyle = computed(() => ({ transform: `translateY(${pullDistance.value}px)` }))
const pullIndicatorStyle = computed(() => ({
  '--pull-progress': Math.min(1, pullDistance.value / PULL_THRESHOLD),
  opacity: Math.min(1, pullDistance.value / 28),
  transform: `translate(-50%, ${pullDistance.value - 48}px)`,
}))
function isPortraitHome() {
  return window.innerHeight >= window.innerWidth && !activeHomeControl.value
}

function handlePullStart(event) {
  if (isRefreshing.value || !isPortraitHome() || page.value?.scrollTop > 0 || event.touches.length !== 1) return
  if (event.target?.closest?.('button, a, input, textarea, select, [data-no-pull]')) return
  const touch = event.touches[0]
  pullStartX = touch.clientX
  pullStartY = touch.clientY
  pullEligible = true
}

function handlePullMove(event) {
  if (!pullEligible || isRefreshing.value || event.touches.length !== 1) return
  const touch = event.touches[0]
  const deltaX = touch.clientX - pullStartX
  const deltaY = touch.clientY - pullStartY

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    cancelPull()
    return
  }
  if (deltaY <= 0) {
    pullDistance.value = 0
    return
  }

  event.preventDefault()
  isPulling.value = true
  pullDistance.value = Math.min(MAX_PULL_DISTANCE, deltaY * 0.48)
}

async function handlePullEnd() {
  if (!pullEligible) return
  pullEligible = false
  isPulling.value = false

  if (pullDistance.value < PULL_THRESHOLD) {
    pullDistance.value = 0
    return
  }

  isRefreshing.value = true
  pullDistance.value = 56
  try {
    await camView.value?.retryStream?.()
  } finally {
    isRefreshing.value = false
    pullDistance.value = 0
  }
}

function cancelPull() {
  pullEligible = false
  isPulling.value = false
  if (!isRefreshing.value) pullDistance.value = 0
}

function handleHomeControl(action, isActive, previousAction) {
  activeHomeControl.value = isActive ? action : null

  if (previousAction === 'direction' && action !== 'direction') {
    camView.value?.closePtzPad?.()
  }
}

function handlePtzChange(isOpen) {
  if (window.innerWidth > window.innerHeight) {
    activeHomeControl.value = null
    return
  }
  activeHomeControl.value = isOpen ? 'direction' : null
}

function closeHomeControl() {
  activeHomeControl.value = null
}

function closeDirectionDrawer() {
  activeHomeControl.value = null
  camView.value?.closePtzPad?.()
}

function closeActiveHomeControl() {
  if (activeHomeControl.value === 'direction') {
    closeDirectionDrawer()
  } else {
    closeHomeControl()
  }
}

function handleAndroidBack(event) {
  if (!activeHomeControl.value) return

  event.preventDefault()
  closeActiveHomeControl()
}

function resetPortraitScroll() {
  if (window.innerHeight >= window.innerWidth && page.value?.scrollTop) {
    page.value.scrollTop = 0
  }
}

let layoutChangeTimer = null

function handleLayoutChange() {
  window.clearTimeout(layoutChangeTimer)
  layoutChangeTimer = window.setTimeout(() => {
    layoutChangeTimer = null
    const isLandscape = getReliableLandscape(wasLandscape)
    if (isLandscape !== wasLandscape) {
      wasLandscape = isLandscape
      cancelPull()
      closeActiveHomeControl()
    }
    resetPortraitScroll()
  }, ORIENTATION_DEBOUNCE_MS)
}

onMounted(() => {
  wasLandscape = getReliableLandscape(false)
  window.addEventListener('wally:android-back', handleAndroidBack)
  window.visualViewport?.addEventListener('resize', handleLayoutChange)
  window.addEventListener('orientationchange', handleLayoutChange)
  window.addEventListener('resize', handleLayoutChange)
  nextTick(resetPortraitScroll)
  loadHomeData()
})

onBeforeUnmount(() => {
  window.clearTimeout(layoutChangeTimer)
  window.removeEventListener('wally:android-back', handleAndroidBack)
  window.visualViewport?.removeEventListener('resize', handleLayoutChange)
  window.removeEventListener('orientationchange', handleLayoutChange)
  window.removeEventListener('resize', handleLayoutChange)
})
</script>

<style module>
.page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--home-bg);
  color: var(--home-text);
  overscroll-behavior-y: contain;
}

.pageContent {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: 100%;
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.pageContent.pulling {
  transition: none;
}

.pullIndicator {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 50%;
  background: var(--home-muted);
  box-shadow: 0 0.2rem 0.7rem rgba(0, 0, 0, 0.2);
  pointer-events: none;
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
  backdrop-filter: blur(0.4rem);
}

.pullRefreshIcon {
  width: 1.25rem;
  height: 1.25rem;
  display: block;
  filter: brightness(0) invert(1);
  transform: rotate(calc(var(--pull-progress) * 280deg));
  transition: transform 0.08s linear;
}

.refreshing .pullRefreshIcon {
  animation: pullRefreshSpin 0.75s linear infinite;
}

@keyframes pullRefreshSpin {
  to {
    transform: rotate(360deg);
  }
}


.drawerMotion {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(5.6rem + env(safe-area-inset-bottom));
  z-index: 105;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.drawerMotion > * {
  pointer-events: auto;
}

.drawerBackdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: calc(5.6rem + env(safe-area-inset-bottom));
  left: 0;
  z-index: 95;
  padding: 0;
  border: 0;
  background: rgba(45, 41, 38, 0.34);
  box-shadow: inset 0 -16rem 18rem rgba(45, 41, 38, 0.22);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.drawerBackdrop:focus,
.drawerBackdrop:focus-visible {
  outline: none;
}

:global(.homeDrawerSlide-enter-active),
:global(.homeDrawerSlide-leave-active) {
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease;
}

:global(.homeDrawerSlide-enter-from),
:global(.homeDrawerSlide-leave-to) {
  opacity: 0;
  transform: translateY(100%);
}

:global(.homeDrawerSlide-enter-to),
:global(.homeDrawerSlide-leave-from) {
  opacity: 1;
  transform: translateY(0);
}

:global(.homeDrawerBackdrop-enter-active),
:global(.homeDrawerBackdrop-leave-active) {
  transition: opacity 0.24s ease;
}

:global(.homeDrawerBackdrop-enter-from),
:global(.homeDrawerBackdrop-leave-to) {
  opacity: 0;
}

:global(.homeDrawerBackdrop-enter-to),
:global(.homeDrawerBackdrop-leave-from) {
  opacity: 1;
}

@media (min-width: 48rem) and (orientation: portrait) {
  .drawerMotion {
    bottom: calc(7.2rem + env(safe-area-inset-bottom));
  }

  .drawerBackdrop {
    bottom: calc(7.2rem + env(safe-area-inset-bottom));
  }
}

.topArea {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  width: 100%;
  background-color: var(--home-panel-bg);
}

.homeIconsArea {
  position: relative;
  z-index: 91;
  display: block;
  flex: 0 0 auto;
  width: 100%;
}

@media (orientation: portrait) {
  .page {
    scroll-padding-top: 0;
  }

  .pageContent {
    min-height: min-content;
  }
}

.videoArea {
  display: flex;
  flex-direction: column;
}


@media (orientation: landscape) {
  .page {
    position: fixed;
    inset: 0;
    width: 100dvw;
    height: 100dvh;
    min-width: 100dvw;
    min-height: 100dvh;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: hidden;
    background-color: #000;
    color: #fff;
  }

  .pageContent {
    position: fixed;
    inset: 0;
    width: 100dvw;
    height: 100dvh;
    min-width: 100dvw;
    min-height: 100dvh;
    flex-direction: row;
    align-items: stretch;
    transform: none !important;
  }

  .pullIndicator {
    display: none;
  }

  .topArea,
  .homeIconsArea {
    display: none;
  }

  .videoArea {
    width: 100%;
    height: 100%;
    flex: 1 1 100%;
    min-width: 0;
    min-height: 0;
  }
}

:global(html.home-force-portrait) .page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  background: var(--home-bg);
  color: var(--home-text);
}

:global(html.home-force-portrait) .pageContent {
  position: relative;
  inset: auto;
  width: 100%;
  height: max-content;
  min-width: 0;
  min-height: 0;
  display: block;
  flex: none;
  overflow: visible;
}

:global(html.home-force-portrait) .topArea {
  display: flex;
}

:global(html.home-force-portrait) .homeIconsArea {
  display: block !important;
  flex: 0 0 7.2rem;
  width: 100%;
  height: 7.2rem;
  min-height: 7.2rem;
  overflow: visible;
  visibility: visible;
  opacity: 1;
}

:global(html.home-force-portrait) .homeIconsArea > * {
  display: flex !important;
  width: 100%;
  height: 7.2rem;
  min-height: 7.2rem;
}

:global(html.home-force-portrait) .videoArea {
  flex: 0 0 auto;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  min-height: 0;
  overflow: hidden;
}

@media (orientation: landscape) {
  :global(html.home-force-portrait) .drawerMotion {
    top: 0;
    bottom: calc(5.6rem + env(safe-area-inset-bottom));
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    pointer-events: auto;
  }

  :global(html.home-force-portrait) .drawerMotion > * {
    flex: 0 0 auto;
  }

  :global(html.home-force-portrait) .page {
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }

  :global(html.home-force-portrait) .pageContent {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    height: auto;
    min-height: 100%;
    padding-bottom: 7.2rem;
  }

  :global(html.home-force-portrait) .topArea {
    display: flex;
  }

  :global(html.home-force-portrait) .videoArea {
    flex: 0 0 auto;
    width: 100%;
    height: auto;
    min-height: 0;
    aspect-ratio: 16 / 9;
  }

  :global(html.home-force-portrait) .homeIconsArea {
    display: block !important;
    position: fixed;
    right: 0;
    bottom: calc(5.6rem + env(safe-area-inset-bottom));
    left: 0;
    z-index: 99;
    flex: 0 0 7.2rem;
    width: 100%;
    height: 7.2rem;
    visibility: visible;
    opacity: 1;
  }
}

</style>

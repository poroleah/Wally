<template>
  <div id="app" :class="themeClass">
    <div class="page-content" :class="{ 'page-content--fullscreen': isFullscreenPage }">
      <RouterView />
    </div>
    <Nav v-if="showNav" />
    <Transition name="app-toast">
      <div v-if="toastMessage" class="app-toast" role="status" aria-live="polite">
        {{ toastMessage }}
      </div>
    </Transition>
    <SplashScreen />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Nav from '@/components/Nav/Nav.vue'
import SplashScreen from '@/components/SplashScreen.vue'
import { ROUTES } from '@/constants'

const route = useRoute()
const isLandscape = ref(false)
const forceHomePortrait = ref(false)
const themeClass = ref('theme-light')
const toastMessage = ref('')
let unsubscribeTheme = null
let toastTimer = null

const updateOrientation = () => {
  isLandscape.value = window.innerWidth > window.innerHeight
  if (!isLandscape.value) forceHomePortrait.value = false
}

const updateForceHomePortrait = (event) => {
  forceHomePortrait.value = Boolean(event.detail)
}

const showToast = (event) => {
  window.clearTimeout(toastTimer)
  toastMessage.value = event.detail?.message || ''
  if (!toastMessage.value) return

  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
    toastTimer = null
  }, event.detail?.duration || 2000)
}

onMounted(() => {
  updateOrientation()
  window.addEventListener('resize', updateOrientation)
  window.addEventListener('wally:home-force-portrait', updateForceHomePortrait)
  window.addEventListener('wally:show-toast', showToast)
  forceHomePortrait.value = document.documentElement.classList.contains('home-force-portrait')
  unsubscribeTheme = window.__wallyTheme?.subscribe?.((theme) => {
    themeClass.value = `theme-${theme}`
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateOrientation)
  window.removeEventListener('wally:home-force-portrait', updateForceHomePortrait)
  window.removeEventListener('wally:show-toast', showToast)
  window.clearTimeout(toastTimer)
  unsubscribeTheme?.()
})

const isHomeLandscape = computed(() => route.path === ROUTES.HOME && isLandscape.value && !forceHomePortrait.value)
const authRoutes = [ROUTES.LOGIN_ADDRESS, ROUTES.LOGIN]
const isAuthRoute = computed(() => authRoutes.includes(route.path))
const isFullscreenPage = computed(() => isHomeLandscape.value || isAuthRoute.value)
const showNav = computed(() => !isHomeLandscape.value && !isAuthRoute.value)
</script>

<style>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'MalangBold';
  src: url('@/assets/Fonts/Malang_Bold.ttf') format('truetype');
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: clamp(8px, 2.778vw, 16px); /* 1rem = 10px @ 360px, scales with viewport */
}

:root {
  --fluid-text-sm: clamp(1.2rem, 3.1vw, 2rem);
  --fluid-text-md: clamp(1.4rem, 3.5vw, 2rem);
  --fluid-text-lg: clamp(1.6rem, 4vw, 2rem);
  --fluid-title-md: clamp(1.6rem, 4.1vw, 2.6rem);
  --fluid-title-lg: clamp(2rem, 6.2vw, 3.6rem);
  --fluid-sheet-header-h: clamp(5.2rem, 13.3vw, 8.8rem);
  --fluid-row-h: clamp(4.8rem, 12.3vw, 8rem);
  --fluid-gap-md: clamp(2rem, 5vw, 4rem);
  --fluid-pad-inline: clamp(1.6rem, 4vw, 2.4rem);
  --fluid-pad-inline-lg: clamp(1.6rem, 4vw, 2.8rem);
  --fluid-pad-input: clamp(1rem, 2.6vw, 1.8rem);
  --fluid-icon-md: clamp(2.4rem, 6.2vw, 4rem);
  --fluid-icon-lg: clamp(2rem, 5vw, 2.8rem);
  --fluid-offset-sm: clamp(0.9rem, 2.3vw, 1.5rem);
  --fluid-offset-md: clamp(1rem, 2.6vw, 1.6rem);
  --fluid-label-offset: clamp(4.3rem, 11vw, 7.2rem);
  --fluid-logo-head-h: clamp(6rem, 15.4vw, 10rem);
  --fluid-logo-top: clamp(1.2rem, 3vw, 2rem);
  --fluid-logo-left: clamp(1.7rem, 4.4vw, 3rem);
  --fluid-logo-w: clamp(6.8rem, 17.4vw, 12rem);
  --fluid-logo-h: clamp(3.7rem, 9.5vw, 6.5rem);
}

html, body {
  width: 100%;
  height: 100%;
  overscroll-behavior: none;
  background-color: var(--app-bg);
  overflow-x: hidden;
}

::-webkit-scrollbar {
  display: none;
}

* {
  scrollbar-width: none;
}

#app {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  display: flex;
  background-color: var(--app-bg);
  color: var(--app-text);
  flex-direction: column;
}

.page-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  background-color: var(--app-bg);
}

html:not(.wally-native) .page-content:not(.page-content--fullscreen) {
  padding-bottom: 5.6rem;
}

.page-content--fullscreen {
  flex-basis: 100%;
  width: 100%;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
}

.app-toast {
  position: fixed;
  left: 50%;
  bottom: calc(7.2rem + env(safe-area-inset-bottom, 0px));
  z-index: 10000;
  max-width: calc(100vw - 4rem);
  padding: 1.1rem 1.8rem;
  border-radius: 2.4rem;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  font-family: 'Malang', sans-serif;
  font-size: 1.4rem;
  line-height: 1.4;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 0.4rem 1.4rem var(--app-shadow);
  transform: translateX(-50%);
  pointer-events: none;
}

.app-toast-enter-active,
.app-toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.6rem);
}

@media (min-width: 48rem) and (orientation: portrait) {
  html:not(.wally-native) .page-content:not(.page-content--fullscreen) {
    padding-bottom: 7.2rem;
  }
}

</style>

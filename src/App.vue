<template>
  <div id="app" :class="themeClass">
    <div class="page-content" :class="{ 'page-content--fullscreen': isFullscreenPage }">
      <RouterView />
    </div>
    <Nav v-if="showNav" />
    <Transition name="session-chip">
      <div v-if="showSessionChip" class="session-chip" role="status">
        <!-- mewly의 phosphor ph-clock(regular)과 동일한 지오메트리 -->
        <svg class="session-chip-icon" viewBox="0 0 256 256" fill="none" aria-hidden="true">
          <circle cx="128" cy="128" r="96" stroke="currentColor" stroke-width="16" />
          <polyline points="128 72 128 128 184 128" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ sessionRemainingText }}
      </div>
    </Transition>
    <Transition name="app-toast">
      <div v-if="toastMessage" class="app-toast" role="status" aria-live="polite">
        {{ toastMessage }}
      </div>
    </Transition>
    <SessionExpiryModal
      :show="warningVisible"
      :remaining-seconds="sessionRemainingSeconds"
      :can-extend="canExtendSession"
      :extending="extendingSession"
      @extend="extendSession"
      @logout="logout"
    />
    <SplashScreen />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Nav from '@/components/Nav/Nav.vue'
import SessionExpiryModal from '@/components/App/SessionExpiryModal.vue'
import SplashScreen from '@/components/App/SplashScreen.vue'
import { ROUTES } from '@/constants'
import { useAuth } from '@/composables/useAuth'
import { useAutoLifecycle } from '@/composables/useAutoLifecycle'
import { getReliableLandscape, isEditableElement, ORIENTATION_DEBOUNCE_MS } from '@/utils/viewportOrientation'

// The backend keeps streaming/analysis off until asked (FR-048/FR-049);
// Wally has no manual toggle, so this watcher is the only thing that turns
// them on. It is inert until the SSE reports state after login.
useAutoLifecycle()

const route = useRoute()
const isLandscape = ref(false)
const forceHomePortrait = ref(false)
const themeClass = ref('theme-light')
const toastMessage = ref('')
let unsubscribeTheme = null
let toastTimer = null
let orientationTimer = null
let focusedElementTimer = null

const updateOrientation = () => {
  window.clearTimeout(orientationTimer)
  orientationTimer = window.setTimeout(() => {
    orientationTimer = null
    isLandscape.value = getReliableLandscape(isLandscape.value)
    if (!isLandscape.value) forceHomePortrait.value = false
  }, ORIENTATION_DEBOUNCE_MS)
}

const keepFocusedElementVisible = () => {
  const element = document.activeElement
  if (!isEditableElement(element)) return

  window.clearTimeout(focusedElementTimer)
  focusedElementTimer = window.setTimeout(() => {
    focusedElementTimer = null
    if (document.activeElement === element) element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, ORIENTATION_DEBOUNCE_MS)
}

const handleViewportChange = () => {
  updateOrientation()
  keepFocusedElementVisible()
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
  window.addEventListener('resize', handleViewportChange)
  window.addEventListener('orientationchange', handleViewportChange)
  window.visualViewport?.addEventListener('resize', handleViewportChange)
  document.addEventListener('focusin', keepFocusedElementVisible)
  window.addEventListener('wally:home-force-portrait', updateForceHomePortrait)
  window.addEventListener('wally:show-toast', showToast)
  forceHomePortrait.value = document.documentElement.classList.contains('home-force-portrait')
  unsubscribeTheme = window.__wallyTheme?.subscribe?.((theme) => {
    themeClass.value = `theme-${theme}`
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('orientationchange', handleViewportChange)
  window.visualViewport?.removeEventListener('resize', handleViewportChange)
  document.removeEventListener('focusin', keepFocusedElementVisible)
  window.removeEventListener('wally:home-force-portrait', updateForceHomePortrait)
  window.removeEventListener('wally:show-toast', showToast)
  window.clearTimeout(toastTimer)
  window.clearTimeout(orientationTimer)
  window.clearTimeout(focusedElementTimer)
  unsubscribeTheme?.()
})

const isHomeLandscape = computed(() => route.path === ROUTES.HOME && isLandscape.value && !forceHomePortrait.value)
const authRoutes = [ROUTES.LOGIN_ADDRESS, ROUTES.LOGIN]
const isAuthRoute = computed(() => authRoutes.includes(route.path))
const isFullscreenPage = computed(() => isHomeLandscape.value || isAuthRoute.value)
const showNav = computed(() => !isHomeLandscape.value && !isAuthRoute.value)

// A session without 로그인 유지 ends on a fixed clock, so keep the remaining
// time visible on every page instead of surprising the user with a logout.
const {
  isAuthenticated, isPersistentSession, sessionRemainingSeconds,
  warningVisible, canExtendSession, extendingSession, extendSession, logout,
} = useAuth()
const showSessionChip = computed(() =>
  isAuthenticated.value
  && !isPersistentSession.value
  && sessionRemainingSeconds.value > 0
  && !isAuthRoute.value,
)
const sessionRemainingText = computed(() => {
  const total = sessionRemainingSeconds.value
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
})
</script>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

img,
video,
canvas {
  max-width: 100%;
}

input,
textarea,
select,
button {
  min-width: 0;
  max-width: 100%;
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

/* Remove Chromium/WebView's blue touch flash from every interactive control. */
a,
button,
[role='button'],
[tabindex]:not([tabindex='-1']),
input[type='button'],
input[type='submit'],
input[type='reset'],
label,
select,
summary {
  -webkit-tap-highlight-color: transparent;
}

/* Android taps can leave controls focused and draw the browser's blue box. */
a:focus,
button:focus,
[role='button']:focus,
[tabindex]:not([tabindex='-1']):focus,
input[type='button']:focus,
input[type='submit']:focus,
input[type='reset']:focus,
label:focus,
select:focus,
summary:focus {
  outline: none;
}

/* Preserve a clear focus indicator for desktop keyboard navigation. */
@media (hover: hover) and (pointer: fine) {
  a:focus-visible,
  button:focus-visible,
  [role='button']:focus-visible,
  [tabindex]:not([tabindex='-1']):focus-visible,
  input[type='button']:focus-visible,
  input[type='submit']:focus-visible,
  input[type='reset']:focus-visible,
  select:focus-visible,
  summary:focus-visible {
    outline: 0.15rem solid var(--app-primary-strong);
    outline-offset: 0.15rem;
  }
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

/* mewly MainView .session-chip 원본 치수 — 테두리·그림자 없는 민무늬 알약.
   글꼴만 Wally의 Malang을 쓴다. */
.session-chip {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 29px);
  left: 50%;
  z-index: 9000;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 100px;
  background: var(--session-chip-bg);
  color: var(--session-chip-text);
  font-family: 'Malang', sans-serif;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.session-chip-icon {
  width: 13.5px;
  height: 13.5px;
  flex: none;
}

.session-chip-enter-active,
.session-chip-leave-active {
  transition: opacity 0.18s ease;
}

.session-chip-enter-from,
.session-chip-leave-to {
  opacity: 0;
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

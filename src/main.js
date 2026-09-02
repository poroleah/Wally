import './assets/main.css'

import { createApp } from 'vue'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import RootApp from './App.vue'
import router from './router'
import { SplashScreen } from '@capacitor/splash-screen'
import { ROUTES } from '@/constants'
import { themeSrcDirective } from '@/directives/themeSrc'
import { initNotificationActions } from '@/utils/notifications'
import { ensureLabelGroupsInjected } from '@/composables/analysisConfig'
import { initScheduleAlarmSync } from '@/utils/scheduleAlarmSync'
import { initAbnormalNotifications } from '@/utils/abnormalNotifications'

const THEME_STORAGE_KEY = 'wally:theme'
const THEME_LIGHT = 'light'
const THEME_DARK = 'dark'
const themeSubscribers = new Set()

function removeInitialSplash() {
  if (!hasWindow()) return
  document.getElementById('splash-init')?.remove()
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function getSystemTheme() {
  if (!hasWindow() || !window.matchMedia) return THEME_LIGHT
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT
}

function getStoredTheme() {
  if (!hasWindow()) return ''
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === THEME_DARK || stored === THEME_LIGHT ? stored : ''
}

function normalizeTheme(theme) {
  return theme === THEME_DARK ? THEME_DARK : THEME_LIGHT
}

function applyTheme(theme) {
  if (!hasWindow()) return
  const nextTheme = normalizeTheme(theme)
  const root = document.documentElement
  const body = document.body

  root.classList.remove('theme-light', 'theme-dark')
  root.classList.add(`theme-${nextTheme}`)
  root.dataset.theme = nextTheme
  root.style.colorScheme = nextTheme

  if (body) {
    body.classList.remove('theme-light', 'theme-dark')
    body.classList.add(`theme-${nextTheme}`)
    body.dataset.theme = nextTheme
  }

  window.WallySystemUi?.setDarkTheme?.(nextTheme === THEME_DARK)

  themeSubscribers.forEach((callback) => callback(nextTheme))
}

function setTheme(theme) {
  if (!hasWindow()) return
  const nextTheme = normalizeTheme(theme)
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  applyTheme(nextTheme)
}

function getCurrentTheme() {
  return getStoredTheme() || document.documentElement.dataset.theme || getSystemTheme()
}

function subscribeTheme(callback) {
  themeSubscribers.add(callback)
  callback(getCurrentTheme())
  return () => themeSubscribers.delete(callback)
}

function initTheme() {
  if (!hasWindow()) return
  applyTheme(getStoredTheme() || getSystemTheme())

  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  media?.addEventListener?.('change', (event) => {
    if (getStoredTheme()) return
    applyTheme(event.matches ? THEME_DARK : THEME_LIGHT)
  })

  window.__wallyTheme = {
    getTheme: getCurrentTheme,
    setTheme,
    toggleTheme: () => setTheme(getCurrentTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK),
    subscribe: subscribeTheme,
  }
}

initTheme()
if (!Capacitor.isNativePlatform()) {
  window.setTimeout(removeInitialSplash, 2500)
}

function initPlatformClasses() {
  if (!hasWindow()) return

  const root = document.documentElement
  const platform = Capacitor.getPlatform()

  root.classList.toggle('wally-native', Capacitor.isNativePlatform())
  root.classList.add(`wally-platform-${platform}`)
}

function initAndroidBackButton() {
  if (!Capacitor.isNativePlatform()) return

  let lastRootBackAt = 0

  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const backEvent = new Event('wally:android-back', { cancelable: true })
    window.dispatchEvent(backEvent)
    if (backEvent.defaultPrevented) return

    const currentPath = router.currentRoute.value.path

    if (currentPath === ROUTES.HOME || currentPath === ROUTES.LOGIN_ADDRESS) {
      const now = Date.now()
      if (now - lastRootBackAt <= 2000) {
        CapacitorApp.exitApp()
        return
      }
      lastRootBackAt = now
      window.dispatchEvent(new CustomEvent('wally:show-toast', {
        detail: {
          message: '한 번 더 누르면 앱이 종료됩니다.',
          duration: 2000,
        },
      }))
      return
    }

    lastRootBackAt = 0

    if (currentPath === ROUTES.LOGIN) {
      router.replace(ROUTES.LOGIN_ADDRESS)
      return
    }

    if (canGoBack && window.history.length > 1) {
      router.back()
      return
    }

    router.replace(ROUTES.HOME)
  })
}

initPlatformClasses()
// analyzer의 라벨 어휘가 비어 있으면(보드 초기화·신규 출고) 자기 어휘를 주입한다
ensureLabelGroupsInjected()
const app = createApp(RootApp)
app.use(router)
app.directive('theme-src', themeSrcDirective)
app.mount('#app')
if (Capacitor.isNativePlatform()) {
  void router.isReady().finally(() => {
    removeInitialSplash()
    void SplashScreen.hide()
  })
  void initNotificationActions(router).then(() => {
    initScheduleAlarmSync()
    initAbnormalNotifications()
  })
}
initAndroidBackButton()

if (!Capacitor.isNativePlatform()) {
  void SplashScreen.hide()
}

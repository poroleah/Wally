import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import LoginAddress from '@/views/LoginPage/LoginAddress.vue'
import LoginPage from '@/views/LoginPage/LoginPage.vue'
import HomePage from '@/views/HomePage/HomePage.vue'
import CalendarPage from '@/views/CalendarPage/CalendarPage.vue'
import AlarmPage from '@/views/AlarmPage/AlarmPage.vue'
import ChatPage from '@/views/ChatBotPage/BotPage.vue'
import SettingsPage from '@/views/SettingsPage/SettingsPage.vue'
import LogPage from '@/views/LogPage/LogPage.vue'
import { LOGIN_NOTICE_STORAGE_KEY, ROUTES } from '@/constants'
import { useAuth } from '@/composables/useAuth'
import { useServerAuth } from '@/composables/useServerAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: ROUTES.LOGIN_ADDRESS },
    { path: ROUTES.LOGIN_ADDRESS, component: LoginAddress },
    { path: ROUTES.LOGIN,         component: LoginPage },
    { path: ROUTES.HOME,          component: HomePage },
    { path: ROUTES.SCHEDULE,  component: CalendarPage },
    { path: ROUTES.ALARM,     component: AlarmPage },
    { path: ROUTES.CHAT,      component: ChatPage },
    { path: ROUTES.SETTINGS,  component: SettingsPage },
    { path: ROUTES.FOOTPRINT, component: LogPage },
  ]
})

let isInitialNavigation = true
const { isAuthenticated, ensureSessionReady } = useAuth()

function loggedOutRoute() {
  if (typeof window !== 'undefined' && window.sessionStorage.getItem(LOGIN_NOTICE_STORAGE_KEY)) {
    return ROUTES.LOGIN
  }
  const { isServerAuthenticated } = useServerAuth()
  return isServerAuthenticated.value ? ROUTES.LOGIN : ROUTES.LOGIN_ADDRESS
}

watch(isAuthenticated, (authenticated) => {
  const authRoutes = [ROUTES.LOGIN_ADDRESS, ROUTES.LOGIN]
  if (!authenticated && !authRoutes.includes(router.currentRoute.value.path)) {
    void router.replace(loggedOutRoute())
  }
})

router.beforeEach(async (to) => {
  const { isServerAuthenticated } = useServerAuth()
  const authRoutes = [ROUTES.LOGIN_ADDRESS, ROUTES.LOGIN]

  await ensureSessionReady()

  if (isInitialNavigation) {
    isInitialNavigation = false

    if (!isAuthenticated.value && to.path !== ROUTES.LOGIN_ADDRESS) {
      const target = loggedOutRoute()
      if (target !== to.path) return target
    }
  }

  if (to.path === ROUTES.LOGIN && !isServerAuthenticated.value && !isAuthenticated.value) {
    return ROUTES.LOGIN_ADDRESS
  }

  if (authRoutes.includes(to.path) && isAuthenticated.value) {
    return ROUTES.HOME
  }

  if (!authRoutes.includes(to.path) && !isAuthenticated.value) {
    return loggedOutRoute()
  }
})

export default router

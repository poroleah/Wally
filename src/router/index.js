import { createRouter, createWebHistory } from 'vue-router'
import LoginAddress from '@/views/LoginPage/LoginAddress.vue'
import LoginPage from '@/views/LoginPage/LoginPage.vue'
import HomePage from '@/views/HomePage/HomePage.vue'
import CalenderPage from '@/views/CalenderPage/CalenderPage.vue'
import AlarmPage from '@/views/AlarmPage/AlarmPage.vue'
import ChatPage from '@/views/ChatBotPage/BotPage.vue'
import SettingsPage from '@/views/SettingsPage/SettingsPage.vue'
import LogPage from '@/views/LogPage/Log_Page.vue'
import { ROUTES } from '@/constants'
import { useAuth } from '@/composables/useAuth'
import { useServerAuth } from '@/composables/useServerAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: ROUTES.LOGIN_ADDRESS },
    { path: ROUTES.LOGIN_ADDRESS, component: LoginAddress },
    { path: ROUTES.LOGIN,         component: LoginPage },
    { path: ROUTES.HOME,          component: HomePage },
    { path: ROUTES.SCHEDULE,  component: CalenderPage },
    { path: ROUTES.ALARM,     component: AlarmPage },
    { path: ROUTES.CHAT,      component: ChatPage },
    { path: ROUTES.SETTINGS,  component: SettingsPage },
    { path: ROUTES.FOOTPRINT, component: LogPage },
  ]
})

let isInitialNavigation = true

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()
  const { isServerAuthenticated } = useServerAuth()
  const authRoutes = [ROUTES.LOGIN_ADDRESS, ROUTES.LOGIN]

  if (isInitialNavigation) {
    isInitialNavigation = false

    if (!isAuthenticated.value && to.path !== ROUTES.LOGIN_ADDRESS) {
      return ROUTES.LOGIN_ADDRESS
    }
  }

  if (to.path === ROUTES.LOGIN && !isServerAuthenticated.value && !isAuthenticated.value) {
    return ROUTES.LOGIN_ADDRESS
  }

  if (authRoutes.includes(to.path) && isAuthenticated.value) {
    return ROUTES.HOME
  }

  if (!authRoutes.includes(to.path) && !isAuthenticated.value) {
    return ROUTES.LOGIN_ADDRESS
  }
})

export default router

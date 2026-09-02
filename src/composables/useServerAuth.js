import { computed, ref } from 'vue'
import { applyWallyHost, getEditableWallyHost, persistWallyHost } from '@/endpoints'

const SERVER_AUTHENTICATED_KEY = 'wally:serverAuthenticated'

function hasWindow() {
  return typeof window !== 'undefined'
}

function loadServerAuthenticated() {
  if (!hasWindow()) return false
  return window.sessionStorage.getItem(SERVER_AUTHENTICATED_KEY) === 'true'
}

const serverAddress = ref(getEditableWallyHost())
const serverAuthenticated = ref(loadServerAuthenticated())

export function useServerAuth() {
  const isServerAuthenticated = computed(() => serverAuthenticated.value)

  function authenticateServer() {
    // Activate only — the host is persisted by login() once the backend
    // actually responds, so a typo never sticks in localStorage.
    const host = applyWallyHost(serverAddress.value)
    if (!host) return false

    serverAddress.value = host
    serverAuthenticated.value = true

    if (hasWindow()) {
      window.sessionStorage.setItem(SERVER_AUTHENTICATED_KEY, 'true')
    }

    return true
  }

  function clearServerAuthentication() {
    serverAuthenticated.value = false
    serverAddress.value = ''
    applyWallyHost('')
    persistWallyHost()
    if (hasWindow()) {
      window.sessionStorage.removeItem(SERVER_AUTHENTICATED_KEY)
    }
  }

  return {
    serverAddress,
    isServerAuthenticated,
    authenticateServer,
    clearServerAuthentication,
  }
}

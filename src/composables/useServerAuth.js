import { computed, ref } from 'vue'
import { getEditableWallyHost, setStoredWallyHost } from '@/endpoints'

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
    const host = setStoredWallyHost(serverAddress.value)
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
    setStoredWallyHost('')
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

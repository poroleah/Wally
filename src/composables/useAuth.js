import { computed, readonly, ref } from 'vue'
import { API_ENDPOINTS } from '@/endpoints'
import { SERVER_REQUEST_TIMEOUT_MS } from '@/constants/network'
import { apiFetch } from './useFetch'

const SESSION_KIND_KEY = 'wally:sessionKind'
const TOKEN_KEY = 'wally:token'
const REFRESH_TOKEN_KEY = 'wally:refreshToken'
const LEGACY_SESSION_KIND_KEY = 'session_kind'
const LEGACY_TOKEN_KEY = 'token'
const LEGACY_REFRESH_TOKEN_KEY = 'refresh_token'
const SESSION_KIND_PERSISTENT = 'persistent'
const SESSION_KIND_EPHEMERAL = 'ephemeral'

const token = ref('')
const refreshToken = ref('')
const sessionKind = ref(SESSION_KIND_EPHEMERAL)
const expiresAt = ref(0)
let refreshPromise = null
let sessionInitialization = null

export class LoginRateLimitError extends Error {
  constructor(message, retryAfterSeconds = null) {
    super(message)
    this.name = 'LoginRateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function getStorage(kind) {
  if (!hasWindow()) return null
  return kind === SESSION_KIND_PERSISTENT ? window.localStorage : window.sessionStorage
}

function clearStoredSession() {
  if (!hasWindow()) return
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(REFRESH_TOKEN_KEY)
    storage.removeItem(SESSION_KIND_KEY)
    storage.removeItem(LEGACY_TOKEN_KEY)
    storage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
    storage.removeItem(LEGACY_SESSION_KIND_KEY)
  }
}

function writeStoredSession(kind, sessionToken, sessionRefreshToken) {
  clearStoredSession()
  const storage = getStorage(kind)
  if (!storage) return
  storage.setItem(TOKEN_KEY, sessionToken)
  storage.setItem(REFRESH_TOKEN_KEY, sessionRefreshToken || '')
  storage.setItem(SESSION_KIND_KEY, kind)
  storage.setItem(LEGACY_TOKEN_KEY, sessionToken)
  storage.setItem(LEGACY_REFRESH_TOKEN_KEY, sessionRefreshToken || '')
  storage.setItem(LEGACY_SESSION_KIND_KEY, kind)
}

function loadStoredSession() {
  if (!hasWindow()) return { kind: SESSION_KIND_EPHEMERAL, token: '', refreshToken: '' }

  for (const kind of [SESSION_KIND_PERSISTENT, SESSION_KIND_EPHEMERAL]) {
    const storage = getStorage(kind)
    const storedToken = storage?.getItem(TOKEN_KEY) || storage?.getItem(LEGACY_TOKEN_KEY) || ''
    if (!storedToken) continue
    return {
      kind: storage.getItem(SESSION_KIND_KEY) || storage.getItem(LEGACY_SESSION_KIND_KEY) || kind,
      token: storedToken,
      refreshToken: storage.getItem(REFRESH_TOKEN_KEY) || storage.getItem(LEGACY_REFRESH_TOKEN_KEY) || '',
    }
  }

  return { kind: SESSION_KIND_EPHEMERAL, token: '', refreshToken: '' }
}

function decodeTokenPayload(jwt) {
  try {
    const parts = String(jwt || "").split(".")
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

function resolveExpiryMs(jwt, expiresInSeconds) {
  const payload = decodeTokenPayload(jwt)
  if (payload?.exp) return Number(payload.exp) * 1000
  if (Number.isFinite(Number(expiresInSeconds))) return Date.now() + Number(expiresInSeconds) * 1000
  return 0
}

function applySession(data, kind, fallbackRefreshToken = '') {
  token.value = data.token || data.access_token || ''
  refreshToken.value = data.refresh_token || fallbackRefreshToken || ''
  sessionKind.value = kind
  expiresAt.value = resolveExpiryMs(token.value, data.expires_in)
  writeStoredSession(kind, token.value, refreshToken.value)
}

async function revokeRefreshToken(sessionRefreshToken) {
  if (!sessionRefreshToken) return
  try {
    await apiFetch(API_ENDPOINTS.logout, {
      method: 'POST',
      body: { refresh_token: sessionRefreshToken },
    })
  } catch {
    // Best-effort logout. Local session cleanup is still enough for the app UI.
  }
}

async function terminateSession({ revoke = true } = {}) {
  const sessionRefreshToken = refreshToken.value
  token.value = ''
  refreshToken.value = ''
  sessionKind.value = SESSION_KIND_EPHEMERAL
  expiresAt.value = 0
  clearStoredSession()

  if (revoke) {
    await revokeRefreshToken(sessionRefreshToken)
  }
}

async function performTokenRefresh() {
  if (!refreshToken.value) return false

  const currentRefreshToken = refreshToken.value
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SERVER_REQUEST_TIMEOUT_MS)
  let res
  try {
    res = await apiFetch(API_ENDPOINTS.refresh, {
      method: 'POST',
      body: { refresh_token: currentRefreshToken },
      signal: controller.signal,
    })
  } catch (error) {
    // A temporary network failure must not erase a persistent login.
    throw new Error(`refresh network failed: ${error?.message || 'unknown error'}`)
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    if ([400, 401, 403].includes(res.status)) {
      await terminateSession({ revoke: false })
      return false
    }
    // Keep the stored session for temporary server errors and retry later.
    throw new Error(`refresh server error ${res.status}`)
  }

  const data = await res.json()
  applySession(data, sessionKind.value, currentRefreshToken)
  return true
}

function parseRetryAfterSeconds(response, body = {}) {
  const bodyValue = [
    body.retry_after_seconds,
    body.retry_after,
    body.lockout_seconds,
    body.remaining_seconds,
  ].find((value) => Number.isFinite(Number(value)) && Number(value) > 0)

  if (bodyValue !== undefined) return Math.ceil(Number(bodyValue))

  const headerValue = response.headers.get('Retry-After')
  if (!headerValue) return null

  const seconds = Number(headerValue)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds)

  const retryAt = Date.parse(headerValue)
  if (Number.isNaN(retryAt)) return null
  return Math.max(1, Math.ceil((retryAt - Date.now()) / 1000))
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function initializeSession() {
  const stored = loadStoredSession()
  token.value = stored.token
  refreshToken.value = stored.refreshToken
  sessionKind.value = stored.kind
  expiresAt.value = resolveExpiryMs(token.value)

  if (!token.value || !expiresAt.value || expiresAt.value > Date.now()) return Boolean(token.value)

  if (sessionKind.value === SESSION_KIND_PERSISTENT && refreshToken.value) {
    // Do not hold the initial route while the server refreshes a persisted
    // session. API requests share this refresh promise when they need it.
    void refreshAccessToken().catch(() => {
      // Offline/server-down startup keeps the persistent session. A later API
      // request or realtime reconnect will retry the refresh.
    })
    return true
  }

  await terminateSession({ revoke: false })
  return false
}

sessionInitialization = initializeSession()

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)
  const isPersistentSession = computed(() => sessionKind.value === SESSION_KIND_PERSISTENT)

  async function login(username, password, rememberMe = false) {
    let res
    const controller = new AbortController()
    let timeoutId
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort()
        reject(new Error('login timeout'))
      }, SERVER_REQUEST_TIMEOUT_MS)
    })

    try {
      res = await Promise.race([
        apiFetch(API_ENDPOINTS.login, {
          method: 'POST',
          body: { username, password, remember_me: rememberMe },
          signal: controller.signal,
        }),
        timeoutPromise,
      ])
    } catch (e) {
      throw new Error(`network failed: ${e?.message || 'unknown error'}`)
    } finally {
      clearTimeout(timeoutId)
    }

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}))
      throw new LoginRateLimitError(
        body.detail || body.error || 'too many attempts',
        parseRetryAfterSeconds(res, body),
      )
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error('invalid credentials')
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(`server error ${res.status}: ${body.detail || body.error || res.statusText || 'login failed'}`)
    }

    const data = await res.json()
    applySession(data, rememberMe ? SESSION_KIND_PERSISTENT : SESSION_KIND_EPHEMERAL)
  }

  function logout(options) {
    void terminateSession(options)
  }

  function getToken() {
    return token.value
  }

  async function ensureSessionReady() {
    await sessionInitialization
    return Boolean(token.value)
  }

  return {
    accessToken: readonly(token),
    storedRefreshToken: readonly(refreshToken),
    sessionExpiresAt: readonly(expiresAt),
    isAuthenticated,
    isPersistentSession,
    login,
    logout,
    refreshAccessToken,
    ensureSessionReady,
    getToken,
  }
}

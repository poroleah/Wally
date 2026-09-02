import { computed, readonly, ref } from 'vue'
import { API_ENDPOINTS, persistWallyHost } from '@/endpoints'
import { LOGIN_NOTICE_STORAGE_KEY, SESSION_EXPIRED_NOTICE } from '@/constants'
import { SERVER_REQUEST_TIMEOUT_MS } from '@/constants/network'
import { apiFetch } from './useFetch'
import network from '../../config/network.json'

const SESSION_KIND_KEY = 'wally:sessionKind'
const TOKEN_KEY = 'wally:token'
const REFRESH_TOKEN_KEY = 'wally:refreshToken'
const LEGACY_SESSION_KIND_KEY = 'session_kind'
const LEGACY_TOKEN_KEY = 'token'
const LEGACY_REFRESH_TOKEN_KEY = 'refresh_token'
const SESSION_KIND_PERSISTENT = 'persistent'
const SESSION_KIND_EPHEMERAL = 'ephemeral'
// First login must change the initial password (FR-006). The flag rides the
// login response and is persisted with the session so a reload keeps forcing
// the change until it actually happens.
const MUST_CHANGE_KEY = 'wally:mustChangePassword'

const token = ref('')
const refreshToken = ref('')
const sessionKind = ref(SESSION_KIND_EPHEMERAL)
const expiresAt = ref(0)
const sessionRemainingSeconds = ref(0)
const warningVisible = ref(false)
const extendingSession = ref(false)
const mustChangePassword = ref(false)
let refreshPromise = null
let sessionInitialization = null

// Streams and SSE never pass authFetch, so nothing refreshes an aging token
// on their behalf: a session with a refresh token renews itself before the
// access token expires, and one without ends at expiry instead of silently
// feeding 401s to the relays.
const AUTO_REFRESH_LEAD_MS = network.session.autoRefreshLeadMs
// Lead time for the expiry-warning modal on a session without 로그인 유지.
const WARNING_LEAD_MS = network.session.warningLeadMs
let autoRefreshTimer = null
let expiryLogoutTimer = null
let warningTimer = null
let sessionClockTimer = null

function clearSessionTimers() {
  if (autoRefreshTimer) clearTimeout(autoRefreshTimer)
  if (expiryLogoutTimer) clearTimeout(expiryLogoutTimer)
  if (warningTimer) clearTimeout(warningTimer)
  autoRefreshTimer = null
  expiryLogoutTimer = null
  warningTimer = null
}

// Drives the countdown chip App.vue shows for a session without 로그인 유지.
// Each tick recomputes from expiresAt, so a token refresh resets the display
// without extra bookkeeping.
function stopSessionClock() {
  if (sessionClockTimer) clearInterval(sessionClockTimer)
  sessionClockTimer = null
  sessionRemainingSeconds.value = 0
}

function updateSessionRemainingSeconds() {
  if (!expiresAt.value) {
    sessionRemainingSeconds.value = 0
    return
  }
  sessionRemainingSeconds.value = Math.max(0, Math.ceil((expiresAt.value - Date.now()) / 1000))
}

function startSessionClock() {
  stopSessionClock()
  if (!token.value || !expiresAt.value) return
  updateSessionRemainingSeconds()
  sessionClockTimer = setInterval(updateSessionRemainingSeconds, 1000)
}

function scheduleSessionTimers() {
  clearSessionTimers()
  if (!token.value || !expiresAt.value) return

  const now = Date.now()

  // 로그인 유지: renew silently before expiry. Only persistent sessions renew
  // on their own — an ephemeral session ends on a fixed clock unless the user
  // extends it from the warning modal.
  if (sessionKind.value === SESSION_KIND_PERSISTENT && refreshToken.value) {
    const delay = Math.max(0, expiresAt.value - now - AUTO_REFRESH_LEAD_MS)
    autoRefreshTimer = setTimeout(() => {
      refreshAccessToken().catch(() => {
        // Temporary failure keeps the session; the next 401-driven refresh
        // (authFetch or the stream probe) retries.
      })
    }, delay)
    return
  }

  if (sessionKind.value === SESSION_KIND_EPHEMERAL) {
    const warningDelay = expiresAt.value - WARNING_LEAD_MS - now
    if (warningDelay <= 0) {
      warningVisible.value = true
    } else {
      warningTimer = setTimeout(() => {
        warningVisible.value = true
      }, warningDelay)
    }
  }

  expiryLogoutTimer = setTimeout(() => {
    void terminateSession({ revoke: true, notice: SESSION_EXPIRED_NOTICE })
  }, Math.max(0, expiresAt.value - now))
}

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
    storage.removeItem(MUST_CHANGE_KEY)
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
  // Re-persisted on every session write (a refresh rotation rewrites the
  // whole set) so the forced-change state survives until cleared.
  if (mustChangePassword.value) storage.setItem(MUST_CHANGE_KEY, '1')
}

function loadStoredSession() {
  if (!hasWindow()) return { kind: SESSION_KIND_EPHEMERAL, token: '', refreshToken: '', mustChange: false }

  for (const kind of [SESSION_KIND_PERSISTENT, SESSION_KIND_EPHEMERAL]) {
    const storage = getStorage(kind)
    const storedToken = storage?.getItem(TOKEN_KEY) || storage?.getItem(LEGACY_TOKEN_KEY) || ''
    if (!storedToken) continue
    return {
      kind: storage.getItem(SESSION_KIND_KEY) || storage.getItem(LEGACY_SESSION_KIND_KEY) || kind,
      token: storedToken,
      refreshToken: storage.getItem(REFRESH_TOKEN_KEY) || storage.getItem(LEGACY_REFRESH_TOKEN_KEY) || '',
      mustChange: storage.getItem(MUST_CHANGE_KEY) === '1',
    }
  }

  return { kind: SESSION_KIND_EPHEMERAL, token: '', refreshToken: '', mustChange: false }
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
  // A fresh token dismisses the warning; scheduleSessionTimers re-arms it if
  // the new expiry is somehow already inside the warning window.
  warningVisible.value = false
  scheduleSessionTimers()
  startSessionClock()
}

async function revokeSessionTokens(sessionRefreshToken, sessionAccessToken) {
  // Ephemeral sessions may carry no refresh token (FR-002); the access token
  // then identifies the user for the server-side epoch bump (FR-003), so a
  // logout still invalidates the token before its natural expiry.
  if (!sessionRefreshToken && !sessionAccessToken) return
  try {
    await apiFetch(API_ENDPOINTS.logout, {
      method: 'POST',
      headers: sessionAccessToken ? { Authorization: `Bearer ${sessionAccessToken}` } : {},
      body: { refresh_token: sessionRefreshToken || null },
    })
  } catch {
    // Best-effort logout. Local session cleanup is still enough for the app UI.
  }
}

async function terminateSession({ revoke = true, notice = '' } = {}) {
  const sessionRefreshToken = refreshToken.value
  const sessionAccessToken = token.value
  token.value = ''
  refreshToken.value = ''
  sessionKind.value = SESSION_KIND_EPHEMERAL
  expiresAt.value = 0
  mustChangePassword.value = false
  warningVisible.value = false
  extendingSession.value = false
  clearSessionTimers()
  stopSessionClock()
  clearStoredSession()

  // Why the session ended, shown once on the login page (e.g. replaced by a
  // newer login, or expired without a refresh token).
  if (notice && hasWindow()) {
    window.sessionStorage.setItem(LOGIN_NOTICE_STORAGE_KEY, notice)
  }

  if (revoke) {
    await revokeSessionTokens(sessionRefreshToken, sessionAccessToken)
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
      await terminateSession({ revoke: false, notice: SESSION_EXPIRED_NOTICE })
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
  mustChangePassword.value = !!stored.mustChange
  expiresAt.value = resolveExpiryMs(token.value)

  if (!token.value) return false
  if (!expiresAt.value || expiresAt.value > Date.now()) {
    scheduleSessionTimers()
    startSessionClock()
    return true
  }

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
  // 연장 needs a refresh token; a backend that issues none for ephemeral
  // sessions leaves the warning modal's extend button disabled.
  const canExtendSession = computed(() =>
    sessionKind.value === SESSION_KIND_EPHEMERAL && !!refreshToken.value,
  )

  async function extendSession() {
    if (!canExtendSession.value) return false
    extendingSession.value = true
    try {
      return await refreshAccessToken()
    } catch {
      // Temporary refresh failure keeps the session and the modal; the user
      // can retry 연장 until expiry actually logs the session out.
      return false
    } finally {
      extendingSession.value = false
    }
  }

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
      // Network-level failure: the backend host was never reached. Do not
      // persist it so the operator can correct the host and retry.
      throw new Error(`network failed: ${e?.message || 'unknown error'}`)
    } finally {
      clearTimeout(timeoutId)
    }

    // The host responded (even on 401/429), so it is reachable — remember it.
    persistWallyHost()

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
    // Set before applySession so writeStoredSession persists the flag.
    mustChangePassword.value = !!data.must_change_password
    applySession(data, rememberMe ? SESSION_KIND_PERSISTENT : SESSION_KIND_EPHEMERAL)
  }

  function logout(options) {
    void terminateSession(options)
  }

  // Called after the change-password request succeeds: lifts the forced
  // first-login state without touching the session itself.
  function confirmPasswordChanged() {
    mustChangePassword.value = false
    if (!hasWindow()) return
    for (const storage of [window.localStorage, window.sessionStorage]) {
      storage.removeItem(MUST_CHANGE_KEY)
    }
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
    sessionRemainingSeconds: readonly(sessionRemainingSeconds),
    warningVisible: readonly(warningVisible),
    extendingSession: readonly(extendingSession),
    mustChangePassword: readonly(mustChangePassword),
    isAuthenticated,
    isPersistentSession,
    canExtendSession,
    login,
    logout,
    extendSession,
    confirmPasswordChanged,
    refreshAccessToken,
    ensureSessionReady,
    getToken,
  }
}

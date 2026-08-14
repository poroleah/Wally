import { computed, readonly, ref } from 'vue'
import { API_ENDPOINTS } from '@/endpoints'
import { apiFetch } from './useFetch'

const SESSION_KIND_KEY = 'wally:sessionKind'
const TOKEN_KEY = 'wally:token'
const REFRESH_TOKEN_KEY = 'wally:refreshToken'
const LEGACY_SESSION_KIND_KEY = 'session_kind'
const LEGACY_TOKEN_KEY = 'token'
const LEGACY_REFRESH_TOKEN_KEY = 'refresh_token'
const SESSION_KIND_PERSISTENT = 'persistent'
const SESSION_KIND_EPHEMERAL = 'ephemeral'
// FR-006/SRS §3.2: the first login must change the initial password.
// The flag rides the login response and is persisted with the session
// so a reload keeps it until the change actually happens.
const MUST_CHANGE_KEY = 'wally:mustChangePassword'
// Why the session ended, carried across navigation to the login page.
// sessionStorage: per-tab, so the notice shows only where it happened.
const LOGIN_NOTICE_KEY = 'wally:loginNotice'
const LOGIN_TIMEOUT_MS = 5000

const token = ref('')
const refreshToken = ref('')
const sessionKind = ref(SESSION_KIND_EPHEMERAL)
const expiresAt = ref(0)
const mustChangePassword = ref(false)

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
    storage.removeItem(MUST_CHANGE_KEY)
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
  // Re-persisted on every session write (a refresh rotation rewrites the
  // whole set) so the pending-change state survives until cleared.
  if (mustChangePassword.value) storage.setItem(MUST_CHANGE_KEY, '1')
  storage.setItem(LEGACY_TOKEN_KEY, sessionToken)
  storage.setItem(LEGACY_REFRESH_TOKEN_KEY, sessionRefreshToken || '')
  storage.setItem(LEGACY_SESSION_KIND_KEY, kind)
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

function applySession(data, kind) {
  token.value = data.token || data.access_token || ''
  refreshToken.value = data.refresh_token || ''
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

async function terminateSession({ revoke = true, reason = '' } = {}) {
  const sessionRefreshToken = refreshToken.value
  token.value = ''
  refreshToken.value = ''
  sessionKind.value = SESSION_KIND_EPHEMERAL
  expiresAt.value = 0
  mustChangePassword.value = false
  clearStoredSession()
  if (reason && hasWindow()) {
    window.sessionStorage.setItem(LOGIN_NOTICE_KEY, reason)
  }

  if (revoke) {
    await revokeRefreshToken(sessionRefreshToken)
  }
}

function consumeLoginNotice() {
  if (!hasWindow()) return ''
  const notice = window.sessionStorage.getItem(LOGIN_NOTICE_KEY) || ''
  window.sessionStorage.removeItem(LOGIN_NOTICE_KEY)
  return notice
}

async function refreshAccessToken() {
  if (!refreshToken.value) return false

  const res = await apiFetch(API_ENDPOINTS.refresh, {
    method: 'POST',
    body: { refresh_token: refreshToken.value },
  })

  if (!res.ok) {
    await terminateSession({ revoke: false })
    return false
  }

  const data = await res.json()
  applySession(data, sessionKind.value)
  return true
}

function initializeSession() {
  const stored = loadStoredSession()
  token.value = stored.token
  refreshToken.value = stored.refreshToken
  sessionKind.value = stored.kind
  mustChangePassword.value = !!stored.mustChange
  expiresAt.value = resolveExpiryMs(token.value)

  if (token.value && expiresAt.value && expiresAt.value <= Date.now()) {
    void terminateSession({ revoke: false })
  }
}

initializeSession()

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
      }, LOGIN_TIMEOUT_MS)
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
      throw new Error(body.detail || 'too many attempts')
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

  function getToken() {
    return token.value
  }

  // Called after a successful password change; rewrites the stored session
  // without the pending-change flag.
  function clearMustChangePassword() {
    if (!mustChangePassword.value) return
    mustChangePassword.value = false
    if (token.value) writeStoredSession(sessionKind.value, token.value, refreshToken.value)
  }

  return {
    accessToken: readonly(token),
    storedRefreshToken: readonly(refreshToken),
    sessionExpiresAt: readonly(expiresAt),
    mustChangePassword: readonly(mustChangePassword),
    isAuthenticated,
    isPersistentSession,
    login,
    logout,
    refreshAccessToken,
    getToken,
    clearMustChangePassword,
    consumeLoginNotice,
  }
}

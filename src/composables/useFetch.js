import { API_ENDPOINTS, createApiUrl } from '@/endpoints'
import { SESSION_REPLACED_NOTICE } from '@/constants'
import network from '../../config/network.json'

function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(String(url || ''))
}

function resolveUrl(url) {
  return isAbsoluteUrl(url) ? url : createApiUrl(url)
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || ''
  if (res.status === 204) return null
  if (contentType.includes('application/json')) {
    return res.json().catch(() => null)
  }
  return res.text().catch(() => '')
}

function createHeaders(options, token) {
  const headers = new Headers(options.headers || {})

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (isPlainObject(options.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

function createRequestOptions(options = {}, token = '') {
  const headers = createHeaders(options, token)
  const body = isPlainObject(options.body) ? JSON.stringify(options.body) : options.body
  return { ...options, headers, body }
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(resolveUrl(url), createRequestOptions(options))
  return res
}

export async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options)
  const data = await parseResponse(res)

  if (!res.ok) {
    const message = data?.detail || data?.error || res.statusText || 'request failed'
    throw new Error(`server error ${res.status}: ${message}`)
  }

  return data
}

export async function authFetch(url, options = {}) {
  const { useAuth } = await import('./useAuth')
  const { getToken, logout, refreshAccessToken, isPersistentSession } = useAuth()
  const res = await fetch(resolveUrl(url), createRequestOptions(options, getToken()))

  if (res.status !== 401) {
    return res
  }

  let detail = ''
  try {
    detail = (await res.clone().json())?.detail || ''
  } catch {
    // Non-JSON 401 body — treated as an ordinary expiry.
  }
  if (detail === 'token revoked') {
    // Epoch mismatch: a newer login replaced this session (FR-047). No
    // refresh attempt — the refresh token is revoked with it, and a logout
    // call with these credentials must not touch the new session.
    logout({ revoke: false, notice: SESSION_REPLACED_NOTICE })
    return res
  }

  let refreshed = false
  if (isPersistentSession.value) {
    try {
      refreshed = await refreshAccessToken()
    } catch {
      // Temporary refresh failure (network/5xx) keeps the session; the
      // caller sees the original 401 and a later request retries.
      return res
    }
  }
  if (refreshed) {
    return fetch(resolveUrl(url), createRequestOptions(options, getToken()))
  }

  logout({ revoke: false })
  return res
}

// EventSource and media elements cannot surface the 401 a dead token gets,
// so a broken stream calls this throttled probe. authFetch's 401 handling
// then refreshes the token (streams pick up the new one on retry) or
// classifies the revoked session and logs out.
const PROBE_MIN_INTERVAL_MS = network.sseProbeMinIntervalMs
let lastProbeAt = 0
export function probeSession() {
  const now = Date.now()
  if (now - lastProbeAt < PROBE_MIN_INTERVAL_MS) return
  lastProbeAt = now
  authFetch(API_ENDPOINTS.camera).catch(() => {
    // Network-level failure — the stream's own retry loop already covers it.
  })
}

export async function authJson(url, options = {}) {
  const res = await authFetch(url, options)
  const data = await parseResponse(res)

  if (!res.ok) {
    const message = data?.detail || data?.error || res.statusText || 'request failed'
    throw new Error(`server error ${res.status}: ${message}`)
  }

  return data
}

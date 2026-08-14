// Babycat-compatible service map.
// The router (port 8000) is the single entry point for everything —
// control, SSE/MJPEG relays, and the HLS/WHEP streaming relays.
// Only WebRTC media (UDP 8189) bypasses it.
const WALLY_HOST_STORAGE_KEY = 'wally_host'

function hasWindow() {
  return typeof window !== 'undefined'
}

function normalizeHost(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  try {
    return new URL(raw.includes('://') ? raw : `http://${raw}`).hostname
  } catch {
    return raw.replace(/^https?:\/\//, '').split('/')[0].split(':')[0]
  }
}

function getStoredWallyHost() {
  if (!hasWindow()) return ''
  const host = normalizeHost(window.localStorage.getItem(WALLY_HOST_STORAGE_KEY))
  return host === 'localhost' ? '' : host
}

function getConfiguredWallyHost() {
  return normalizeHost(import.meta.env.VITE_WALLY_HOST || import.meta.env.HOST_IP || (import.meta.env.DEV ? '192.168.0.10' : ''))
}

export function getBrowserHost() {
  return hasWindow() ? window.location.hostname : ''
}

export function getWallyHost() {
  return getStoredWallyHost() || getConfiguredWallyHost() || getBrowserHost()
}

export function getEditableWallyHost() {
  return getStoredWallyHost() || getConfiguredWallyHost()
}

export function setStoredWallyHost(host) {
  if (!hasWindow()) return ''
  const normalizedHost = normalizeHost(host)
  if (normalizedHost) {
    window.localStorage.setItem(WALLY_HOST_STORAGE_KEY, normalizedHost)
  } else {
    window.localStorage.removeItem(WALLY_HOST_STORAGE_KEY)
  }
  return normalizedHost
}

function getApiUrl(path) {
  return `http://${getWallyHost()}:8000${path}`
}

export function createApiUrl(path) {
  const normalizedPath = String(path || '')
  return getApiUrl(normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`)
}

export const API_ENDPOINTS = {
  get login() {
    return getApiUrl('/api/login')
  },
  get refresh() {
    return getApiUrl('/api/refresh')
  },
  get logout() {
    return getApiUrl('/api/logout')
  },
  get changePassword() {
    return getApiUrl('/api/change-password')
  },
  get camera() {
    return getApiUrl('/camera')
  },
  get clips() {
    return getApiUrl('/clips')
  },
  clipFile(name) {
    return getApiUrl(`/clips/${encodeURIComponent(name)}`)
  },
}

export const APP_ENDPOINTS = {
  get prompt() {
    return getApiUrl('/prompt')
  },
  get ptz() {
    return getApiUrl('/ptz')
  },
  get streamingStart() {
    return getApiUrl('/streaming/start')
  },
  get streamingStop() {
    return getApiUrl('/streaming/stop')
  },
  get analysisStart() {
    return getApiUrl('/analysis/start')
  },
  get analysisStop() {
    return getApiUrl('/analysis/stop')
  },
  // Live state SSE. The router path is /state (its /events carries the
  // stored event history).
  get events() {
    return getApiUrl('/state')
  },
  get mjpeg() {
    return getApiUrl('/stream')
  },
  get vlmSwitch() {
    return getApiUrl('/vlm/switch')
  },
}

export function getStreamHost() {
  return getWallyHost()
}

// HLS and WHEP go through the router relay (single entry). Only the
// WebRTC media itself flows directly from the streamer (UDP 8189).
export function getHlsUrl(host = getStreamHost()) {
  return `http://${host}:8000/live/hls/index.m3u8`
}

export function getWhepUrl(host = getStreamHost()) {
  return `http://${host}:8000/live/whep`
}

export function getEventsUrl(token) {
  return `${APP_ENDPOINTS.events}?token=${encodeURIComponent(token)}`
}

export function getClipUrl(name, size, token) {
  return `${API_ENDPOINTS.clipFile(name)}?s=${size}&token=${encodeURIComponent(token)}`
}

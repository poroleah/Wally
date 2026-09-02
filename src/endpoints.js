// Mewly-compatible service map.
// The gateway is the single entry point for everything — auth/camera/clips
// REST, runtime controls, SSE, and the HLS/WHEP relays. Scheme and port live
// in config/network.json (backendScheme/backendPort).
import network from '../config/network.json'

const WALLY_HOST_STORAGE_KEY = 'wally_host'

const SCHEME = network.backendScheme
const PORT = network.backendPort

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

function getServiceUrl(path) {
  return `${SCHEME}://${getWallyHost()}:${PORT}${path}`
}

function getApiUrl(path) {
  return getServiceUrl(path)
}

function getAppUrl(path) {
  return getServiceUrl(path)
}

export function getApiBaseUrl() {
  return getApiUrl('')
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
  // Stored event history (recorder). Distinct from the live-state SSE at
  // APP_ENDPOINTS.events (/state), hence the separate name.
  get eventHistory() {
    return getApiUrl('/events')
  },
}

export const APP_ENDPOINTS = {
  get prompt() {
    return getAppUrl('/prompt')
  },
  get ptz() {
    return getAppUrl('/ptz')
  },
  get analysisStart() {
    return getAppUrl('/analysis/start')
  },
  get analysisStop() {
    return getAppUrl('/analysis/stop')
  },
  // Streaming start is a precondition for video playback (HLS/WHEP).
  get streamingStart() {
    return getAppUrl('/streaming/start')
  },
  get streamingStop() {
    return getAppUrl('/streaming/stop')
  },
  // Live state SSE. The gateway path is /state; /events is the stored
  // history (API_ENDPOINTS.eventHistory).
  get events() {
    return getAppUrl('/state')
  },
  get mjpeg() {
    return getAppUrl('/stream')
  },
  get vlmSwitch() {
    return getAppUrl('/vlm/switch')
  },
}

export function getStreamHost() {
  return getWallyHost()
}

// HLS and WHEP go through the gateway relay (single entry). Only the
// WebRTC media itself flows directly from the streamer.
export function getHlsUrl(host = getStreamHost()) {
  return `${SCHEME}://${host}:${PORT}/live/hls/index.m3u8`
}

export function getWhepUrl(host = getStreamHost()) {
  return `${SCHEME}://${host}:${PORT}/live/whep`
}

export function getEventsUrl(token) {
  return `${APP_ENDPOINTS.events}?token=${encodeURIComponent(token)}`
}

export function getClipUrl(name, size, token) {
  return `${API_ENDPOINTS.clipFile(name)}?s=${size}&token=${encodeURIComponent(token)}`
}

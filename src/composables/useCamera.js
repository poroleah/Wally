import { computed, reactive, ref, watch } from 'vue'
import { API_ENDPOINTS, APP_ENDPOINTS, getHlsUrl } from '@/endpoints'
import { authFetch, authJson, failureMessage } from './useFetch'
import { useRealtimeEvents } from './useRealtimeEvents'
import {
  hasBackendCameraConfigChanged,
  hasStreamCameraConfigChanged,
  normalizeCameraConfig,
} from '@/utils/cameraConfig'

const CAMERA_ID = 'primary'
const CAMERA_NAME_STORAGE_KEY = 'wally_camera_name'

const cameras = ref([])
const selectedCameraId = ref('')
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const saveStatus = ref('')
const loaded = ref(false)
const reconnectKey = ref(0)
let loadPromise = null

function hasWindow() {
  return typeof window !== 'undefined'
}

function getStoredCameraName() {
  if (!hasWindow()) return ''
  return window.localStorage.getItem(CAMERA_NAME_STORAGE_KEY) || ''
}

function setStoredCameraName(name) {
  if (!hasWindow()) return ''
  const nextName = String(name || '').trim()
  if (nextName) {
    window.localStorage.setItem(CAMERA_NAME_STORAGE_KEY, nextName)
  } else {
    window.localStorage.removeItem(CAMERA_NAME_STORAGE_KEY)
  }
  return nextName
}

const cameraStatus = reactive({
  configured: false,
  connecting: false,
  connected: false,
  message: '',
})

const config = reactive({
  name: '',
  source_type: 'rtsp_camera',
  ip: '',
  rtsp_port: 554,
  username: '',
  password: '',
  password_set: false,
  stream_path: 'stream1',
  onvif_port: null,
})

// Backward-compatible shape for older settings screens/code.
const settings = ref({
  name: '',
  id: '',
  password: '',
  ip: '',
  port: '',
})

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function cameraErrorMessage(body, fallback) {
  return failureMessage(body, fallback)
}

function resolveCameraName(data = {}) {
  return firstValue(
    data.name,
    data.label,
    data.camera_name,
    data.cameraName,
    data.device_name,
    data.deviceName,
    data.room_name,
    data.roomName,
    data.ip,
    data.username,
    '카메라',
  )
}

function applyCameraConfig(data = {}) {
  const configured = Boolean(data.configured)
  config.name = firstValue(getStoredCameraName(), resolveCameraName(data))

  config.source_type = data.source_type || 'rtsp_camera'
  config.ip = data.ip || ''
  config.rtsp_port = data.rtsp_port || 554
  config.username = data.username || ''
  config.password = ''
  config.password_set = !!data.password_set
  config.stream_path = data.stream_path || 'stream1'
  config.onvif_port = data.onvif_port ?? null

  settings.value = {
    name: config.name,
    id: config.username || CAMERA_ID,
    password: '',
    ip: config.ip,
    port: String(config.rtsp_port || ''),
  }

  cameraStatus.configured = configured
  cameraStatus.connecting = false
  cameraStatus.connected = false
  cameraStatus.message = configured ? '' : '등록된 카메라가 없습니다.'

  cameras.value = configured
    ? [{
        id: CAMERA_ID,
        name: config.name,
        status: 'configured',
        configured: true,
        streamUrl: firstValue(data.stream_url, data.streamUrl, data.hls_url, data.hlsUrl),
        hlsUrl: firstValue(data.hls_url, data.hlsUrl),
        raw: data,
      }]
    : []
  selectedCameraId.value = cameras.value[0]?.id || ''
}

async function loadCameras({ force = false } = {}) {
  if (loading.value && loadPromise) return loadPromise
  if (loading.value && !loadPromise) loading.value = false
  if (loaded.value && !force) return cameraStatus.configured

  loading.value = true
  error.value = ''

  loadPromise = (async () => {
    try {
      const data = await authJson(API_ENDPOINTS.camera)
      applyCameraConfig(data)
      loaded.value = true
      return cameraStatus.configured
    } catch (e) {
      error.value = cameraErrorMessage(null, '카메라 정보를 불러오지 못했습니다.')
      cameraStatus.message = error.value
      return false
    } finally {
      loading.value = false
      loadPromise = null
    }
  })()

  return loadPromise
}

// Mewly contract (FR-048/FR-049): POST /camera only stores the profile — the
// source connects and disconnects via explicit /streaming/start·stop, and an
// active stream keeps relaying the OLD profile. A stream-affecting change
// therefore stops the stream before saving and starts it again afterwards.
// Completion is judged by the SSE streaming_active transition, not by the
// request succeeding.
const STREAM_TOGGLE_WAIT_MS = 8000

async function requestStreaming(url) {
  try {
    const res = await authFetch(url, { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

function waitForStreamingActive(target, timeoutMs = STREAM_TOGGLE_WAIT_MS) {
  const { state } = useRealtimeEvents()
  return new Promise((resolve) => {
    if (state.streaming_active === target) return resolve(true)
    const stopWatch = watch(() => state.streaming_active, (value) => {
      if (value !== target) return
      stopWatch()
      clearTimeout(timer)
      resolve(true)
    })
    const timer = setTimeout(() => {
      stopWatch()
      resolve(false)
    }, timeoutMs)
  })
}

async function stopStreamingForUpdate() {
  const { state } = useRealtimeEvents()
  if (state.streaming_active !== true) return
  if (await requestStreaming(APP_ENDPOINTS.streamingStop)) {
    await waitForStreamingActive(false)
  }
}

async function startStreamingAfterUpdate() {
  // Best-effort: if the start is lost, useAutoLifecycle re-issues it once the
  // live state reports the stream off.
  if (await requestStreaming(APP_ENDPOINTS.streamingStart)) {
    await waitForStreamingActive(true)
  }
}

async function saveCameraSettings(settings = {}) {
  saving.value = true
  saveStatus.value = ''
  error.value = ''
  const cameraName = settings.name !== undefined ? String(settings.name || '').trim() : getStoredCameraName()

  const currentConfig = normalizeCameraConfig(config)
  const nextConfig = normalizeCameraConfig({
    source_type: settings.source_type || config.source_type || 'rtsp_camera',
    ip: settings.ip ?? config.ip,
    rtsp_port: settings.rtsp_port ?? settings.port ?? config.rtsp_port ?? 554,
    username: settings.username ?? settings.id ?? config.username,
    stream_path: settings.stream_path || config.stream_path || 'stream1',
    onvif_port: settings.onvif_port === '' ? null : (settings.onvif_port ?? config.onvif_port),
  })
  const backendConfigChanged = !cameraStatus.configured || hasBackendCameraConfigChanged(currentConfig, nextConfig)
  const streamConfigChanged = !cameraStatus.configured || hasStreamCameraConfigChanged(currentConfig, nextConfig, settings.password)

  if (!backendConfigChanged && !settings.password) {
    if (settings.name !== undefined) setStoredCameraName(cameraName)
    applyCameraConfig({
      ...(cameras.value[0]?.raw || {}),
      configured: true,
      ...config,
      name: cameraName,
      password_set: config.password_set,
    })
    loaded.value = true
    saving.value = false
    return true
  }

  const body = { ...nextConfig }

  if (settings.password) {
    body.password = settings.password
  }

  try {
    // The stream must be off while the new profile is stored (mewly
    // procedure); a failed save leaves it off and useAutoLifecycle turns it
    // back on with the previous profile.
    if (streamConfigChanged) await stopStreamingForUpdate()

    const res = await authFetch(API_ENDPOINTS.camera, {
      method: 'POST',
      body,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      saveStatus.value = cameraErrorMessage(data, `카메라 설정 저장에 실패했습니다. (${res.status})`)
      return false
    }

    if (data?.ok === false) {
      saveStatus.value = cameraErrorMessage(data, '카메라 설정 저장에 실패했습니다.')
      return false
    }

    if (settings.name !== undefined) setStoredCameraName(cameraName)

    applyCameraConfig({
      configured: true,
      name: cameraName,
      ...config,
      ...body,
      password_set: Boolean(body.password || config.password_set),
    })
    loaded.value = true
    if (streamConfigChanged) {
      // Reconnect the backend source to the new profile, then the player.
      await startStreamingAfterUpdate()
      reconnectKey.value += 1
    }
    return true
  } catch (e) {
    saveStatus.value = '카메라 설정 저장에 실패했습니다.'
    return false
  } finally {
    saving.value = false
  }
}

function selectCamera(cameraId) {
  if (!cameras.value.some((camera) => camera.id === cameraId)) return false
  selectedCameraId.value = cameraId
  return true
}

function setConnected() {
  cameraStatus.connecting = false
  cameraStatus.connected = true
}

function setDisconnected() {
  cameraStatus.connecting = false
  cameraStatus.connected = false
}

function disconnect() {
  setDisconnected()
}

function refreshStream() {
  reconnectKey.value += 1
}

const selectedCamera = computed(() => (
  cameras.value.find((camera) => camera.id === selectedCameraId.value) || cameras.value[0] || null
))

const ptzEnabled = computed(() => config.onvif_port != null)

const cameraUrl = computed(() => {
  if (!cameraStatus.configured) return null
  const camera = selectedCamera.value
  return firstValue(camera?.streamUrl, camera?.hlsUrl, getHlsUrl())
})

const cameraViewState = computed(() => {
  if (loading.value) return 'loading'
  if (error.value) return 'error'
  if (!cameraStatus.configured) return 'unconfigured'
  if (cameraStatus.connecting) return 'connecting'
  if (cameraStatus.connected) return 'connected'
  return 'configured'
})

export function useCamera() {
  return {
    settings,
    config,
    cameras,
    selectedCamera,
    selectedCameraId,
    cameraStatus,
    cameraUrl,
    cameraViewState,
    loading,
    saving,
    error,
    saveStatus,
    reconnectKey,
    ptzEnabled,
    load: loadCameras,
    loadCameras,
    saveCameraSettings,
    selectCamera,
    disconnect,
    refreshStream,
    setConnected,
    setDisconnected,
  }
}

import { computed, reactive, ref } from 'vue'
import { API_ENDPOINTS, getHlsUrl } from '@/endpoints'
import { authFetch, authJson } from './useFetch'
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
  return body?.error || body?.detail || fallback
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
    if (streamConfigChanged) reconnectKey.value += 1
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

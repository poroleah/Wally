import { ref } from 'vue'
import { APP_ENDPOINTS } from '@/endpoints'
import { authFetch } from './useFetch'

const PTZ_SPEED = 0.5
const status = ref('idle')
const loading = ref(false)
const error = ref('')

async function postPtz(body) {
  loading.value = true
  error.value = ''

  try {
    const res = await authFetch(APP_ENDPOINTS.ptz, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)

    if (!res.ok || data?.ok === false) {
      error.value = data?.detail || data?.error || '카메라 방향 제어에 실패했습니다.'
      return false
    }

    return true
  } catch {
    error.value = '카메라 방향 제어에 실패했습니다.'
    return false
  } finally {
    loading.value = false
  }
}

function startMove(pan, tilt) {
  const panSpeed = pan * PTZ_SPEED
  const tiltSpeed = tilt * PTZ_SPEED
  status.value =
    panSpeed > 0 ? 'move-right' :
    panSpeed < 0 ? 'move-left' :
    tiltSpeed > 0 ? 'move-up' : 'move-down'

  return postPtz({ action: 'move', pan: panSpeed, tilt: tiltSpeed })
}

function stopMove() {
  status.value = 'stop'
  return postPtz({ action: 'stop' })
}

function forceStop() {
  status.value = 'force-stop'
  return postPtz({ action: 'stop' })
}

function saveHome() {
  status.value = 'save'
  return postPtz({ action: 'save' })
}

function gotoHome() {
  status.value = 'goto'
  return postPtz({ action: 'goto' })
}

export function usePtz() {
  return {
    status,
    loading,
    error,
    startMove,
    stopMove,
    forceStop,
    saveHome,
    gotoHome,
  }
}

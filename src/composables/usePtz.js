import { ref } from 'vue'
import { APP_ENDPOINTS } from '@/endpoints'
import { authFetch, failureMessage } from './useFetch'
import ptz from '../../config/ptz.json'

// ONVIF velocity는 [-1, 1] 정규화 값이고 백엔드는 그대로 통과시킨다.
// 3단 속도(저속·보통·고속)는 config/ptz.json speedFactors 매핑 (mewly 이식).
// 기본 단계 1(0.5)은 종전 고정 속도와 동일하다.
const SPEED_FACTORS = ptz.speedFactors

const speedLevel = ref(1)
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
      error.value = failureMessage(data, '카메라 방향 제어에 실패했습니다.')
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

function setSpeedLevel(level) {
  if (level >= 0 && level < SPEED_FACTORS.length) speedLevel.value = level
}

function startMove(pan, tilt) {
  const factor = SPEED_FACTORS[speedLevel.value] ?? SPEED_FACTORS[1]
  const panSpeed = pan * factor
  const tiltSpeed = tilt * factor
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

// ── mewly 확장 (호출 UI는 2단계) ──

// 다중 프리셋: slot 단위 저장/이동. 저장된 목록은 SSE의 ptz_presets·
// ptz_preset_positions로 내려온다.
function savePreset(slot) {
  status.value = 'save'
  return postPtz({ action: 'save', slot })
}

function gotoPreset(slot) {
  status.value = 'goto'
  return postPtz({ action: 'goto', slot })
}

// 지정 좌표(ONVIF 정규화 공간 -1~1)로 절대 이동 (FR-016).
function moveAbsolute(pan, tilt) {
  status.value = 'absolute'
  return postPtz({ action: 'absolute', pan, tilt })
}

// 자동 순찰 설정 (FR-052). 결과 상태는 SSE의 ptz_patrol로 내려온다.
function setPatrol(enabled, intervalSec) {
  const body = { action: 'patrol', enabled }
  if (intervalSec != null) body.interval_s = intervalSec
  return postPtz(body)
}

export function usePtz() {
  return {
    status,
    loading,
    error,
    speedLevel,
    setSpeedLevel,
    startMove,
    stopMove,
    forceStop,
    saveHome,
    gotoHome,
    savePreset,
    gotoPreset,
    moveAbsolute,
    setPatrol,
  }
}

import { computed, effectScope, reactive, readonly, watch } from 'vue'
import deviceConfig from '../../config/device.json'
import { authFetch, failureDetail } from './useFetch'
import { useRealtimeEvents } from './useRealtimeEvents'
import { APP_ENDPOINTS } from '@/endpoints'

// 조명·냉난방은 babycat의 주변 장치 보드(/device)로 구동한다 (mewly useDevices
// 이식, 2026-09-23). 전원·모드·설정 온도·밝기·실내 온도·통신 가능 여부는 서버가
// 진실이고, 변경은 POST /device로 보낸 뒤 응답값(요청값의 반향이 아님)으로 갱신한다.
// 전원은 보드 전체의 것이라 조명과 냉난방이 공유한다 — 끄면 둘 다 꺼진다.
// 모드 이름은 API 경계에서만 변환한다 — 화면은 'heat', API는 "warm".
// 나이트 모드·냉난방 예약은 babycat 미지원이라 드로어의 로컬 상태로 남긴다.

const BRIGHTNESS_STEPS = deviceConfig.brightnessSteps
const TEMP_RANGE = deviceConfig.tempRange
// POST 응답 직후 도착하는 SSE 스냅숏은 요청 전에 수집된 값일 수 있으므로
// 이 시간 동안은 SSE의 장치 필드를 무시한다(수집 주기 2초 + 여유).
const SSE_HOLD_MS = deviceConfig.sseHoldMs

const TOAST_MESSAGES = {
  busy: '이전 요청을 처리하고 있어요. 잠시 후 다시 시도하세요.',
  refused: '기기가 요청을 거부했어요. 상태를 다시 불러옵니다.',
  timeout: '기기와 통신할 수 없어요. 응답이 올 때까지 조작이 잠깁니다.',
  powerUnknown: '전원 상태를 알 수 없어요. 전원을 먼저 켜세요.',
  brightnessUnreachable: '기기가 그 밝기를 지원하지 않아요. 실제 값을 표시합니다.',
  controllerDown: '기기 제어 서비스가 응답하지 않아요.',
  deviceNetwork: '서버에 연결할 수 없어요. 연결 상태를 확인하세요.',
  devPowerOff: '전원을 껐어요. 조명과 냉난방이 함께 꺼졌습니다.',
}

function showToast(kind) {
  const message = TOAST_MESSAGES[kind]
  if (!message || typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('wally:show-toast', { detail: { message, duration: 2500 } }))
}

function toApiMode(mode) {
  return mode === 'heat' ? 'warm' : mode
}
function fromApiMode(mode) {
  return mode === 'warm' ? 'heat' : mode
}

// 모드별 설정 온도 범위. 모드 미확인이면 냉방 범위를 자리 표시용으로 돌려준다.
export function tempRangeOf(mode) {
  return TEMP_RANGE[toApiMode(mode)] ?? TEMP_RANGE.cool
}

export function brightnessSteps() {
  return BRIGHTNESS_STEPS
}

// ── 보드 상태(서버가 진실) ──
const device = reactive({
  link: 'unknown',     // 'unknown' | 'up' | 'down'
  power: null,         // true | false | null(미확인)
  mode: null,          // 'cool' | 'heat' | null(전원 꺼짐·미확인)
  setTemp: null,       // 정수 ℃ | null
  brightness: null,    // 0~100 정수 | null
  roomTemp: null,      // 정수 ℃ | null(보드가 보낸 적 없음)
  busy: false,         // 제어 요청 진행 중 — 두 드로어가 같은 잠금을 본다
  // 서버가 /device 상태를 한 번이라도 알려 줬는가. true가 되면 드로어는 목업을
  // 버리고 서버 값만 쓴다(null 항목은 값 없음으로 표시). false면 /device 미배포·
  // 미응답이라 이식 전 목업으로 동작한다.
  connected: false,
})
let lastAppliedAt = 0

function applyBody(body) {
  device.connected = true
  device.link = body.link ?? device.link
  device.power = body.power ?? null
  device.mode = fromApiMode(body.mode ?? null)
  device.setTemp = body.set_temp ?? null
  device.brightness = body.brightness ?? null
  device.roomTemp = body.room_temp ?? null
}

function applySnapshot(state) {
  if ('device_link' in state) device.connected = true
  device.link = state.device_link ?? 'unknown'
  device.power = state.device_power ?? null
  device.mode = fromApiMode(state.device_mode ?? null)
  device.setTemp = state.device_set_temp ?? null
  device.brightness = state.device_brightness ?? null
  device.roomTemp = state.device_room_temp ?? null
}

// 409 detail(영문 문장)을 토스트 종류로 대응시킨다(uart-handoff §7).
function toastKindFor(status, detail) {
  if (status === 502) return 'controllerDown'
  if (status === 409) {
    const text = String(detail || '').toLowerCase()
    if (text.includes('did not respond') || text.startsWith('board not reachable')) return 'timeout'
    if (text.includes('power state is unknown')) return 'powerUnknown'
    if (text.startsWith('brightness') && text.includes('not reachable')) return 'brightnessUnreachable'
  }
  return 'refused'
}

let sseBound = false
function bindSse() {
  if (sseBound) return
  sseBound = true
  // 컴포넌트 밖의 분리 스코프 — 드로어가 닫혀도 SSE 반영이 이어진다.
  effectScope(true).run(() => {
    const { state, snapshotSeq } = useRealtimeEvents()
    watch(snapshotSeq, (seq) => {
      if (seq === 0) {
        // 로그아웃·재접속 — 이전 세션 값을 지우고 목업 상태로 돌아간다
        applySnapshot({})
        device.connected = false
        return
      }
      if (device.busy || Date.now() - lastAppliedAt < SSE_HOLD_MS) return
      if (state.monitor_sources?.controller === false) return
      // 스냅숏에 장치 필드가 아예 없으면(구버전 서버) 마지막 값을 유지한다.
      if (!('device_link' in state)) return
      applySnapshot(state)
    })
  })
}

async function refresh() {
  try {
    const res = await authFetch(APP_ENDPOINTS.device)
    if (!res.ok) return false
    applyBody(await res.json())
    lastAppliedAt = Date.now()
    return true
  } catch {
    return false
  }
}

// 목표 상태 적용. patch = { power?, mode?('cool'|'heat'), setTemp?, brightness? }.
// 전원 끄기는 { power: false } 단독이어야 하고(§6), 그 밖의 변경에는 power: true를
// 항상 함께 담아 재기동 직후(전원 미확인)에도 유효하게 한다.
async function apply(patch) {
  if (device.busy) {
    showToast('busy')
    return false
  }
  const body = {}
  if (patch.power === false) {
    body.power = false
  } else {
    body.power = true
    if (patch.mode != null) body.mode = toApiMode(patch.mode)
    if (patch.setTemp != null) body.set_temp = patch.setTemp
    if (patch.brightness != null) body.brightness = patch.brightness
  }

  device.busy = true
  try {
    const res = await authFetch(APP_ENDPOINTS.device, { method: 'POST', body })
    if (res.ok) {
      applyBody(await res.json())
      lastAppliedAt = Date.now()
      if (body.power === false) showToast('devPowerOff')
      return true
    }
    if (res.status === 401) return false
    // /device 미배포 서버(운영 205, 2026-09-21 기준) — 화면은 로컬 값으로 이전처럼
    // 동작하므로 매 조작마다 알리지 않는다.
    if (res.status === 404) return false
    const detail = await failureDetail(res, '')
    showToast(toastKindFor(res.status, detail))
    if (res.status === 409) await refresh()
    return false
  } catch {
    showToast('deviceNetwork')
    return false
  } finally {
    device.busy = false
  }
}

export function useDevices() {
  bindSse()
  const { state } = useRealtimeEvents()
  // controller 컨테이너 자체가 응답하지 않는 경우(502와 같은 뜻) — 보드 통신
  // 불가(link down)와 구분하여 알린다.
  const controllerDown = computed(() => state.monitor_sources?.controller === false)
  const linkDown = computed(() => device.link === 'down')
  // 조작 잠금 — 요청 진행 중이거나 보드·서비스와 통신할 수 없을 때
  const locked = computed(() => device.busy || linkDown.value || controllerDown.value)
  return {
    device: readonly(device),
    controllerDown,
    linkDown,
    locked,
    refresh,
    apply,
  }
}

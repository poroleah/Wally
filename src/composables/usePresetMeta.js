import { ref, watch } from 'vue'
import { API_ENDPOINTS, getEditableWallyHost } from '@/endpoints'
import { authFetch } from './useFetch'
import { useAuth } from './useAuth'

// PTZ 프리셋의 표시 메타(이름·이모지·숨김 슬롯) 공유 저장소.
// 좌표는 SSE ptz_preset_positions(서버)가 진실이고, 이 메타도 게이트웨이의
// 클라이언트 저장소(/client/storage)를 원본으로 두어 웹·앱 어느 기기에서
// 바꿔도 같은 목록이 보이게 한다. localStorage는 표시용 캐시다(useProfile 구조).
const SERVER_STORAGE_KEY = 'ptz_preset_meta'
const SERVER_SAVE_DEBOUNCE_MS = 1000

// 서버 공유 이전의 기기별 저장 키 — 읽기 마이그레이션 폴백으로만 쓴다.
const LEGACY_NAMES_KEY = 'wally:ptzPresetNames'
const LEGACY_EMOJIS_KEY = 'wally:ptzPresetEmojis'
const LEGACY_HIDDEN_KEY = 'wally:ptzPresetHidden'

function hasWindow() {
  return typeof window !== 'undefined'
}

function cacheKey() {
  return `wally:ptzPresetMeta.${getEditableWallyHost() || 'default'}`
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function loadStoredMeta() {
  if (!hasWindow()) return {}
  const cached = readJson(cacheKey(), null)
  if (cached && typeof cached === 'object') return cached
  // 구버전 기기별 키에서 1회 이관.
  return {
    names: readJson(LEGACY_NAMES_KEY, {}),
    emojis: readJson(LEGACY_EMOJIS_KEY, {}),
    hiddenSlots: readJson(LEGACY_HIDDEN_KEY, []),
  }
}

const storedMeta = loadStoredMeta()
const presetNames = ref(storedMeta.names && typeof storedMeta.names === 'object' ? storedMeta.names : {})
const presetEmojis = ref(storedMeta.emojis && typeof storedMeta.emojis === 'object' ? storedMeta.emojis : {})
const hiddenSlots = ref(Array.isArray(storedMeta.hiddenSlots) ? storedMeta.hiddenSlots : [])

function snapshot() {
  return {
    names: presetNames.value,
    emojis: presetEmojis.value,
    hiddenSlots: hiddenSlots.value,
  }
}

function writeCache() {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(cacheKey(), JSON.stringify(snapshot()))
  } catch {
    // 캐시 실패(용량 등)는 무시 — 메모리 상태로 계속 동작.
  }
}

function applyMeta(meta = {}) {
  if (meta.names && typeof meta.names === 'object') presetNames.value = meta.names
  if (meta.emojis && typeof meta.emojis === 'object') presetEmojis.value = meta.emojis
  if (Array.isArray(meta.hiddenSlots)) hiddenSlots.value = meta.hiddenSlots
}

// ── 서버 동기화 (useProfile과 동일한 에코 차단·디바운스 구조) ──
let lastServerJson = null
let saveTimer = null

async function pushMetaToServer() {
  const { accessToken } = useAuth()
  if (!accessToken.value) return
  const body = snapshot()
  const json = JSON.stringify(body)
  if (json === lastServerJson) return
  try {
    const res = await authFetch(API_ENDPOINTS.clientStorage(SERVER_STORAGE_KEY), {
      method: 'PUT',
      body,
    })
    if (res.ok) lastServerJson = json
    // 실패 시 캐시는 이미 갱신됨 — 다음 변경 때 재시도된다.
  } catch {
    // 네트워크 실패도 동일: 캐시 표시 유지, 다음 변경에서 재시도.
  }
}

function scheduleServerSave() {
  if (!hasWindow()) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    void pushMetaToServer()
  }, SERVER_SAVE_DEBOUNCE_MS)
}

async function loadPresetMeta() {
  applyMeta(loadStoredMeta())
  const res = await authFetch(API_ENDPOINTS.clientStorage(SERVER_STORAGE_KEY))
  if (!res.ok) throw new Error(`preset meta load failed: ${res.status}`)
  const data = await res.json().catch(() => null)
  if (data && typeof data === 'object' && (data.names || data.emojis || data.hiddenSlots)) {
    applyMeta(data)
    lastServerJson = JSON.stringify(snapshot())
  }
}

watch([presetNames, presetEmojis, hiddenSlots], () => {
  writeCache()
  scheduleServerSave()
}, { deep: true })

let syncStarted = false
function startMetaSync() {
  if (syncStarted || !hasWindow()) return
  syncStarted = true
  const { accessToken } = useAuth()
  // 서버가 원본 — 조회 실패 시 localStorage 캐시 표시로 대신한다.
  watch(accessToken, (token) => {
    if (token) loadPresetMeta().catch(() => {})
  }, { immediate: true })
}

export function usePresetMeta() {
  startMetaSync()
  return { presetNames, presetEmojis, hiddenSlots, loadPresetMeta }
}

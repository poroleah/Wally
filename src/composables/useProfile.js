import { ref, watch } from 'vue'
import { API_ENDPOINTS, getEditableWallyHost } from '@/endpoints'
import { authFetch } from './useFetch'
import { useAuth } from './useAuth'

// 원본은 접속 중인 게이트웨이의 클라이언트 저장소(/client/storage)이고,
// localStorage는 표시용 캐시다(mewly 구조) — 조회 실패(오프라인 등) 시
// 마지막으로 본 값을 보여 준다. 하우스마다 반려견이 다르므로 캐시 키는
// 접속 호스트 단위로 나눈다.
const SERVER_STORAGE_KEY = 'pet_profile'
const LEGACY_STORAGE_KEY = 'wally:profile'
const DEFAULT_PROFILE_IMG = '/icons/Setting/Profile_Img.svg'
const SERVER_SAVE_DEBOUNCE_MS = 1000

function hasWindow() {
  return typeof window !== 'undefined'
}

function cacheKey() {
  return `wally:profile.${getEditableWallyHost() || 'default'}`
}

function loadStoredProfile() {
  if (!hasWindow()) return {}
  // 구버전 단일 키는 읽기 폴백으로만 유지한다 (첫 저장부터 호스트 키 사용).
  for (const key of [cacheKey(), LEGACY_STORAGE_KEY]) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(key) || 'null')
      if (stored && typeof stored === 'object') return stored
    } catch {
      // 손상된 캐시는 무시하고 다음 후보로.
    }
  }
  return {}
}

const storedProfile = loadStoredProfile()
const name = ref(storedProfile.name || '')
const profileImg = ref(storedProfile.profileImg || DEFAULT_PROFILE_IMG)
const breed = ref(storedProfile.breed || '')
const birthday = ref(storedProfile.birthday || null)
const searchHistory = ref(Array.isArray(storedProfile.searchHistory) ? storedProfile.searchHistory : [])

function snapshot() {
  return {
    name: name.value,
    profileImg: profileImg.value || DEFAULT_PROFILE_IMG,
    breed: breed.value,
    birthday: birthday.value,
    searchHistory: searchHistory.value,
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

function applyProfile(profile = {}) {
  if (profile.name !== undefined) name.value = profile.name || ''
  if (profile.profileImg !== undefined) profileImg.value = profile.profileImg || DEFAULT_PROFILE_IMG
  if (profile.breed !== undefined) breed.value = profile.breed || ''
  if (profile.birthday !== undefined) birthday.value = profile.birthday || null
  if (Array.isArray(profile.searchHistory)) searchHistory.value = profile.searchHistory
}

// ── 서버 동기화 ──
// 마지막으로 서버와 일치한 직렬화 값. 원격 값을 반영한 직후의 watch 발화가
// 그대로 서버로 되돌아가는 에코를 값 비교로 차단한다.
let lastServerJson = null
let saveTimer = null

async function pushProfileToServer() {
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
    void pushProfileToServer()
  }, SERVER_SAVE_DEBOUNCE_MS)
}

// 로그인 후 1회 호출해 접속 호스트의 서버 값을 캐시에 반영한다.
async function loadProfile() {
  // 호스트가 바뀌었을 수 있으므로 먼저 그 호스트의 캐시로 표시를 맞춘다.
  applyProfile(loadStoredProfile())
  const res = await authFetch(API_ENDPOINTS.clientStorage(SERVER_STORAGE_KEY))
  if (!res.ok) throw new Error(`profile load failed: ${res.status}`)
  const data = await res.json().catch(() => null)
  if (data && typeof data === 'object') {
    applyProfile(data)
    lastServerJson = JSON.stringify(snapshot())
  }
}

watch([name, profileImg, breed, birthday, searchHistory], () => {
  writeCache()
  scheduleServerSave()
}, { deep: true })

let syncStarted = false
function startProfileSync() {
  if (syncStarted || !hasWindow()) return
  syncStarted = true
  const { accessToken } = useAuth()
  // 서버가 원본 — 조회 실패 시 localStorage 캐시 표시로 대신한다.
  watch(accessToken, (token) => {
    if (token) loadProfile().catch(() => {})
  }, { immediate: true })
}

export function useProfile() {
  startProfileSync()
  return { name, profileImg, breed, birthday, searchHistory, applyProfile, loadProfile }
}

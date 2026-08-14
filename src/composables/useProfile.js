import { ref, watch } from 'vue'

const PROFILE_STORAGE_KEY = 'wally:profile'
const DEFAULT_PROFILE_IMG = '/icons/Setting/Profile_Img.svg'

function hasWindow() {
  return typeof window !== 'undefined'
}

function loadStoredProfile() {
  if (!hasWindow()) return {}

  try {
    const stored = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '{}')
    return stored && typeof stored === 'object' ? stored : {}
  } catch {
    return {}
  }
}

const storedProfile = loadStoredProfile()
const name = ref(storedProfile.name || '')
const profileImg = ref(storedProfile.profileImg || DEFAULT_PROFILE_IMG)
const breed = ref(storedProfile.breed || '')
const birthday = ref(storedProfile.birthday || null)
const searchHistory = ref(Array.isArray(storedProfile.searchHistory) ? storedProfile.searchHistory : [])

function saveProfile() {
  if (!hasWindow()) return
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
    name: name.value,
    profileImg: profileImg.value || DEFAULT_PROFILE_IMG,
    breed: breed.value,
    birthday: birthday.value,
    searchHistory: searchHistory.value,
  }))
}

function applyProfile(profile = {}) {
  if (profile.name !== undefined) name.value = profile.name || ''
  if (profile.profileImg !== undefined) profileImg.value = profile.profileImg || DEFAULT_PROFILE_IMG
  if (profile.breed !== undefined) breed.value = profile.breed || ''
  if (profile.birthday !== undefined) birthday.value = profile.birthday || null
}

watch([name, profileImg, breed, birthday, searchHistory], saveProfile, { deep: true })

export function useProfile() {
  return { name, profileImg, breed, birthday, searchHistory, applyProfile }
}

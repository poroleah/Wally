import { computed, reactive, watch } from 'vue'

const ALARM_SETTINGS_STORAGE_KEY = 'wally:alarmSettings'

const DEFAULT_ALARM_SETTINGS = {
  abnormal: true,
  motion: true,
  camError: true,
  schedule: true,
  chatbot: false,
  appInfo: false,
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function loadStoredSettings() {
  if (!hasWindow()) return {}

  try {
    const stored = JSON.parse(window.localStorage.getItem(ALARM_SETTINGS_STORAGE_KEY) || '{}')
    return stored && typeof stored === 'object' ? stored : {}
  } catch {
    return {}
  }
}

const settings = reactive({
  ...DEFAULT_ALARM_SETTINGS,
  ...loadStoredSettings(),
})

function saveSettings() {
  if (!hasWindow()) return
  window.localStorage.setItem(ALARM_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

function setAlarmSetting(key, value) {
  if (!(key in DEFAULT_ALARM_SETTINGS)) return
  settings[key] = Boolean(value)
}

function toggleAlarmSetting(key) {
  if (!(key in DEFAULT_ALARM_SETTINGS)) return
  settings[key] = !settings[key]
}

watch(settings, saveSettings, { deep: true })

export function useAlarmSettings() {
  const enabledSettings = computed(() => ({ ...settings }))

  return {
    settings,
    enabledSettings,
    setAlarmSetting,
    toggleAlarmSetting,
  }
}

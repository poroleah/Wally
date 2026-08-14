import { computed, reactive, readonly, ref } from 'vue'

const DEFAULT_STATUS = {
  cameraCount: 101,
  summary: '',
  temperature: '',
  lightOn: false,
  lastUpdatedAt: '',
}

const loading = ref(false)
const error = ref('')
const status = reactive({ ...DEFAULT_STATUS })
const recentAlerts = ref([])
const loaded = ref(false)

async function loadHomeData({ force = false } = {}) {
  if (loaded.value && !force) return

  error.value = ''
  loaded.value = true
}

export function useHomeData() {
  const hasError = computed(() => !!error.value)

  return {
    loading: readonly(loading),
    error: readonly(error),
    hasError,
    status: readonly(status),
    recentAlerts: readonly(recentAlerts),
    loadHomeData,
  }
}

import { computed, readonly, ref, watch } from 'vue'
import { SERVER_REQUEST_TIMEOUT_MS } from '@/constants/network'
import { APP_ENDPOINTS } from '@/endpoints'
import { authFetch, failureMessage } from './useFetch'
import { useRealtimeEvents } from './useRealtimeEvents'
import { markPromptApplied } from './analysisConfig'
import { toIsoDate } from '@/utils/date'

const DEFAULT_PROMPT = 'What is the dog doing? Answer in one sentence.'

const prompt = ref(DEFAULT_PROMPT)
const triggers = ref('')
const saving = ref(false)
const status = ref('')
const success = ref(false)
let syncedFromRealtime = false

export class PromptSettingsError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'PromptSettingsError'
    this.cause = cause
  }
}

function normalizePromptText(value) {
  return String(value || '').replace(/\bperson\b/gi, 'dog')
}

function syncRealtimeValues(force = false) {
  const { state } = useRealtimeEvents()
  if (!force && syncedFromRealtime) return

  const nextPrompt = normalizePromptText(state.inference_prompt || DEFAULT_PROMPT)
  const nextTriggers = state.trigger_keywords || ''
  if (!force && !nextPrompt && !nextTriggers) return

  prompt.value = nextPrompt
  triggers.value = nextTriggers
  syncedFromRealtime = true
}

function startRealtimeSync() {
  const { state } = useRealtimeEvents()
  watch(
    () => [state.inference_prompt, state.trigger_keywords],
    () => syncRealtimeValues(false),
    { immediate: true },
  )
}

let syncStarted = false
function ensureSyncStarted() {
  if (syncStarted) return
  syncStarted = true
  startRealtimeSync()
}

export async function saveVlmPromptConfig({ question, keywords }) {
  const controller = new AbortController()
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new PromptSettingsError('서버에 연결할 수 없습니다.'))
    }, SERVER_REQUEST_TIMEOUT_MS)
  })

  let res
  try {
    res = await Promise.race([
      authFetch(APP_ENDPOINTS.prompt, {
        method: 'POST',
        body: {
          prompt: String(question || '').trim(),
          triggers: String(keywords || '').trim(),
        },
        signal: controller.signal,
      }),
      timeoutPromise,
    ])
  } catch (error) {
    if (error instanceof PromptSettingsError) throw error
    throw new PromptSettingsError('서버에 연결할 수 없습니다.', error)
  } finally {
    clearTimeout(timeoutId)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok || data?.ok === false) {
    throw new PromptSettingsError(failureMessage(data, '프롬프트 설정을 저장하지 못했습니다.'))
  }
  return data
}

async function savePromptSettings({ prompt: promptText, triggers: triggerText }) {
  const nextPrompt = normalizePromptText(promptText).trim()
  const nextTriggers = String(triggerText || '').trim()

  if (!nextPrompt) {
    throw new PromptSettingsError('감지 기준을 입력해주세요.')
  }

  saving.value = true
  status.value = ''
  success.value = false

  try {
    await saveVlmPromptConfig({
      question: nextPrompt,
      keywords: nextTriggers,
    })

    prompt.value = nextPrompt
    triggers.value = nextTriggers
    syncedFromRealtime = true
    // 프롬프트 변경은 라벨 분포를 바꾸므로 기준선 단절을 기록한다
    // (동일 문안 재저장은 analysisConfig가 서명 비교로 걸러낸다).
    markPromptApplied(nextPrompt, toIsoDate())
    success.value = true
    status.value = 'AI 감지 설정이 저장되었습니다.'
    return true
  } catch (e) {
    const message = e instanceof PromptSettingsError ? e.message : '서버에 연결할 수 없습니다.'
    status.value = message
    success.value = false
    throw e instanceof PromptSettingsError ? e : new PromptSettingsError(message, e)
  } finally {
    saving.value = false
  }
}

function clearStatus() {
  status.value = ''
  success.value = false
}

export function usePromptSettings() {
  ensureSyncStarted()

  return {
    prompt,
    triggers,
    saving: readonly(saving),
    status: readonly(status),
    success: readonly(success),
    canSave: computed(() => !!prompt.value.trim() && !saving.value),
    syncRealtimeValues,
    savePromptSettings,
    clearStatus,
  }
}

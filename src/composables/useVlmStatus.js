import { computed, ref } from 'vue'
import { useRealtimeEvents } from './useRealtimeEvents'
import { useAnalysis } from './useAnalysis'
import { authFetch } from './useFetch'
import { APP_ENDPOINTS } from '@/endpoints'

// VLM 상태 분류·모델 전환의 데이터 계층 (mewly 이식, 표시 UI는 2단계).
// 분류: wait(준비·전환 계열) · idle(대기) · on(구동) · err(오류).
const VLM_KINDS = {
  initializing: 'wait',
  downloading: 'wait',
  compiling: 'wait',
  loading: 'wait',
  switching: 'wait',
  ready: 'idle',
  running: 'on',
  error: 'err',
}

const VLM_LABELS = {
  initializing: '초기화 중',
  downloading: '모델 내려받는 중',
  compiling: '컴파일 중',
  loading: '모델 불러오는 중',
  switching: '모델 전환 중',
  ready: '대기',
  running: '분석 중',
  error: '오류',
}

// 요청~SSE '전환 중' 반영 사이 공백을 busy로 메운다.
const modelSwitching = ref(false)

// 모델 id의 마지막 경로 조각만 표기한다
// (예: Efficient-Large-Model/VILA1.5-3b → VILA1.5-3b).
export function shortVlmModelName(id) {
  if (!id) return ''
  const parts = String(id).split('/')
  return parts[parts.length - 1]
}

export function useVlmStatus() {
  const { state } = useRealtimeEvents()
  const { analysisActive } = useAnalysis()

  const vlmKind = computed(() => {
    // VLM이 대기 상태이고 분석이 도는 동안은 「구동 중」으로 분류한다.
    if (state.vlm_state === 'ready' && analysisActive.value) return 'on'
    return VLM_KINDS[state.vlm_state] || 'idle'
  })
  const vlmLabel = computed(() => {
    if (vlmKind.value === 'on') return VLM_LABELS.running
    return VLM_LABELS[state.vlm_state] || state.vlm_state || ''
  })
  const currentModel = computed(() => state.vlm_current_model || '')
  const currentModelLabel = computed(() => shortVlmModelName(currentModel.value))
  const availableModels = computed(() => (Array.isArray(state.vlm_models) ? state.vlm_models : []))

  // POST /vlm/switch — 진행 상태는 SSE vlm_state('switching')로 내려온다.
  async function switchModel(name) {
    if (!name || name === state.vlm_current_model) return
    modelSwitching.value = true
    try {
      await authFetch(APP_ENDPOINTS.vlmSwitch, {
        method: 'POST',
        body: { model: name },
      })
    } catch {
      // 실패해도 vlm_state가 그대로라 화면이 스스로 복원된다.
    } finally {
      modelSwitching.value = false
    }
  }

  return {
    vlmKind,
    vlmLabel,
    currentModel,
    currentModelLabel,
    availableModels,
    modelSwitching,
    switchModel,
  }
}

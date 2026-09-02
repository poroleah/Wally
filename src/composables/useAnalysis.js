import { computed, ref } from 'vue'
import { useRealtimeEvents } from './useRealtimeEvents'
import { authFetch, failureDetail } from './useFetch'
import { APP_ENDPOINTS } from '@/endpoints'

// 분석 수동 시작/정지 (mewly 이식, 토글 UI는 2단계).
// FR-024/FR-025: 프롬프트 저장은 분석을 시작하지 않으며, 명시적 시작이
// analyzer와 recorder로 팬아웃된다.
const busy = ref(false)
// 시작 실패 사유. 스트리밍 비활성(로컬 판정·FR-050 409)은 'no_stream',
// 네트워크 실패는 'network', 그 외는 백엔드 detail 원문. 표시 문구는
// startErrorMessage()가 결정한다 — 실패가 무반응으로 보이지 않게 한다.
const startError = ref('')

export function useAnalysis() {
  const { state } = useRealtimeEvents()

  // idle은 명시적 시작을 기다리는 상태(FR-024) — 스트리밍 중인 파이프라인이
  // idle이 아니면 분석 진행 중이다.
  const analysisActive = computed(() => state.streaming_active && state.pipeline_state !== 'idle')

  async function start() {
    startError.value = ''
    try {
      const res = await authFetch(APP_ENDPOINTS.analysisStart, { method: 'POST' })
      if (res.ok) return true
      if (res.status === 409) startError.value = 'no_stream'
      else startError.value = await failureDetail(res, `HTTP ${res.status}`)
      return false
    } catch {
      startError.value = 'network'
      return false
    }
  }

  // FR-051: 스트리밍은 유지한 채 분석·버퍼링만 정지한다.
  async function stop() {
    try {
      const res = await authFetch(APP_ENDPOINTS.analysisStop, { method: 'POST' })
      const data = await res.json()
      return res.ok && data.ok
    } catch {
      return false
    }
  }

  // 실패 시 false를 반환하며 사유는 startError에 있다.
  // 스트리밍 비활성은 요청 없이 로컬에서 판정한다.
  async function toggle() {
    if (busy.value) return true
    if (!analysisActive.value && !state.streaming_active) {
      startError.value = 'no_stream'
      return false
    }
    busy.value = true
    try {
      if (analysisActive.value) {
        await stop()
        return true
      }
      return await start()
    } finally {
      busy.value = false
    }
  }

  // 시작 실패 사유를 표시 문구로 대응시킨다. 게이트웨이의 detail은 정해진
  // 몇 가지 값이며, 두 컴포넌트가 함께 실패하면 "analyzer, recorder"로 온다.
  // 알 수 없는 사유는 원문을 그대로 보인다.
  function startErrorMessage() {
    const detail = startError.value
    if (!detail) return null
    if (detail === 'no_stream') return '스트리밍이 꺼져 있어 분석을 시작할 수 없습니다.'
    if (detail === 'network') return '서버에 연결할 수 없습니다.'
    if (detail === 'cannot verify streaming state') return '스트리밍 상태를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.'
    const m = detail.match(/^start not accepted by:\s*(.+)$/)
    if (m) {
      const names = m[1].split(',').map((n) => n.trim())
      const known = names.filter((n) => n === 'analyzer' || n === 'recorder')
      if (known.length === names.length) {
        const target = known.length > 1 ? '분석기와 저장기가' : known[0] === 'analyzer' ? '분석기가' : '저장기가'
        return `${target} 시작을 받아들이지 않았습니다. 잠시 후 다시 시도해주세요.`
      }
    }
    return `분석 시작에 실패했습니다: ${detail}`
  }

  return { analysisActive, busy, startError, startErrorMessage, toggle, start, stop }
}

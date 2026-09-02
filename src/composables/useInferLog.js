import { effectScope, reactive, readonly, watch } from 'vue'
import { useRealtimeEvents } from './useRealtimeEvents'
import { toIsoDate } from '@/utils/date'

// VLM 관찰 문장 로그 (mewly 이식, 표시 UI는 2단계). 백엔드는 키워드 이벤트
// (/events: trigger + clip)만 저장하므로, 서술 로그는 SSE infer_raw 스트림을
// 클라이언트에서 최신순으로 누적한다(표시 상한 있음). 항목 삭제는 이
// 메모리 목록에서만 지워진다 — 서버 측 대응물이 없다.
const MAX_LOG = 20

const entries = reactive([])
let started = false
let nextId = 1

export function useInferLog() {
  if (!started) {
    started = true
    // 분리 스코프: 컴포넌트 안에서 등록하면 그 컴포넌트 unmount와 함께
    // watcher가 죽는데 started 플래그는 남아 누적이 조용히 끊긴다.
    effectScope(true).run(() => {
      const { state } = useRealtimeEvents()
      watch(() => state.infer_raw, (text) => {
        if (!text) return
        if (entries.length && entries[0].text === text) return
        const now = new Date()
        entries.unshift({
          id: nextId++,
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          day: toIsoDate(now),
          text,
          event: state.event_triggered,
        })
        if (entries.length > MAX_LOG) entries.length = MAX_LOG
      })
    })
  }

  function removeEntries(ids) {
    const drop = new Set(ids)
    for (let i = entries.length - 1; i >= 0; i--) {
      if (drop.has(entries[i].id)) entries.splice(i, 1)
    }
  }

  return { entries: readonly(entries), removeEntries }
}

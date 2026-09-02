import { ref, watch } from 'vue'

// localStorage에 지속되는 ref 공용 헬퍼 (mewly storage.js 이식).
// 손상된 저장값은 기본값으로, 저장 실패(용량 등)는 무시하고 메모리로 동작.
export function persistentRef(key, defaultValue) {
  const storageKey = `wally.${key}`
  let initial = defaultValue
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw !== null) initial = JSON.parse(raw)
  } catch {
    // 손상된 저장값은 기본값으로 대체.
  }

  const value = ref(initial)
  watch(value, (next) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // 저장 실패(용량 등)는 무시 — 메모리 상태로 계속 동작.
    }
  }, { deep: true })
  return value
}

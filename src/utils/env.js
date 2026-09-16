/** 브라우저 window 객체가 있는 환경인지 (SSR·테스트 등 비브라우저 환경 가드) */
export function hasWindow() {
  return typeof window !== 'undefined'
}

/** ms 만큼 대기하는 Promise */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

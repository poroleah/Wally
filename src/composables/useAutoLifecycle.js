import { effectScope, watch } from 'vue'
import { APP_ENDPOINTS } from '@/endpoints'
import { authFetch } from './useFetch'
import { useCamera } from './useCamera'
import { useRealtimeEvents } from './useRealtimeEvents'

// The old architecture kept streaming and analysis always on, and Wally's
// screens are designed on that assumption. The current backend exposes an
// explicit lifecycle instead (/streaming/start, /analysis/start), so this
// composable restores the implicit behavior: whenever the live state
// reports a stage off, it is switched back on. The start endpoints double
// as restarts, so they must fire only while the state says inactive.
const ATTEMPT_COOLDOWN_MS = 15000

let started = false
let lastStreamingAttempt = 0
let lastAnalysisAttempt = 0

async function post(url) {
  try {
    await authFetch(url, { method: 'POST' })
  } catch {
    // Retried on a later state report once the cooldown passes.
  }
}

function evaluate(payload, configured) {
  // Starting the stream needs a registered profile; without one the call
  // can only fail, so stay quiet until registration happens.
  if (!configured) return

  const now = Date.now()

  if (payload.streaming_active === false) {
    if (now - lastStreamingAttempt >= ATTEMPT_COOLDOWN_MS) {
      lastStreamingAttempt = now
      void post(APP_ENDPOINTS.streamingStart)
    }
    return
  }

  // Analysis needs the stream up and the VLM loaded; idle means the
  // pipeline is waiting for an explicit start.
  if (
    payload.streaming_active === true &&
    payload.pipeline_state === 'idle' &&
    payload.vlm_state === 'ready' &&
    now - lastAnalysisAttempt >= ATTEMPT_COOLDOWN_MS
  ) {
    lastAnalysisAttempt = now
    void post(APP_ENDPOINTS.analysisStart)
  }
}

export function useAutoLifecycle() {
  if (started) return
  started = true

  // Detached scope: the watcher must outlive the component that first
  // invoked the composable.
  const scope = effectScope(true)
  scope.run(() => {
    const { lastPayload } = useRealtimeEvents()
    const { cameraStatus } = useCamera()
    watch(lastPayload, (payload) => {
      if (payload) evaluate(payload, cameraStatus.configured)
    })
  })
}

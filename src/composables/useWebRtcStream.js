import { readonly, ref } from 'vue'
import { useAuth } from './useAuth'
import { probeSession } from './useFetch'
import network from '../../config/network.json'

const DEFAULT_CONNECT_TIMEOUT = network.stream.connectTimeoutMs
const DEFAULT_RETRY_DELAY = network.stream.retryBackoffMs

export function useWebRtcStream({
  getUrl,
  connectTimeout = DEFAULT_CONNECT_TIMEOUT,
  retryDelay = DEFAULT_RETRY_DELAY,
  onTerminalFailure,
} = {}) {
  const mediaStream = ref(null)
  const connectionState = ref('idle')
  const error = ref(null)

  let peerConnection = null
  let abortController = null
  let retryTimer = null
  let sessionId = 0
  let shouldReconnect = false
  let reconnecting = false

  function clearRetryTimer() {
    if (!retryTimer) return
    window.clearTimeout(retryTimer)
    retryTimer = null
  }

  function releasePeerConnection() {
    abortController?.abort()
    abortController = null

    if (peerConnection) {
      peerConnection.ontrack = null
      peerConnection.onconnectionstatechange = null
      peerConnection.close()
      peerConnection = null
    }

    mediaStream.value = null
  }

  function waitForIceGathering(pc, activeSession, deadline) {
    return new Promise((resolve, reject) => {
      if (pc.iceGatheringState === 'complete') {
        resolve()
        return
      }

      const remaining = Math.max(0, deadline - Date.now())
      const timeoutId = window.setTimeout(() => finish(new Error('WebRTC ICE gathering timed out.')), remaining)

      function finish(failure) {
        window.clearTimeout(timeoutId)
        pc.removeEventListener('icegatheringstatechange', handleStateChange)
        if (failure) reject(failure)
        else resolve()
      }

      function handleStateChange() {
        if (activeSession !== sessionId) {
          finish(new Error('WebRTC connection was cancelled.'))
        } else if (pc.iceGatheringState === 'complete') {
          finish()
        }
      }

      pc.addEventListener('icegatheringstatechange', handleStateChange)
    })
  }

  function waitForRemoteStream(pc, activeSession, deadline) {
    return new Promise((resolve, reject) => {
      const remaining = Math.max(0, deadline - Date.now())
      const timeoutId = window.setTimeout(() => finish(new Error('WebRTC media stream timed out.')), remaining)

      function finish(failure, stream) {
        window.clearTimeout(timeoutId)
        if (failure) reject(failure)
        else resolve(stream)
      }

      pc.ontrack = (event) => {
        if (activeSession !== sessionId) return
        const stream = event.streams?.[0]
        if (!stream) return
        mediaStream.value = stream
        finish(null, stream)
      }
    })
  }

  async function connectAttempt(activeSession, deadline) {
    releasePeerConnection()
    if (activeSession !== sessionId || !shouldReconnect) throw new Error('WebRTC connection was cancelled.')

    // 기본 []: LAN 직결 전제라 STUN이 불필요하다. 원격 접근을 도입하면
    // config/network.json stream.webrtc.iceServers에 서버를 추가한다.
    const pc = new RTCPeerConnection({ iceServers: network.stream.webrtc.iceServers })
    peerConnection = pc
    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })

    const streamPromise = waitForRemoteStream(pc, activeSession, deadline)
    // A signaling failure can happen before this promise is awaited.
    // Attach a handler immediately so its deadline rejection is never unhandled.
    streamPromise.catch(() => {})
    pc.onconnectionstatechange = () => {
      if (activeSession !== sessionId || peerConnection !== pc) return
      if (pc.connectionState === 'connected') connectionState.value = 'connected'
      if ((pc.connectionState === 'failed' || pc.connectionState === 'disconnected') && shouldReconnect) {
        void recoverConnection(activeSession)
      }
    }

    const offer = await pc.createOffer()
    if (activeSession !== sessionId) throw new Error('WebRTC connection was cancelled.')
    await pc.setLocalDescription(offer)
    await waitForIceGathering(pc, activeSession, deadline)

    abortController = new AbortController()
    const requestController = abortController
    const requestTimeout = window.setTimeout(
      () => requestController.abort(new Error('WHEP request timed out.')),
      Math.max(0, deadline - Date.now()),
    )
    let response
    try {
      // WHEP signaling passes the gateway relay and needs the token; the
      // WebRTC media itself then flows directly from the streamer.
      const { getToken } = useAuth()
      const token = getToken()
      response = await fetch(getUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: pc.localDescription.sdp,
        signal: requestController.signal,
      })
    } finally {
      window.clearTimeout(requestTimeout)
      if (abortController === requestController) abortController = null
    }

    if (response.status === 401) {
      // Dead token on the relay: refresh it (or classify the revoked
      // session) so the reconnect attempt signs with a live token.
      probeSession()
    }
    if (!response.ok) throw new Error(`WHEP ${response.status}`)
    const answerSdp = await response.text()
    if (activeSession !== sessionId) throw new Error('WebRTC connection was cancelled.')
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }))
    return streamPromise
  }

  function waitForRetry(activeSession, deadline) {
    return new Promise((resolve, reject) => {
      const delay = Math.min(retryDelay, Math.max(0, deadline - Date.now()))
      retryTimer = window.setTimeout(() => {
        retryTimer = null
        if (activeSession !== sessionId || !shouldReconnect) reject(new Error('WebRTC connection was cancelled.'))
        else resolve()
      }, delay)
    })
  }

  async function runConnectionLoop(activeSession) {
    const deadline = Date.now() + connectTimeout
    connectionState.value = 'connecting'
    error.value = null

    while (activeSession === sessionId && shouldReconnect && Date.now() < deadline) {
      try {
        const stream = await connectAttempt(activeSession, deadline)
        if (activeSession !== sessionId) return null
        connectionState.value = 'connected'
        return stream
      } catch (failure) {
        if (activeSession !== sessionId || !shouldReconnect) return null
        error.value = failure
        releasePeerConnection()
        if (Date.now() >= deadline) break
        await waitForRetry(activeSession, deadline).catch(() => {})
      }
    }

    if (activeSession !== sessionId || !shouldReconnect) return null
    shouldReconnect = false
    releasePeerConnection()
    connectionState.value = 'failed'
    error.value ||= new Error('WebRTC connection timed out.')
    onTerminalFailure?.(error.value)
    return null
  }

  async function recoverConnection(activeSession) {
    if (reconnecting || activeSession !== sessionId || !shouldReconnect) return
    reconnecting = true
    releasePeerConnection()
    const nextSession = ++sessionId
    try {
      await runConnectionLoop(nextSession)
    } finally {
      reconnecting = false
    }
  }

  async function connect() {
    disconnect()
    shouldReconnect = true
    const activeSession = ++sessionId
    return runConnectionLoop(activeSession)
  }

  function disconnect() {
    shouldReconnect = false
    reconnecting = false
    sessionId += 1
    clearRetryTimer()
    releasePeerConnection()
    connectionState.value = 'idle'
    error.value = null
  }

  return {
    mediaStream: readonly(mediaStream),
    connectionState: readonly(connectionState),
    error: readonly(error),
    connect,
    disconnect,
  }
}

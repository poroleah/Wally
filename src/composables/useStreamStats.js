import { reactive, onBeforeUnmount } from 'vue'
import network from '../../config/network.json'

// 재생 중 스트림 통계 수집 (mewly 이식, 표시 UI는 2단계).
// WebRTC는 RTCPeerConnection.getStats()에서 fps·비트레이트·코덱·RTT·손실을,
// HLS는 hls.js 인스턴스의 레벨 속성·대역폭 추정치를 읽는다.
// 컴포넌트 안에서 호출해야 한다 (onBeforeUnmount로 타이머 정리).
function emptyStats() {
  return {
    resolution: '',
    fps: '',
    bitrate: '',
    codec: '',
    rtt: '',
    packetLoss: '',
  }
}

export function useStreamStats({ videoRef, isWebRTC, getPeerConnection, getHlsInstance }) {
  const stats = reactive(emptyStats())
  let statsTimer = null
  let prevBytes = 0
  let prevTime = 0

  function stopStats() {
    if (statsTimer) {
      clearInterval(statsTimer)
      statsTimer = null
    }
    Object.assign(stats, emptyStats())
  }

  function startStats() {
    stopStats()
    prevBytes = 0
    prevTime = performance.now()
    statsTimer = setInterval(collectStats, network.stream.statsIntervalMs)
  }

  async function collectStats() {
    const video = videoRef.value
    if (!video) return
    if (video.videoWidth && video.videoHeight) {
      stats.resolution = `${video.videoWidth}×${video.videoHeight}`
    }
    if (isWebRTC.value) {
      await collectWebRTCStats()
      return
    }
    collectHlsStats()
  }

  async function collectWebRTCStats() {
    const pc = getPeerConnection()
    if (!pc) return
    try {
      const reports = await pc.getStats()
      const codecs = {}
      reports.forEach((report) => {
        if (report.type === 'codec') codecs[report.id] = report
      })
      reports.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (report.framesPerSecond != null) {
            stats.fps = `${Math.round(report.framesPerSecond)}`
          }
          const now = performance.now()
          const bytes = report.bytesReceived || 0
          if (prevBytes > 0 && now > prevTime) {
            const bps = ((bytes - prevBytes) * 8) / ((now - prevTime) / 1000)
            stats.bitrate = bps >= 1_000_000
              ? `${(bps / 1_000_000).toFixed(1)} Mbps`
              : `${Math.round(bps / 1000)} kbps`
          }
          prevBytes = bytes
          prevTime = now
          if (report.codecId && codecs[report.codecId]) {
            const codec = codecs[report.codecId]
            stats.codec = codec.mimeType ? codec.mimeType.replace('video/', '') : ''
          }
          if (report.packetsLost != null && report.packetsReceived != null) {
            const total = report.packetsReceived + report.packetsLost
            if (total > 0) {
              stats.packetLoss = `${report.packetsLost} (${((report.packetsLost / total) * 100).toFixed(1)}%)`
            }
          }
        }
        if (
          report.type === 'candidate-pair' &&
          report.state === 'succeeded' &&
          report.currentRoundTripTime != null
        ) {
          stats.rtt = `${Math.round(report.currentRoundTripTime * 1000)} ms`
        }
      })
    } catch {
      // 통계 수집 실패는 재생에 영향 없음 — 무시.
    }
  }

  function collectHlsStats() {
    const hls = getHlsInstance()
    if (!hls) return
    const level = hls.levels && hls.levels[hls.currentLevel]
    if (level?.attrs?.['FRAME-RATE']) {
      stats.fps = `${Math.round(parseFloat(level.attrs['FRAME-RATE']))}`
    }
    if (hls.bandwidthEstimate) {
      const bps = hls.bandwidthEstimate
      stats.bitrate = bps >= 1_000_000
        ? `${(bps / 1_000_000).toFixed(1)} Mbps`
        : `${Math.round(bps / 1000)} kbps`
    }
    stats.codec = level?.videoCodec || level?.codecSet || ''
    stats.rtt = ''
    stats.packetLoss = ''
  }

  onBeforeUnmount(stopStats)

  return {
    stats,
    startStats,
    stopStats,
  }
}

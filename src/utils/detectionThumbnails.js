const MAX_CACHED_THUMBNAILS = 20
const thumbnailsByClipCount = new Map()

function validClipCount(value) {
  const clipCount = Number(value)
  return Number.isInteger(clipCount) && clipCount > 0 ? clipCount : null
}

export function captureCurrentCameraFrame({ maxWidth = 960, quality = 0.85 } = {}) {
  try {
    const videos = [...document.querySelectorAll('video')]
      .filter((video) => video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0)
      .sort((left, right) => {
        const leftRect = left.getBoundingClientRect()
        const rightRect = right.getBoundingClientRect()
        return (rightRect.width * rightRect.height) - (leftRect.width * leftRect.height)
      })
    const video = videos[0]
    if (!video) return ''

    const width = Math.min(maxWidth, video.videoWidth)
    const height = Math.max(1, Math.round(width * video.videoHeight / video.videoWidth))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(video, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } catch (error) {
    console.warn('[WallyThumbnail] live frame capture failed', error)
    return ''
  }
}

export function cacheDetectionThumbnail(clipCount, thumbnail) {
  const key = validClipCount(clipCount)
  if (!key || !thumbnail) return ''
  thumbnailsByClipCount.delete(key)
  thumbnailsByClipCount.set(key, thumbnail)
  while (thumbnailsByClipCount.size > MAX_CACHED_THUMBNAILS) {
    thumbnailsByClipCount.delete(thumbnailsByClipCount.keys().next().value)
  }
  return thumbnail
}

export function captureDetectionThumbnail(clipCount) {
  const cached = getDetectionThumbnail(clipCount)
  if (cached) return cached
  return cacheDetectionThumbnail(clipCount, captureCurrentCameraFrame())
}

export function getDetectionThumbnail(clipCount) {
  const key = validClipCount(clipCount)
  return key ? thumbnailsByClipCount.get(key) || '' : ''
}

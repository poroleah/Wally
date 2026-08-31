export const ORIENTATION_DEBOUNCE_MS = 120

const LANDSCAPE_ENTER_RATIO = 1.04
const PORTRAIT_ENTER_RATIO = 0.96

export function getStableLandscape(currentLandscape, width = window.innerWidth, height = window.innerHeight) {
  if (!width || !height) return currentLandscape

  const ratio = width / height
  if (currentLandscape) return ratio > PORTRAIT_ENTER_RATIO
  return ratio >= LANDSCAPE_ENTER_RATIO
}

function getScreenLandscape() {
  const type = window.screen?.orientation?.type
  if (type?.startsWith('landscape')) return true
  if (type?.startsWith('portrait')) return false

  const angle = Number(window.screen?.orientation?.angle ?? window.orientation)
  if (Number.isFinite(angle)) return Math.abs(angle) % 180 === 90
  return null
}

export function usesPhysicalScreenOrientation() {
  return (
    document.documentElement.classList.contains('wally-native') ||
    window.matchMedia?.('(pointer: coarse)').matches
  )
}

export function getReliableLandscape(currentLandscape) {
  if (usesPhysicalScreenOrientation()) {
    const screenLandscape = getScreenLandscape()
    if (screenLandscape !== null) return screenLandscape
  }

  return getStableLandscape(currentLandscape)
}

export function isEditableElement(element = document.activeElement) {
  return Boolean(element?.matches?.('input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]), textarea, select, [contenteditable="true"]'))
}

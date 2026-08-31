const STREAM_FIELDS = ['source_type', 'ip', 'rtsp_port', 'username', 'stream_path']
const BACKEND_FIELDS = [...STREAM_FIELDS, 'onvif_port']

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizePort(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback
  const port = Number(value)
  return Number.isFinite(port) ? port : fallback
}

export function normalizeCameraConfig(value = {}) {
  return {
    source_type: normalizeText(value.source_type || 'rtsp_camera').toLowerCase(),
    ip: normalizeText(value.ip).toLowerCase(),
    rtsp_port: normalizePort(value.rtsp_port ?? value.port, 554),
    username: normalizeText(value.username ?? value.id),
    stream_path: normalizeText(value.stream_path || 'stream1'),
    onvif_port: normalizePort(value.onvif_port ?? value.onvifPort, null),
  }
}

function fieldsChanged(current, next, fields) {
  const before = normalizeCameraConfig(current)
  const after = normalizeCameraConfig(next)
  return fields.some((field) => before[field] !== after[field])
}

export function hasBackendCameraConfigChanged(current, next) {
  return fieldsChanged(current, next, BACKEND_FIELDS)
}

export function hasStreamCameraConfigChanged(current, next, password = '') {
  return Boolean(normalizeText(password)) || fieldsChanged(current, next, STREAM_FIELDS)
}

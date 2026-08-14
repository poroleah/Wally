export interface WallyRealtimeEvent {
  id: string
  clipName: string
  date: Date | null
  dateQuery: string
  time: string
  behavior: string
  recap: string
  detail: string
  clip: string
  mediaType?: string
  keywords?: string[]
  raw: Record<string, unknown>
}

export interface WallyRealtimeState {
  uptime: string
  infer_raw: string
  infer_ms: number
  event_triggered: boolean
  frame_w: number
  frame_h: number
  pipeline_state: string
  pipeline_state_detail: string
  pipeline_source_protocol: string
  pipeline_source_transport: string
  pipeline_active_for_s: number | null
  pipeline_last_frame_age_s: number | null
  pipeline_restart_count: number
  cfg_n_frames: number
  cpu_percent: number
  ram_used_mb: number
  ram_total_mb: number
  disk_used_mb: number
  disk_total_mb: number
  disk_free_mb: number
  disk_path: string
  gpu_load: number
  cpu_temp: number
  gpu_temp: number
  ptz_pan: number | null
  ptz_tilt: number | null
  ptz_saved_pan: number | null
  ptz_saved_tilt: number | null
  inference_prompt: string
  trigger_keywords: string
  clip_count: number
  segment_recorder_state: string
  segment_recorder_error: string
  segment_recorder_segment_count: number
  segment_recorder_last_segment_age_s: number | null
  vlm_state: string
  vlm_error: string
  vlm_models: string[]
  vlm_current_model: string
}

export interface WallyRealtimePayload extends Partial<WallyRealtimeState> {
  event_id?: string
  clip_id?: string
  name?: string
  timestamp?: number | string
  detected_at?: string
  camera_id?: string
  keywords?: string[]
  vlm_text?: string
  [key: string]: unknown
}

export interface WallyRealtimeEventListOptions {
  date?: Date | string | number | null
  limit?: number
  offset?: number
}

export class RealtimeEventApiError extends Error {
  cause?: unknown
}

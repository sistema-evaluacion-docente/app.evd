/** Processing state of the AI analysis for an evaluation. */
export type AiStatus = 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'FAILED'

/** A single evaluation record as returned by `GET /evaluations`. */
export interface EvaluationRecord {
  id: number
  user_id: number
  academic_period_id: number
  academic_period_name: string
  academic_period_code: string
  department_id: number
  pdf_url: string
  /** Whether the evaluation is currently active/visible. */
  active: boolean
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  ai_status: AiStatus | null
  /** Number of teachers evaluated in this evaluation. */
  count: number
  overall_average: number
  created_at: string
  updated_at: string
}

/** Payload accepted by `PATCH /evaluations/{id}/status`. */
export interface EvaluationStatusUpdate {
  active: boolean
}

/** Connection status of the evaluation progress WebSocket channel. */
export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/** Real-time progress push for an evaluation (upload or AI analysis). */
export interface EvaluationProgressEvent {
  type: 'evaluation_progress'
  evaluation_id: number
  stage: 'UPLOADING' | 'ANALYZING'
  status?: string
  ai_status?: string
  count?: number
  timestamp: string
}

/** A single log line pushed while an evaluation is being processed. */
export interface EvaluationLogEvent {
  type: 'evaluation_log'
  evaluation_id: number
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  teacher_name?: string
  teacher_code?: string
  course_name?: string
  course_code?: string
  timestamp: string
}

/** Union of the events accepted from the evaluation WebSocket channel. */
export type EvaluationWsEvent = EvaluationProgressEvent | EvaluationLogEvent

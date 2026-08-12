/** Processing state of the AI analysis for an evaluation. */
export type AiStatus = 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'FAILED'

/** Individual question score inside a dimension of an evaluation. */
export interface EvaluationQuestionScore {
  id?: number | null
  code: string
  text: string
  average?: number
  score?: number
}

/** Average of one pedagogical dimension across the whole evaluation. */
export interface DimensionAverageItem {
  dimension: string
  average?: number
  question_count: number
  questions: EvaluationQuestionScore[]
}

/** One question's average in the current evaluation vs. the previous period. */
export interface EvaluationComparisonQuestion {
  code: string
  text: string
  current_average: number
  old_average: number
  difference: number
}

/** One dimension's average in the current evaluation vs. the previous period. */
export interface EvaluationComparisonDimension {
  dimension: string
  current_average: number
  old_average: number
  difference: number
  questions: EvaluationComparisonQuestion[]
}

/** Overall + per-dimension comparison against the immediately previous academic period. */
export interface EvaluationComparison {
  previous_period_code: string
  previous_period_name: string
  current_average: number
  old_average: number
  average_difference: number
  dimensions: EvaluationComparisonDimension[]
}

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
  /** Count of comments per risk level (BAJO/MEDIO/ALTO). */
  comments_risk_counts?: { BAJO: number; MEDIO: number; ALTO: number }
  /** Per-dimension averages; only returned by `GET /evaluations/{id}`. */
  dimension_averages?: DimensionAverageItem[]
  /**
   * Comparison against the immediately previous academic period, only
   * returned by `GET /evaluations/{id}` when such a period exists.
   */
  comparison?: EvaluationComparison | null
  created_at: string
  updated_at: string
}

/** Payload accepted by `PATCH /evaluations/{id}/status`. */
export interface EvaluationStatusUpdate {
  active: boolean
}

/** A teacher's average score within one dimension — used for the ranking list and the best/worst highlight. */
export interface DimensionTeacherScore {
  teacher_id: number
  institutional_code: string
  name: string
  average: number
}

/** Full breakdown of one pedagogical dimension for an evaluation, as returned by `GET /evaluations/{id}/dimensions/detail`. */
export interface EvaluationDimensionDetail {
  dimension: string
  average?: number
  question_count: number
  questions: EvaluationQuestionScore[]
  best_teacher: DimensionTeacherScore | null
  worst_teacher: DimensionTeacherScore | null
}

/** Department-wide equivalent of a teacher/course-scoped detail — same shape, used to compare the scoped figures against the department. */
export interface EvaluationDimensionsOverall {
  department_average: number
  dimensions: EvaluationDimensionDetail[]
}

/** Per-dimension breakdown of an evaluation (`GET /evaluations/{evaluation_id}/dimensions/detail`). */
export interface EvaluationDimensionsDetail {
  evaluation_id: number
  period_code: string
  period_name: string
  department_average: number
  dimensions: EvaluationDimensionDetail[]
  /** Department-level comparison data, only returned when scoped by `teacher_id` and/or `course_id`. */
  overall?: EvaluationDimensionsOverall | null
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

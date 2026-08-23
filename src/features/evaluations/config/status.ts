import { STATUS_TONE_CLASS } from '@/lib/statusTone'
import type { AiStatus, EvaluationRecord } from '../types'

/** Display metadata (label + badge classes) for an evaluation status. */
export interface StatusDisplay {
  label: string
  className: string
}

/** Label and badge styling per evaluation processing status. */
export const EVALUATION_STATUS_DISPLAY: Record<EvaluationRecord['status'], StatusDisplay> = {
  PROCESSING: {
    label: 'Procesando',
    className: STATUS_TONE_CLASS.warning,
  },
  COMPLETED: {
    label: 'Completado',
    className: STATUS_TONE_CLASS.success,
  },
  FAILED: {
    label: 'Fallido',
    className: STATUS_TONE_CLASS.danger,
  },
}

/** Label and badge styling per AI analysis status. */
export const AI_STATUS_DISPLAY: Record<AiStatus, StatusDisplay> = {
  PENDING: {
    label: 'Pendiente',
    className: STATUS_TONE_CLASS.warning,
  },
  ANALYZING: {
    label: 'Analizando',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  ANALYZED: {
    label: 'Completado',
    className: STATUS_TONE_CLASS.success,
  },
  FAILED: {
    label: 'Fallido',
    className: STATUS_TONE_CLASS.danger,
  },
}

/** Filter options derived from the evaluation status display config. */
export const EVALUATION_STATUS_OPTIONS = Object.entries(EVALUATION_STATUS_DISPLAY).map(
  ([value, display]) => ({ value, label: display.label }),
)

/** Filter options derived from the AI status display config. */
export const AI_STATUS_OPTIONS = Object.entries(AI_STATUS_DISPLAY).map(([value, display]) => ({
  value,
  label: display.label,
}))

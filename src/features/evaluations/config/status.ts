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
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  COMPLETED: {
    label: 'Completado',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  FAILED: {
    label: 'Fallido',
    className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
}

/** Label and badge styling per AI analysis status. */
export const AI_STATUS_DISPLAY: Record<AiStatus, StatusDisplay> = {
  PENDING: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  ANALYZING: {
    label: 'Analizando',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  ANALYZED: {
    label: 'Completado',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  FAILED: {
    label: 'Fallido',
    className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
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

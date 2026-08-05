/** One evaluated academic period in a teacher's history. */
export interface TeacherPeriodHistory {
  /** Evaluation id for this period. */
  evaluation_id: number
  /** Academic period id. */
  period_id: number
  period_code: string
  period_name: string | null
  /** Average score across all groups evaluated in this period. */
  overall_average: number | null
  /** Number of groups the teacher had in this period. */
  group_count: number
}

/** Paginated historical record of a teacher across all evaluated periods. */
export interface TeacherHistoryOut {
  teacher_id: number
  institutional_code: string
  name: string | null
  items: TeacherPeriodHistory[]
  total: number
  page: number
  limit: number
  pages: number
}

/** Fields accepted by the teacher history endpoint for sorting. */
export type HistorySortField = 'period_code' | 'overall_average' | 'group_count'

/** Sort criteria accepted by the teacher history endpoint (`<field>_<asc|desc>`). */
export type HistorySortBy = `${HistorySortField}_asc` | `${HistorySortField}_desc`

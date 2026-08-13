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

/** A single question's score within a course-history dimension. */
export interface CourseHistoryQuestion {
  code: string
  text: string
  score: number | null
}

/** A pedagogical dimension's average within one period of a course's history. */
export interface CourseHistoryDimension {
  dimension: string
  average: number | null
  questions: CourseHistoryQuestion[]
}

/** One period's record in a teacher's history for a specific course. */
export interface CourseHistoryItem {
  academic_period_id: number
  period_code: string
  period_name: string
  /** `null` when the backend doesn't tie the record to a single group. */
  group_name: string | null
  respondent_count: number
  overall_average: number | null
  /** Department-wide average for the same course in the same period. */
  department_average: number | null
  dimensions: CourseHistoryDimension[]
}

/** Payload of `GET /teachers/{teacher_id}/courses/{course_code}/history`. */
export interface CourseHistoryOut {
  teacher_id: number
  course_code: string
  course_name: string | null
  /** Most recent period first. */
  items: CourseHistoryItem[]
}

/** An academic period option used to filter evaluations. */
export interface AcademicPeriod {
  id: number
  code: string
  name: string
  start_date: string | null
  end_date: string | null
  evaluation_end_date: string | null
  final_evaluation_date: string | null
  active: boolean
  created_at: string
  updated_at: string
}

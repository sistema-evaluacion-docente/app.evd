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

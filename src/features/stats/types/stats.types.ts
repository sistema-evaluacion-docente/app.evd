/** Minimal reference to an academic period embedded in a stats report. */
export interface StatsPeriodRef {
  academic_period_id: number
  academic_period_code: string
  academic_period_name: string
}

/** A single academic period's averages within a period-range report. */
export interface DepartmentPeriodAverage extends StatsPeriodRef {
  overall_average: number
  total_respondents: number
  evaluation_count: number
}

/** A pedagogical dimension's average across a period range. */
export interface DepartmentDimensionAverage {
  dimension: string
  average: number
  /** 0–1 or 0–100 score, see `formatPercent`. */
  percentage: number
}

/** One group behind a course's aggregated average — a specific course code, teacher, period and group. */
export interface DepartmentSubjectGroup {
  academic_group_id: number
  group_name: string
  course_id: number
  course_code: string
  teacher_id: number
  teacher_name: string
  teacher_avatar_url?: string
  academic_period_id: number
  academic_period_code: string
  overall_average: number
  respondent_count: number
}

/**
 * A course's aggregated results across a period range. Rows are grouped by
 * `course_name` — the same course can carry more than one `course_code`
 * (e.g. across faculties/periods), each represented individually inside
 * `groups`.
 */
export interface DepartmentSubjectAverage {
  course_name: string
  /** Every course code rolled up under this course name. */
  course_codes: string[]
  teacher_count: number
  group_count: number
  overall_average: number
  total_respondents: number
  /** Individual groups (course code/teacher/period/group) rolled up into this average. */
  groups: DepartmentSubjectGroup[]
}

/**
 * Report for the director's own department across a range of academic
 * periods (`GET /stats/departments/period-range`). Per-subject averages are
 * fetched separately (paginated) via `useGetDepartmentPeriodRangeSubjects`.
 */
export interface DepartmentPeriodRangeStats {
  department_id: number
  department_name: string
  department_code: string
  start_period_code: string
  end_period_code: string
  /** Every academic period included in the range, oldest first. */
  periods: StatsPeriodRef[]
  overall_average: number
  total_respondents: number
  evaluation_count: number
  /** Overall average broken down by period, for the trend chart. */
  period_averages: DepartmentPeriodAverage[]
  /** Overall average broken down by pedagogical dimension. */
  dimensions: DepartmentDimensionAverage[]
  /** Count of comments per risk level (BAJO/MEDIO/ALTO). */
  comments_risk_counts?: { BAJO: number; MEDIO: number; ALTO: number }
  /** Count of comments per pedagogical category code (`LABEL_0`…`LABEL_4`). */
  comments_pedagogical_category_counts?: Record<string, number>
}

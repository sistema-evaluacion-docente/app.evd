/** User account linked to a teacher record, as returned by the API. */
export interface TeacherUser {
  id: number
  uid: string
  email: string
  department_id: number
  name: string
  active: boolean
  avatar_url: string
  institutional_code: string
  roles: string[]
  teacher_id: number
  created_at: string
  updated_at: string
}

/** A single teacher record as returned by `GET /teachers`. */
export interface TeacherRecord {
  id: number
  institutional_code: string
  department_id: number
  contract_type: string
  user_id: number
  /** Linked user account (name, email, avatar, roles). */
  user: TeacherUser
  active: boolean
  /** Average score of the teacher across their evaluated groups. */
  overall_average: number
  created_at: string
  updated_at: string
}

/** A single question within a dimension. */
export interface QuestionDetail {
  question: string
  average: number
}

/** A dimension with its average score and associated questions. */
export interface DimensionDetail {
  dimension: string
  average: number
  questions: QuestionDetail[]
}

/** A course taught by the teacher with its evaluation data. */
export interface CourseDetail {
  course_code: string
  course_name: string
  group_name: string
  respondent_count: number
  overall_average: number
  dimensions: DimensionDetail[]
}

/** Full teacher detail as returned by `GET /evaluations/teachers/{id}/detail`. */
export interface TeacherDetail {
  teacher_id: number
  institutional_code: string
  name: string
  avatar_url: string
  contract_type: string
  evaluation_id: number
  period_code: string
  period_name: string
  overall_average: number
  group_count: number
  courses: CourseDetail[]
  dimensions: DimensionDetail[]
}

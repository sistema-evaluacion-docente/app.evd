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

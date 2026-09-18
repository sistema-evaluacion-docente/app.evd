export interface User {
  id?: number
  uid: string
  name: string
  username: string
  email: string
  active: boolean
  department_id: number | null
  department_name?: string | null
  /** Faculty this user deans, if their role is DECANO. Null for everyone else. */
  faculty_id?: number | null
  faculty_name?: string | null
  roles: string[]
  avatar_url: string
  teacher_id: number | null
  created_at: string
  updated_at: string
}

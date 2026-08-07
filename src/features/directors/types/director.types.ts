/** Lightweight user summary of a director, as returned by `GET /directors/`. */
export interface DirectorUser {
  id: number
  email: string
  name: string
  avatar_url: string
}

/** Lightweight department summary of a director, as returned by `GET /directors/`. */
export interface DirectorDepartment {
  id: number
  name: string
  code: string
}

/** A single director record as returned by `GET /directors/`. */
export interface Director {
  id: number
  institutional_code: string
  /** ID of the linked user, used when assigning the director to a department. */
  user_id: number
  department_id: number
  user: DirectorUser
  department: DirectorDepartment
  active: boolean
  created_at: string
  updated_at: string
}

/** Query params accepted by `GET /directors/`. */
export interface DirectorParams {
  /** Free-text search over name and institutional code. */
  search?: string
  /** Filter by active status. */
  active?: boolean
  page: number
  limit: number
}

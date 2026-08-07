/** Lightweight director summary as returned by `GET /departments/`. */
export interface Director {
  id: number
  name: string
  avatar_url: string | null
}

/** A single department record as returned by `GET /departments/`. */
export interface Department {
  id: number
  /** Unique code identifier for the department. */
  code: string
  /** Name of the department. */
  name: string
  /** ID of the faculty this department belongs to. */
  faculty_id: number
  /** Whether the department is currently active. */
  active: boolean
  /** Summary of the director of this department. */
  director: Director | null
  /** Number of teachers in this department. */
  teacher_count: number
  created_at: string
  updated_at: string
}

/** Query params accepted by `GET /departments/`. */
export interface DepartmentParams {
  /** Free-text search over name and code. */
  search?: string
  /** Filter by active status. */
  active?: boolean
  /** Filter by faculty ID. */
  faculty_id?: number
  page: number
  limit: number
}

/** Payload for creating a new department via `POST /departments/`. */
export interface CreateDepartmentPayload {
  name: string
  code: string
  faculty_id: number
}

/** Payload for updating a department via `PUT /departments/{department_id}`. */
export interface UpdateDepartmentPayload {
  name: string
  code: string
  faculty_id: number
  active: boolean
}

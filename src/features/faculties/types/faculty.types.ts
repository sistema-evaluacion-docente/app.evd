/** A single faculty record as returned by `GET /faculties/`. */
export interface Faculty {
  id: number
  /** Name of the faculty. */
  name: string
  /** Unique code identifier for the faculty. */
  code: string
  /** Whether the faculty is currently active. */
  active: boolean
  /** Number of departments in this faculty. */
  department_count: number
  created_at: string
  updated_at: string
}

/** Query params accepted by `GET /faculties/`. */
export interface FacultyParams {
  /** Free-text search over name and code. */
  search?: string
  /** Filter by active status. */
  active?: boolean
  page: number
  limit: number
}

/** Payload for creating a new faculty via `POST /faculties/`. */
export interface CreateFacultyPayload {
  name: string
  code: string
}

/** Payload for updating a faculty via `PUT /faculties/{faculty_id}`. */
export interface UpdateFacultyPayload {
  name: string
  code: string
  active: boolean
}

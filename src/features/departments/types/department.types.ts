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

/**
 * One department's evaluation upload state in a period, as returned by
 * `GET /stats/departments/uploads`. Departments that uploaded nothing are
 * included (`has_uploaded: false`).
 */
export interface DepartmentUploadStatus {
  department_id: number
  department_name: string
  department_code: string
  evaluation_count: number
  has_uploaded: boolean
  last_uploaded_at: string | null
  /** Processing status of the most recent evaluation, null when nothing was uploaded. */
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | null
  /** AI analysis status of the most recent evaluation, null when nothing was uploaded. */
  ai_status: 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'FAILED' | null
  /** Null until the evaluation is analysed. */
  global_average: number | null
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

import type { User } from '@/features/auth'

/**
 * A single user record as returned by `GET /users/` (admin list view).
 * Reuses the shared `User` entity, adding the institutional code and dropping
 * the `username` field that the admin endpoint does not return.
 */
export type AdminUser = Omit<User, 'username' | 'id'> & {
  id: number
  /** Institutional code of the user. */
  institutional_code: string
  /**
   * Department of the user's teacher record, or `null` without one. Not the
   * same as `department_id`: for a director that one is the department they
   * direct, which can differ from where their teacher record sits.
   */
  teacher_department_id?: number | null
}

/** Query params accepted by `GET /users/`. */
export interface UserParams {
  /** Free-text search over name, email and institutional code. */
  search?: string
  /** Filter by active status. */
  active?: boolean
  /** Filter by roles (e.g. `['DOCENTE', 'DIRECTOR DE DEPARTAMENTO']`). */
  roles?: string[]
  /** Users of a department: those who teach in it or direct it. */
  department_id?: number
  page: number
  limit: number
}

/**
 * What an admin can change about another user, via `PUT /users/by-id/{id}`.
 *
 * Addressed by the numeric `id`, so it also works for someone who never
 * logged in (no Firebase `uid` yet). Changing the email of someone who did
 * log in unlinks their Firebase account: they sign in again with the new one.
 */
export interface UpdateUserPayload {
  name: string
  email: string
  institutional_code: string
  /** Roles assigned to the user, replacing whatever they had (e.g. `['DOCENTE']`). */
  roles: string[]
  active: boolean
  /**
   * Department of the user's teacher record; `null` clears it. Only valid
   * when the roles include `DOCENTE` — send it only when it actually changed.
   */
  department_id?: number | null
}

/** Payload for creating a user via `POST /users/`. */
export interface CreateUserPayload {
  uid: string
  email: string
  name: string
  active: boolean
  avatar_url: string
  institutional_code: string
  contract_type: string
  department_id: number
  /** At least one role is required. */
  roles: string[]
}

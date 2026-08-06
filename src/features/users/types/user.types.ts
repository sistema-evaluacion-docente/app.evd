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
}

/** Query params accepted by `GET /users/`. */
export interface UserParams {
  /** Free-text search over name, email and institutional code. */
  search?: string
  /** Filter by active status. */
  active?: boolean
  page: number
  limit: number
}

/** Payload for updating a user via `PUT /users/{user_id}`. */
export interface UpdateUserPayload {
  name: string
  active: boolean
  avatar_url: string
  /** Roles assigned to the user (e.g. `['DOCENTE']`). */
  roles: string[]
}

/** A single academic program record as returned by `GET /programs/`. */
export interface Program {
  id: number
  /** Name of the academic program. */
  name: string
  /** Unique code identifier for the program. */
  code: string
  /** Whether the program is currently active. */
  active: boolean
  created_at: string
  updated_at: string
}

/** Query params accepted by `GET /programs/`. */
export interface ProgramParams {
  /** Free-text search over name and code. */
  search?: string
  /** Filter by active status. */
  active?: boolean
  page: number
  limit: number
}

/** Payload for creating a new program via `POST /programs/`. */
export interface CreateProgramPayload {
  name: string
  code: string
}

/** Payload for updating a program via `PUT /programs/{program_id}`. */
export interface UpdateProgramPayload {
  name: string
  code: string
  active: boolean
}

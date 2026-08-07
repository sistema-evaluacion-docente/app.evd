/** Lightweight user summary of the audit actor, as returned by `GET /audits/`. */
export interface AuditUser {
  id: number
  name: string | null
  email: string | null
  avatar_url: string | null
}

/** A single audit log entry as returned by `GET /audits/`. */
export interface AuditLog {
  id: number
  user_id: number | null
  user: AuditUser | null
  /** Name of the entity/table the operation was performed on. */
  table_name: string | null
  operation: string | null
  /** Identifier of the affected record (e.g. its primary key). */
  element: string | null
  description: string | null
  /** Snapshot of the affected record at the time of the operation. */
  element_data?: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

/** Detailed audit log entry as returned by `GET /audits/{audit_id}`. */
export interface AuditLogDetail {
  id: number
  user_id: number | null
  user: AuditUser | null
  table_name: string | null
  operation: string | null
  element: string | null
  description: string | null
  element_data?: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

/** Query params accepted by `GET /audits/`. */
export interface AuditLogParams {
  entity_name?: string
  operation?: string
  /** ISO 8601 date-time, inclusive start of the range. */
  date_from?: string
  /** ISO 8601 date-time, inclusive end of the range. */
  date_to?: string
  /** Free-text search over element and description. */
  search?: string
  page: number
  limit: number
}

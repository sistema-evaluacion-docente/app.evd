/**
 * Scope a setting value lives in. `GLOBAL` is the institutional value an ADMIN
 * maintains; `DEPARTMENT` is a department's own value, which overrides the
 * institutional one for that department. The institutional value is the
 * fallback for every department that has not overridden it.
 */
export type SettingScope = 'GLOBAL' | 'DEPARTMENT'

/** A single system setting as returned by `GET /settings/`. */
export interface Setting {
  id: number
  /** Unique key that identifies the setting. */
  key: string
  /** Current value of the setting. */
  value: string
  /** Data type of the value (e.g. `string`, `number`, `boolean`, `json`). */
  value_type: string
  /** Human-readable description of what the setting controls. */
  description: string
  /** Department the value belongs to; `null` for the institutional value. */
  department_id: number | null
  /** Display name of the owning department; `null` for the institutional value. */
  department_name: string | null
  /** Derived from `department_id` — see `SettingScope`. */
  scope: SettingScope
  /** User that last changed the setting. */
  changed_by: string
  /** Display name of the user that last changed the setting. */
  changed_by_name: string | null
  /** Avatar URL of the user that last changed the setting. */
  changed_by_avatar_url: string | null
  /** Date-time from which the setting value takes effect. */
  effective_from: string
  created_at: string
  updated_at: string
}

/** Query params accepted by `GET /settings/`. */
export interface SettingParams {
  /** Free-text search over key and description. */
  search?: string
  /** Restricts the list to one data type (`STRING`, `JSON`, ...). */
  value_type?: string
  /**
   * Department whose values to list. Ignored for a DIRECTOR — the backend
   * pins the query to their own department.
   */
  department_id?: number
  /** Also list the institutional values a department has not overridden. */
  include_global?: boolean
  page: number
  limit: number
}

/**
 * Payload accepted by `POST /settings/`. A DIRECTOR omits `department_id`:
 * the backend attaches their own department, and rejects any other with a 403.
 */
export interface CreateSettingPayload {
  key: string
  value: string
  value_type?: string
  description?: string
  department_id?: number
}

/** Payload accepted by `PUT /settings/{setting_id}`. */
export interface UpdateSettingPayload {
  /** New value of the setting. */
  value: string
  /** Reason for the change, recorded as the audit trail. */
  change_reason?: string
}

/** A single entry in the change history of a setting (`GET /settings/{setting_id}/history`). */
export interface SettingHistory {
  id: number
  key: string
  /** Value of the setting before the change. */
  old_value: string
  /** Value of the setting after the change. */
  new_value: string
  /** User that performed the change. */
  changed_by: string
  /** Display name of the user that performed the change. */
  changed_by_name: string | null
  /** Avatar URL of the user that performed the change. */
  changed_by_avatar_url: string | null
  /** Reason for the change. */
  change_reason: string
  /** Date-time of the change. */
  changed_at: string
}

/** Query params accepted by `GET /settings/{setting_id}/history`. */
export interface SettingHistoryParams {
  page: number
  limit: number
}

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
  page: number
  limit: number
}

/** Payload accepted by `PUT /settings/{setting_id}`. */
export interface UpdateSettingPayload {
  /** New value of the setting. */
  value: string
  /** Reason for the change, recorded as the audit trail. */
  change_reason: string
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

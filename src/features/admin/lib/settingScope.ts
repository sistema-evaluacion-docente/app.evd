import type { Setting } from '../types'

/**
 * Whether a setting is one the caller may write to directly with a `PUT`.
 *
 * A director may read an institutional (`GLOBAL`) value but never write to it:
 * changing it means `POST`ing a copy the backend attaches to their department.
 * Picking the wrong verb is not a silent mistake — a `PUT` on an institutional
 * value is rejected with a 403, and a `POST` for a key that already exists in
 * the scope being written to is rejected with a 409.
 *
 * @example
 * isDepartmentOwnedSetting(setting) ? update(setting.id, payload) : create(payload)
 */
export function isDepartmentOwnedSetting(setting: Setting): boolean {
  return setting.scope === 'DEPARTMENT'
}

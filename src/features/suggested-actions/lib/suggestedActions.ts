import type { SuggestedAction } from '../types'

/** Key of the setting the whole list is stored under. */
export const SUGGESTED_ACTIONS_KEY = 'improvement_plan.suggested_actions'

/** `value_type` the backend stores the list under. */
export const SUGGESTED_ACTIONS_VALUE_TYPE = 'JSON'

/** Description written when the department creates its own copy of the list. */
export const SUGGESTED_ACTIONS_DESCRIPTION =
  'Acciones de mejora sugeridas por defecto para los planes de mejoramiento'

/** A fresh id for a row that has never been saved. */
export function newSuggestedActionId(): string {
  return crypto.randomUUID()
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * Reads the stored JSON array back into actions, dropping anything that does
 * not look like one.
 *
 * A single malformed entry — or a value that isn't JSON at all, which is what
 * an institutional value written by hand can be — must not blank the page, so
 * this never throws: the worst case is an empty list the director can refill.
 *
 * Fields beyond the ones an action carries are dropped rather than preserved,
 * so a list written before the shape was trimmed reads back as the current one.
 *
 * @example
 * parseSuggestedActions('[{"id":"a","aspect":2,"action":"..."}]')
 */
export function parseSuggestedActions(value: string | null | undefined): SuggestedAction[] {
  if (!value?.trim()) return []

  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    return []
  }

  if (!Array.isArray(parsed)) return []

  return parsed.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []

    const record = entry as Record<string, unknown>
    const action = asText(record.action).trim()

    // An action with no text is a row nobody can read or pick — drop it
    // rather than paint an empty line the director can't explain.
    if (!action) return []

    const aspect = Number(record.aspect)

    return [
      {
        id: asText(record.id) || newSuggestedActionId(),
        aspect: Number.isFinite(aspect) ? aspect : 0,
        action,
      },
    ]
  })
}

/** Serializes the list back into the `value` of the setting. */
export function serializeSuggestedActions(actions: SuggestedAction[]): string {
  return JSON.stringify(actions)
}

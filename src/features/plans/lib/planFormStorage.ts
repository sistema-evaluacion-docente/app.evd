import type { DraftCourse, DraftItem } from '../types'

/**
 * Local backup of the plan form, so reloading the page — or closing it by
 * mistake — doesn't cost the director everything they had picked and typed.
 *
 * It lives in `localStorage` and nowhere else: the API has no draft state to
 * save into (a plan is born `EN_SEGUIMIENTO`; `BORRADOR` is unreachable), and
 * half-written plans have no business showing up in the department's list.
 */

/** Bumped whenever the snapshot shape changes, to drop the ones we can't read. */
export const PLAN_DRAFT_VERSION = 1

/** Past this, whatever was being written is no longer what the director meant. */
export const PLAN_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Everything the form owns that is worth getting back. */
export interface PlanFormSnapshot {
  teacherId?: number
  periodId?: number
  titleOverride: string | null
  description: string
  facultyOverride: string | null
  departmentOverride: string | null
  programOverride: string | null
  actaDate: string
  actaNumber: string
  councilObservations: string
  departmentObservations: string
  programObservations: string
  items: DraftItem[]
  courses: DraftCourse[]
}

export interface PlanFormDraft extends PlanFormSnapshot {
  version: number
  /** ISO timestamp of the last save, for the "guardado hace un momento" line. */
  savedAt: string
}

/**
 * Key a draft is filed under. Creation and each edited plan get their own, so
 * two plans open in two tabs never overwrite one another.
 *
 * @example
 * planDraftKey()   // → 'evd:plan-form:new'
 * planDraftKey(42) // → 'evd:plan-form:42'
 */
export function planDraftKey(planId?: number): string {
  return `evd:plan-form:${planId ?? 'new'}`
}

/**
 * The draft stored under `key`, or `null` when there is nothing usable.
 *
 * A draft is dropped when it was written by an older version of the form, when
 * it has gone stale, or when the page was opened for a different teacher than
 * the one it holds — arriving from another teacher's profile means starting a
 * new plan, not resuming someone else's.
 */
export function readPlanDraft(
  key: string,
  options: { presetTeacherId?: number; now?: number } = {},
): PlanFormDraft | null {
  const { presetTeacherId, now = Date.now() } = options

  let raw: string | null

  try {
    raw = window.localStorage.getItem(key)
  } catch {
    // Private browsing and blocked storage both throw; there is simply no draft.
    return null
  }

  if (!raw) return null

  let draft: PlanFormDraft

  try {
    draft = JSON.parse(raw) as PlanFormDraft
  } catch {
    clearPlanDraft(key)
    return null
  }

  const savedAt = Date.parse(draft?.savedAt ?? '')

  if (
    draft?.version !== PLAN_DRAFT_VERSION ||
    Number.isNaN(savedAt) ||
    now - savedAt > PLAN_DRAFT_MAX_AGE_MS ||
    (presetTeacherId != null && draft.teacherId !== presetTeacherId)
  ) {
    clearPlanDraft(key)
    return null
  }

  return draft
}

/** Saves the snapshot and answers with the timestamp it was filed under. */
export function writePlanDraft(key: string, snapshot: PlanFormSnapshot): string | null {
  const savedAt = new Date().toISOString()

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...snapshot, version: PLAN_DRAFT_VERSION, savedAt }),
    )
  } catch {
    // A full or unavailable quota must never take the form down with it.
    return null
  }

  return savedAt
}

export function clearPlanDraft(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to do: the draft simply outlives the session.
  }
}

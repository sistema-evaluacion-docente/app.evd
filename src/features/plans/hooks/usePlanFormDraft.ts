import { useEffect, useRef, useState } from 'react'

import { clearPlanDraft, type PlanFormSnapshot, writePlanDraft } from '../lib/planFormStorage'

/** Long enough that typing a sentence is one save, short enough to feel safe. */
const SAVE_DELAY_MS = 800

export interface PlanFormDraftState {
  /** ISO timestamp of the last successful save, or `null` before the first one. */
  savedAt: string | null
  /** Drops the backup — on discard, and once the plan is actually submitted. */
  discard: () => void
}

/**
 * Keeps a local backup of the form in step with what is on screen.
 *
 * The snapshot is compared serialised, so a save only happens when something
 * really changed: the object itself is rebuilt on every render and would
 * otherwise be written back untouched.
 *
 * @example
 * const { savedAt, discard } = usePlanFormDraft(planDraftKey(), snapshot)
 */
export function usePlanFormDraft(
  key: string,
  snapshot: PlanFormSnapshot,
  options: { enabled?: boolean } = {},
): PlanFormDraftState {
  const { enabled = true } = options

  const serialised = JSON.stringify(snapshot)

  const [savedAt, setSavedAt] = useState<string | null>(null)

  // What is on disk right now. Seeded with the first value seen so that merely
  // opening the form — or restoring a draft — doesn't rewrite it untouched.
  const persisted = useRef(serialised)
  const discarded = useRef(false)

  useEffect(() => {
    if (!enabled || discarded.current) return
    if (serialised === persisted.current) return

    // The debounce lives here rather than on the value: waiting inside the
    // effect keeps the write and the timestamp in the same callback, off the
    // render path, and every keystroke cancels the pending one on cleanup.
    const timer = window.setTimeout(() => {
      const stamp = writePlanDraft(key, JSON.parse(serialised) as PlanFormSnapshot)

      persisted.current = serialised
      if (stamp) setSavedAt(stamp)
    }, SAVE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [serialised, enabled, key])

  function discard() {
    // Latched so a pending write can't put the draft straight back.
    discarded.current = true
    clearPlanDraft(key)
    setSavedAt(null)
  }

  return { savedAt, discard }
}

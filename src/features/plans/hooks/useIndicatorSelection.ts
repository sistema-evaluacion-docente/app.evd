import { useCallback, useMemo, useState } from 'react'

import { ROLE, useAuthStore } from '@/features/auth'
import { useNavigate } from '@/hooks/useNavigate'
import { useGetPlanIndicators, useGetPlans } from '../api'
import { commentSelectionId, indicatorSelectionId } from '../lib/planDraft'
import { formatPicks, type PlanPick } from '../lib/planPicks'

/** Fallback while the institutional threshold is on its way. */
const DEFAULT_THRESHOLD = 3.5

/** How far back to look for the plan this period already has. */
const PLAN_LOOKUP_LIMIT = 20

export type SelectionKind = 'dimension' | 'question' | 'comment'

/**
 * One marked row.
 *
 * `ref` is deliberately not the shape the URL wants: a dimension is held by
 * **name**, which is what the profile has on screen, and only becomes the
 * aspect number of the official form at submit time, where the catalogue is
 * loaded. Holding it by aspect would make every row wait for a request the
 * reader never asked for.
 */
export interface SelectionEntry {
  kind: SelectionKind
  /** Dimension name, question code, or comment id. */
  ref: string
  /** `courseKey` of the asignatura it was marked on, `null` at teacher level. */
  subjectKey: string | null
  /** How the row reads back in the selection bar. */
  label: string
  /** Name of that asignatura, for the bar to say where it was marked. */
  subjectLabel: string | null
}

/**
 * What the profile's own sections need to render a selection, and nothing
 * more. Kept this narrow so `features/teachers` never learns what a pick, an
 * aspect or a plan route is.
 */
export interface IndicatorSelectionApi {
  /** Institutional threshold; an indicator at or below it counts as weak. */
  threshold: number
  isSelected: (kind: SelectionKind, ref: string, subjectKey: string | null) => boolean
  toggle: (entry: SelectionEntry) => void
  /**
   * In how many *other* asignaturas the same indicator is already marked.
   *
   * The same question can be marked period-wide and inside a course, and
   * `seedFromPicks` files each as its own commitment — correctly, but nobody
   * would see it happen. This is what lets a row say so out loud.
   */
  markedElsewhere: (kind: SelectionKind, ref: string, subjectKey: string | null) => number
}

export interface IndicatorSelection extends IndicatorSelectionApi {
  /** Whether the profile is in selection mode. Never true for a non-director. */
  active: boolean
  /** Turns the mode on. A no-op for anyone who does not run plans. */
  start: () => void
  /** Turns it off and drops what was marked. */
  cancel: () => void
  entries: [string, SelectionEntry][]
  count: number
  remove: (id: string) => void
  clear: () => void
  /** Marks everything given that is not marked yet. */
  markMany: (entries: SelectionEntry[]) => void
  /** Hands the selection to the plan form. */
  submit: () => void
  /** The plan the period already has, when it has one and still takes content. */
  existingPlanId: number | null
  /** Whether the teacher's plans are still on their way. */
  isPending: boolean
}

function selectionId(kind: SelectionKind, ref: string, subjectKey: string | null): string {
  if (kind === 'comment') return commentSelectionId(Number(ref))

  return indicatorSelectionId(subjectKey, kind === 'dimension' ? 'DIMENSION' : 'QUESTION', ref)
}

/**
 * The indicators a director marks on a teacher's profile, on their way to a
 * plan.
 *
 * The profile is where the scores are read, so it is where the decision is
 * taken; asking the director to remember an indicator, open the plan form and
 * find it again was the whole friction this removes. Nothing is written here —
 * the commitments are drafted on the form, which is what the form is for.
 *
 * The selection belongs to one period: it is dropped whenever `periodCode`
 * changes, because a pick only means anything against the scores it was read
 * on.
 *
 * @example
 * const selection = useIndicatorSelection({ teacherId, periodCode: teacher.period_code })
 */
export function useIndicatorSelection({
  teacherId,
  periodCode,
}: {
  teacherId: number
  periodCode?: string
}): IndicatorSelection {
  const navigate = useNavigate()

  // Only the department director runs improvement plans, and only while that is
  // the role they are signed in as. Gated here rather than at each call site so
  // a screen cannot forget it — the profile is the same component the teacher
  // reads their own report from.
  const canManage = useAuthStore((state) => state.selectedRole) === ROLE.DEPARTMENT_DIRECTOR

  const [active, setActive] = useState(false)
  const [marked, setMarked] = useState<ReadonlyMap<string, SelectionEntry>>(() => new Map())

  // Held back until the mode is on: the profile should not pay for a request a
  // director may never ask for. Once loaded it stays in the query cache, so the
  // plan form that comes next reads it from there.
  const { data: indicatorsResponse } = useGetPlanIndicators({ enabled: active })
  const catalogue = indicatorsResponse?.data

  // The same query `TeacherPlanAction` makes, deduped by React Query. Held
  // back for anyone else: this profile is also the page a teacher reads their
  // own report on, and the plans of a department are not theirs to ask for —
  // the request would come back 403 and toast an error at them.
  const { data: plansResponse, isPending } = useGetPlans({
    teacherId,
    limit: PLAN_LOOKUP_LIMIT,
    enabled: canManage,
  })

  const existing = periodCode
    ? plansResponse?.data?.find((plan) => plan.origin_period_code === periodCode)
    : undefined

  // A closed acta takes no more commitments, so a selection would have nowhere
  // to land; the button that starts the mode is hidden in that case anyway.
  const existingPlanId = existing && !existing.acta_locked ? existing.id : null

  // Switching period replaces every score on screen, and a pick read on the old
  // ones would be filed against the new. Adjusted during render rather than in
  // an effect: React re-runs this component before committing, so the reader
  // never sees a frame with the previous period's marks still counted.
  const [scope, setScope] = useState({ teacherId, periodCode })

  if (scope.teacherId !== teacherId || scope.periodCode !== periodCode) {
    setScope({ teacherId, periodCode })
    setActive(false)
    setMarked(new Map())
  }

  const isSelected = useCallback(
    (kind: SelectionKind, ref: string, subjectKey: string | null) =>
      marked.has(selectionId(kind, ref, subjectKey)),
    [marked],
  )

  const toggle = useCallback((entry: SelectionEntry) => {
    const id = selectionId(entry.kind, entry.ref, entry.subjectKey)

    setMarked((current) => {
      const next = new Map(current)

      if (next.has(id)) next.delete(id)
      else next.set(id, entry)

      return next
    })
  }, [])

  const markedElsewhere = useCallback(
    (kind: SelectionKind, ref: string, subjectKey: string | null) => {
      if (kind === 'comment') return 0

      let count = 0

      for (const entry of marked.values()) {
        if (entry.kind !== kind || entry.ref !== ref) continue
        if (entry.subjectKey === subjectKey) continue

        count += 1
      }

      return count
    },
    [marked],
  )

  const markMany = useCallback((incoming: SelectionEntry[]) => {
    setMarked((current) => {
      const next = new Map(current)

      for (const entry of incoming) {
        const id = selectionId(entry.kind, entry.ref, entry.subjectKey)

        if (!next.has(id)) next.set(id, entry)
      }

      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setMarked((current) => {
      const next = new Map(current)

      next.delete(id)

      return next
    })
  }, [])

  const clear = useCallback(() => setMarked(new Map()), [])

  const entries = useMemo(() => [...marked.entries()], [marked])

  function submit() {
    const picks: PlanPick[] = []

    for (const entry of marked.values()) {
      if (entry.kind === 'dimension') {
        // A dimension travels by the aspect number the official form gives it.
        // Without the catalogue there is no way to know it, and guessing would
        // file the commitment under the wrong section of the acta.
        const aspect = catalogue?.aspects.find((row) => row.dimension === entry.ref)?.aspect

        if (aspect != null) {
          picks.push({ kind: 'dimension', ref: String(aspect), subjectKey: entry.subjectKey })
        }

        continue
      }

      picks.push({ kind: entry.kind, ref: entry.ref, subjectKey: entry.subjectKey })
    }

    const base =
      existingPlanId != null
        ? `/planes/${existingPlanId}/editar`
        : `/planes/nuevo?teacher=${teacherId}${
            periodCode ? `&period_code=${encodeURIComponent(periodCode)}` : ''
          }`

    const formatted = formatPicks(picks)
    const separator = base.includes('?') ? '&' : '?'

    setActive(false)
    setMarked(new Map())

    navigate(formatted ? `${base}${separator}picks=${encodeURIComponent(formatted)}` : base)
  }

  return {
    active: canManage && active,
    start: () => {
      if (canManage) setActive(true)
    },
    cancel: () => {
      setActive(false)
      setMarked(new Map())
    },
    threshold: catalogue?.threshold ?? DEFAULT_THRESHOLD,
    entries,
    count: marked.size,
    isSelected,
    toggle,
    markedElsewhere,
    markMany,
    remove,
    clear,
    submit,
    existingPlanId,
    isPending,
  }
}

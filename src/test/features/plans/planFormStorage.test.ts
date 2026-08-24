import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearPlanDraft,
  PLAN_DRAFT_MAX_AGE_MS,
  planDraftKey,
  type PlanFormSnapshot,
  readPlanDraft,
  writePlanDraft,
} from '@/features/plans/lib/planFormStorage'

const SNAPSHOT: PlanFormSnapshot = {
  teacherId: 7,
  periodId: 2,
  titleOverride: 'Plan de Ada',
  description: '',
  programOverride: null,
  actaDate: '2026-08-19',
  actaNumber: '012',
  councilObservations: '',
  departmentObservations: '',
  programObservations: '',
  items: [],
  courses: [],
}

describe('planDraftKey', () => {
  it('keeps creation and each edited plan apart, so two tabs never collide', () => {
    expect(planDraftKey()).toBe('evd:plan-form:new')
    expect(planDraftKey(42)).toBe('evd:plan-form:42')
    expect(planDraftKey(42)).not.toBe(planDraftKey(7))
  })
})

describe('readPlanDraft', () => {
  const key = planDraftKey()

  beforeEach(() => {
    window.localStorage.clear()
  })

  it('gives back what was saved', () => {
    writePlanDraft(key, SNAPSHOT)

    expect(readPlanDraft(key)).toMatchObject({ titleOverride: 'Plan de Ada', teacherId: 7 })
  })

  it('answers null when nothing was ever saved', () => {
    expect(readPlanDraft(key)).toBeNull()
  })

  it('drops a draft older than the retention window instead of resurrecting it', () => {
    writePlanDraft(key, SNAPSHOT)

    const later = Date.now() + PLAN_DRAFT_MAX_AGE_MS + 1_000

    expect(readPlanDraft(key, { now: later })).toBeNull()
    // …and takes it off disk, so it can't come back on a later read.
    expect(window.localStorage.getItem(key)).toBeNull()
  })

  it('keeps a draft that is merely old, but still inside the window', () => {
    writePlanDraft(key, SNAPSHOT)

    const later = Date.now() + PLAN_DRAFT_MAX_AGE_MS - 60_000

    expect(readPlanDraft(key, { now: later })).not.toBeNull()
  })

  it('ignores a draft for another teacher: that is a new plan, not a resumed one', () => {
    writePlanDraft(key, SNAPSHOT)

    expect(readPlanDraft(key, { presetTeacherId: 9 })).toBeNull()
  })

  it('restores when the preselected teacher is the one the draft holds', () => {
    writePlanDraft(key, SNAPSHOT)

    expect(readPlanDraft(key, { presetTeacherId: 7 })).not.toBeNull()
  })

  it('refuses a snapshot written by an older shape of the form', () => {
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...SNAPSHOT, version: 0, savedAt: new Date().toISOString() }),
    )

    expect(readPlanDraft(key)).toBeNull()
  })

  it('survives a corrupted entry rather than taking the page down', () => {
    window.localStorage.setItem(key, 'not json at all')

    expect(readPlanDraft(key)).toBeNull()
    expect(window.localStorage.getItem(key)).toBeNull()
  })

  it('clears on demand', () => {
    writePlanDraft(key, SNAPSHOT)
    clearPlanDraft(key)

    expect(readPlanDraft(key)).toBeNull()
  })
})

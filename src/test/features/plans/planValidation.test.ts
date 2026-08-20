import { describe, expect, it } from 'vitest'

import { buildBlankDraft, buildIndicatorDraft } from '@/features/plans/lib/planDraft'
import {
  COMMITMENTS_ANCHOR_ID,
  commitmentFieldId,
  COURSES_ANCHOR_ID,
  planFormErrors,
} from '@/features/plans/lib/planValidation'
import type { DraftCourse, DraftItem, PlanAspect } from '@/features/plans/types'

const ASPECTS: PlanAspect[] = [
  { aspect: 1, label: 'Desarrollo de Conocimiento', dimension: 'Dimensión 1' },
  { aspect: 2, label: 'Desempeño Docente', dimension: 'Dimensión 2' },
]

function filled(aspect: number, overrides: Partial<DraftItem> = {}): DraftItem {
  return {
    ...buildBlankDraft(aspect),
    description: 'Metodología',
    commitment: 'Rediseñar las guías',
    ...overrides,
  }
}

const COURSES: DraftCourse[] = [
  {
    key: 'group:11',
    origin: 'auto',
    academic_group_id: 11,
    course_name: 'Cálculo I',
    course_code: '1155201',
    group_name: 'A',
    order: 0,
  },
]

function errorsOf(overrides: Partial<Parameters<typeof planFormErrors>[0]> = {}) {
  return planFormErrors({
    isEdit: false,
    actaLocked: false,
    teacherId: 7,
    periodId: 2,
    title: 'Plan de mejoramiento',
    items: [filled(1)],
    aspects: ASPECTS,
    courses: COURSES,
    facultyName: 'Facultad de Ingeniería',
    departmentName: 'Departamento de Sistemas',
    programName: 'Ingeniería de Sistemas',
    actaNumber: '012',
    actaDate: '2026-03-04',
    ...overrides,
  })
}

describe('planFormErrors', () => {
  it('says nothing about a form that is already complete', () => {
    expect(errorsOf()).toEqual([])
  })

  it('asks for the period before the teacher, which is the order they are read in', () => {
    const errors = errorsOf({ teacherId: undefined, periodId: undefined })

    expect(errors.map((error) => error.id).slice(0, 2)).toEqual(['period', 'teacher'])
  })

  it('leaves docente and periodo out when editing: they are what the plan is', () => {
    const errors = errorsOf({ isEdit: true, teacherId: undefined, periodId: undefined })

    expect(errors).toEqual([])
  })

  it('lists the fields of a commitment in the order the card lays them out', () => {
    const empty = buildBlankDraft(1)
    const errors = errorsOf({ items: [empty] })

    expect(errors.map((error) => error.id)).toEqual([
      commitmentFieldId.description(empty.key),
      commitmentFieldId.commitment(empty.key),
    ])
  })

  it('asks for the meta esperada only where there is a score to reach', () => {
    const measurable = buildIndicatorDraft(
      {
        target_type: 'DIMENSION',
        target_ref: 'Desempeño Docente',
        label: 'Desempeño Docente',
        average: 3.1,
        aspect: 2,
        suggestions: [],
      },
      null,
    )

    const errors = errorsOf({
      items: [{ ...measurable, description: 'Desempeño', commitment: 'Tutorías' }],
    })

    expect(errors.map((error) => error.id)).toEqual([commitmentFieldId.target(measurable.key)])
    // A qualitative one has no meta esperada field at all, so none is asked for.
    expect(errorsOf({ items: [filled(1)] })).toEqual([])
  })

  it('walks the commitments aspect by aspect, and the loose ones last', () => {
    const second = buildBlankDraft(2)
    const first = buildBlankDraft(1)
    const loose = { ...buildBlankDraft(1), aspect: null }

    const errors = errorsOf({ items: [second, loose, first] })

    expect(errors.map((error) => error.id)).toEqual([
      commitmentFieldId.description(first.key),
      commitmentFieldId.commitment(first.key),
      commitmentFieldId.description(second.key),
      commitmentFieldId.commitment(second.key),
      commitmentFieldId.aspect(loose.key),
      commitmentFieldId.description(loose.key),
      commitmentFieldId.commitment(loose.key),
    ])
  })

  it('asks for at least one commitment before anything else in the section', () => {
    const errors = errorsOf({ items: [] })

    expect(errors[0].id).toBe(COMMITMENTS_ANCHOR_ID)
  })

  it('asks for an asignatura once the commitments are settled, not before', () => {
    const empty = buildBlankDraft(1)
    const errors = errorsOf({ items: [empty], courses: [] })

    expect(errors.map((error) => error.id)).toEqual([
      commitmentFieldId.description(empty.key),
      commitmentFieldId.commitment(empty.key),
      COURSES_ANCHOR_ID,
    ])
  })

  it('leaves the asignaturas alone while there is no docente to have taught any', () => {
    expect(errorsOf({ teacherId: undefined, courses: [] }).map((error) => error.id)).toEqual([
      'teacher',
    ])
  })

  it('walks the datos del plan in the order the section prints them', () => {
    const errors = errorsOf({
      title: '  ',
      facultyName: '',
      departmentName: '',
      programName: '',
      actaNumber: '',
      actaDate: '',
    })

    expect(errors.map((error) => error.id)).toEqual([
      'title',
      'faculty',
      'department',
      'program',
      'acta-number',
      'acta-date',
    ])
  })

  it('asks for nothing the signed acta would refuse anyway', () => {
    const errors = errorsOf({ actaLocked: true, isEdit: true, items: [], courses: [] })

    expect(errors).toEqual([])
  })

  it('still asks a locked acta for the header of the format, which it does not own', () => {
    const errors = errorsOf({
      actaLocked: true,
      isEdit: true,
      facultyName: '',
      actaNumber: '',
      actaDate: '',
    })

    expect(errors.map((error) => error.id)).toEqual(['faculty'])
  })

  it('keeps the title ahead of the header columns, where the form prints it', () => {
    const errors = errorsOf({ title: '   ', items: [] })

    expect(errors.at(-1)).toEqual({ id: 'title', message: 'El plan necesita un título.' })
  })
})

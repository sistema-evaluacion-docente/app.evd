import { describe, expect, it } from 'vitest'

import {
  alertComments,
  contextComments,
  hasFindings,
  hiddenWeakCourses,
  indicatorLabel,
} from '@/features/plans/lib/verification'
import type {
  PlanVerification,
  PlanVerificationComment,
  PlanVerificationCourse,
  PlanVerificationItem,
} from '@/features/plans/types'

function course(overrides: Partial<PlanVerificationCourse> = {}): PlanVerificationCourse {
  return {
    id: 1,
    academic_group_id: 41,
    course_name: 'POO I',
    course_code: '1155',
    group_name: 'A',
    result_value: 2.4,
    met: false,
    ...overrides,
  }
}

function item(overrides: Partial<PlanVerificationItem> = {}): PlanVerificationItem {
  return {
    id: 1,
    item_id: 10,
    target_type: 'QUESTION',
    target_ref: '011',
    target_value: 3.5,
    result_value: 3.6,
    met: true,
    courses: [],
    ...overrides,
  }
}

function comment(overrides: Partial<PlanVerificationComment> = {}): PlanVerificationComment {
  return {
    id: 1,
    item_id: 10,
    comment_id: 100,
    original_text: 'Llega tarde a clase',
    pedagogical_category_id: 9,
    category_name: 'Puntualidad',
    risk_level_name: 'ALTO',
    is_alert: true,
    ...overrides,
  }
}

function verification(overrides: Partial<PlanVerification> = {}): PlanVerification {
  return {
    id: 1,
    plan_id: 7,
    period_id: 2,
    period_code: '2025-2',
    result: 'MEJORO',
    scores_verified_at: '2026-01-15T10:00:00Z',
    comments_verified_at: null,
    items: [],
    comment_findings: [],
    created_at: null,
    ...overrides,
  }
}

describe('indicatorLabel', () => {
  it('reads a question by its text, not its code', () => {
    expect(indicatorLabel('QUESTION', '011')).toBe('Asiste puntualmente a clase.')
  })

  it('falls back to the code for a question the catalogue does not know', () => {
    expect(indicatorLabel('QUESTION', '999')).toBe('999')
  })

  it('names a dimension by itself', () => {
    expect(indicatorLabel('DIMENSION', 'Desempeño Docente')).toBe('Desempeño Docente')
  })

  it('names the overall average without a ref', () => {
    expect(indicatorLabel('OVERALL_AVERAGE', null)).toBe('Promedio general')
  })
})

describe('hiddenWeakCourses', () => {
  it('finds the subject the overall average hides', () => {
    const weak = course({ id: 1, course_name: 'POO I', met: false })
    const fine = course({ id: 2, course_name: 'Estructuras', result_value: 4.6, met: true })

    const hidden = hiddenWeakCourses(
      verification({ items: [item({ met: true, courses: [weak, fine] })] }),
    )

    expect(hidden).toHaveLength(1)
    expect(hidden[0].course.course_name).toBe('POO I')
  })

  it('says nothing about the courses of a target that was missed outright', () => {
    // The indicator already failed on its own; the breakdown would only repeat
    // the same bad news.
    const hidden = hiddenWeakCourses(
      verification({ items: [item({ met: false, courses: [course()] })] }),
    )

    expect(hidden).toEqual([])
  })

  it('ignores an indicator the period had no grades for', () => {
    const hidden = hiddenWeakCourses(
      verification({ items: [item({ met: null, result_value: null, courses: [course()] })] }),
    )

    expect(hidden).toEqual([])
  })
})

describe('comment findings', () => {
  it('separates the high-risk alerts from the medium-risk context', () => {
    const high = comment({ id: 1, is_alert: true })
    const medium = comment({ id: 2, risk_level_name: 'MEDIO', is_alert: false })
    const found = verification({ comment_findings: [high, medium] })

    expect(alertComments(found)).toEqual([high])
    expect(contextComments(found)).toEqual([medium])
  })
})

describe('hasFindings', () => {
  it('is false on a verification that measured nothing', () => {
    expect(hasFindings(verification())).toBe(false)
  })

  it('is true as soon as one indicator was measured', () => {
    expect(hasFindings(verification({ items: [item()] }))).toBe(true)
  })

  it('is true when only comments came back', () => {
    expect(hasFindings(verification({ comment_findings: [comment()] }))).toBe(true)
  })
})

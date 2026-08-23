import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PlanVerification } from '@/features/plans/components/PlanVerification'
import type {
  PlanVerification as Verification,
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

function verification(overrides: Partial<Verification> = {}): Verification {
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

function comment(overrides: Partial<PlanVerificationComment> = {}): PlanVerificationComment {
  return {
    id: 1,
    item_id: 10,
    comment_id: 100,
    original_text: 'Sigue llegando tarde a clase',
    pedagogical_category_id: 9,
    category_name: 'Puntualidad',
    risk_level_name: 'ALTO',
    is_alert: true,
    ...overrides,
  }
}

describe('PlanVerification', () => {
  it('says the grades have not arrived instead of pretending there is a verdict', () => {
    render(<PlanVerification verification={null} verificationPeriodCode="2025-2" />)

    expect(screen.getByText(/Aún no se han cargado las notas de 2025-2/)).toBeInTheDocument()
  })

  it('explains a plan with no verification period at all', () => {
    render(<PlanVerification verification={null} verificationPeriodCode={null} />)

    expect(screen.getByText(/no tiene un periodo de verificación asignado/)).toBeInTheDocument()
  })

  it('shows the target next to what the new grades say', () => {
    render(
      <PlanVerification
        verification={verification({
          result: 'NO_MEJORO',
          items: [item({ met: false, result_value: 2.9 })],
        })}
        verificationPeriodCode="2025-2"
      />,
    )

    expect(screen.getByText('Asiste puntualmente a clase.')).toBeInTheDocument()
    expect(screen.getByText('No alcanzada')).toBeInTheDocument()
    expect(screen.getByText('3.50')).toBeInTheDocument()
    expect(screen.getByText('2.90')).toBeInTheDocument()
    expect(screen.getByText('No mejoró')).toBeInTheDocument()
  })

  it('does not read a missing grade as a broken commitment', () => {
    render(
      <PlanVerification
        verification={verification({
          result: 'SIN_DATOS',
          items: [item({ met: null, result_value: null })],
        })}
        verificationPeriodCode="2025-2"
      />,
    )

    expect(screen.getByText('Sin notas')).toBeInTheDocument()
    expect(screen.queryByText('No alcanzada')).not.toBeInTheDocument()
  })

  it('warns about the subject the overall average hides', () => {
    render(
      <PlanVerification
        verification={verification({
          items: [
            item({
              met: true,
              courses: [
                course({ id: 1, course_name: 'POO I', met: false }),
                course({ id: 2, course_name: 'Estructuras', result_value: 4.6, met: true }),
              ],
            }),
          ],
        })}
        verificationPeriodCode="2025-2"
      />,
    )

    expect(screen.getByText(/sigue bajo en una asignatura/)).toBeInTheDocument()
    expect(screen.getByText('Mejoró')).toBeInTheDocument()
  })

  it('prints the high-risk comments and counts the medium ones as context', () => {
    render(
      <PlanVerification
        verification={verification({
          comment_findings: [
            comment(),
            comment({ id: 2, comment_id: 101, risk_level_name: 'MEDIO', is_alert: false }),
          ],
        })}
        verificationPeriodCode="2025-2"
      />,
    )

    expect(screen.getByText('Sigue llegando tarde a clase')).toBeInTheDocument()
    expect(screen.getByText(/1 comentario de riesgo medio en Puntualidad/)).toBeInTheDocument()
  })

  it('states that it does not touch the closing', () => {
    render(<PlanVerification verification={verification()} verificationPeriodCode="2025-2" />)

    expect(
      screen.getByText(/No modifica el resultado con el que se cerró el plan/),
    ).toBeInTheDocument()
  })
})

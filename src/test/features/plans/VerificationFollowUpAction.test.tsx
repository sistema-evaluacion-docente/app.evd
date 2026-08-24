import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetPlans } from '@/features/plans/api'
import { VerificationFollowUpAction } from '@/features/plans/components/VerificationFollowUpAction'
import type { Plan, PlanIndicators, PlanVerification } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({ useGetPlans: vi.fn() }))

/** The semester the verification measured — where the follow-up plan belongs. */
const VERIFICATION_PERIOD = '2025-2'

const catalogue: PlanIndicators = {
  threshold: 3.5,
  aspects: [{ aspect: 2, label: 'Desempeño Docente', dimension: 'Desempeño Docente' }],
  overall: { target_type: 'OVERALL_AVERAGE', target_ref: null, label: 'General', suggestions: [] },
  dimensions: [
    {
      dimension: 'Desempeño Docente',
      target_type: 'DIMENSION',
      target_ref: 'Desempeño Docente',
      label: 'Desempeño Docente',
      suggestions: [],
      questions: [
        {
          target_type: 'QUESTION',
          target_ref: '011',
          code: '011',
          text: 'Asiste puntualmente a clase.',
          suggestions: [],
        },
      ],
    },
  ],
}

function verification(overrides: Partial<PlanVerification> = {}): PlanVerification {
  return {
    id: 1,
    plan_id: 7,
    period_id: 2,
    period_code: VERIFICATION_PERIOD,
    result: 'NO_MEJORO',
    scores_verified_at: '2026-01-15T10:00:00Z',
    comments_verified_at: null,
    items: [
      {
        id: 1,
        item_id: 10,
        target_type: 'QUESTION',
        target_ref: '011',
        target_value: 3.5,
        result_value: 3.1,
        met: false,
        courses: [],
      },
    ],
    comment_findings: [
      {
        id: 1,
        item_id: 10,
        comment_id: 4821,
        original_text: 'Sigue sin resolver dudas',
        pedagogical_category_id: 9,
        category_name: 'Acompañamiento',
        risk_level_name: 'ALTO',
        is_alert: true,
      },
    ],
    created_at: null,
    ...overrides,
  }
}

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 7,
    teacher_id: 42,
    title: 'Plan de mejoramiento',
    origin_period_code: '2025-1',
    verification_period_code: VERIFICATION_PERIOD,
    status: 'CERRADO_NO_CUMPLIDO',
    verification: verification(),
    ...overrides,
  } as unknown as Plan
}

function renderAction({
  plans = [],
  isPending = false,
  target = plan(),
}: { plans?: Plan[]; isPending?: boolean; target?: Plan } = {}) {
  vi.mocked(useGetPlans).mockReturnValue({
    data: isPending ? undefined : { data: plans },
    isPending,
  } as unknown as ReturnType<typeof useGetPlans>)

  const { hook, history } = memoryLocation({ path: '/planes/7', record: true })

  const { container } = render(
    <Router hook={hook}>
      <VerificationFollowUpAction plan={target} catalogue={catalogue} />
    </Router>,
  )

  return { container, history }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('VerificationFollowUpAction', () => {
  it('starts the next semester’s plan carrying what the teacher fell back on', async () => {
    const user = userEvent.setup()
    const { history } = renderAction()

    await user.click(screen.getByRole('button', { name: /Crear plan de mejoramiento/ }))

    expect(history[history.length - 1]).toBe(
      '/planes/nuevo?teacher=42&period_code=2025-2&picks=q%3A011%2Cc%3A4821',
    )
  })

  it('files the plan on the verification period, not on the one that failed', async () => {
    const user = userEvent.setup()
    const { history } = renderAction()

    await user.click(screen.getByRole('button', { name: /Crear plan de mejoramiento/ }))

    expect(history[history.length - 1]).toContain('period_code=2025-2')
    expect(history[history.length - 1]).not.toContain('2025-1')
  })

  it('points at the plan the semester already has instead of offering a second one', async () => {
    const user = userEvent.setup()
    const { history } = renderAction({
      plans: [plan({ id: 12, origin_period_code: VERIFICATION_PERIOD })],
    })

    expect(
      screen.queryByRole('button', { name: /Crear plan de mejoramiento/ }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: `Ver plan de ${VERIFICATION_PERIOD}` }))

    expect(history[history.length - 1]).toBe('/planes/12')
  })

  it('waits for the answer before offering anything', () => {
    // A teacher whose plans are still on their way looks exactly like one who
    // never had any, and a plan per semester is the rule.
    const { container } = renderAction({ isPending: true })

    expect(container).toBeEmptyDOMElement()
  })

  it('offers nothing without a verification period to file the plan on', () => {
    const { container } = renderAction({
      target: plan({ verification: null, verification_period_code: null }),
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('still opens the form when nothing could be preselected', async () => {
    const user = userEvent.setup()
    const { history } = renderAction({
      target: plan({ verification: { ...verification(), items: [], comment_findings: [] } }),
    })

    await user.click(screen.getByRole('button', { name: /Crear plan de mejoramiento/ }))

    expect(history[history.length - 1]).toBe('/planes/nuevo?teacher=42&period_code=2025-2')
  })
})

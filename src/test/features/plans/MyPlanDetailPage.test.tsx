import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useDownloadDocument, useGetMyPlans, useGetPlanIndicators } from '@/features/plans/api'
import MyPlanDetailPage from '@/features/plans/pages/MyPlanDetailPage'
import type { Plan, PlanDocument } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useGetMyPlans: vi.fn(),
  useGetPlanIndicators: vi.fn(),
  useDownloadDocument: vi.fn(),
}))

/**
 * The follow-ups and the evidence have their own suites; what is under test
 * here is which official forms the teacher is offered.
 */
vi.mock('@/features/plans/components/PlanCheckpoints', () => ({
  PlanCheckpoints: () => null,
}))

vi.mock('@/features/plans/components/PlanEvidences', () => ({
  PlanEvidences: () => null,
}))

function document(format: PlanDocument['format_type']): PlanDocument {
  return {
    id: 1,
    plan_id: 1,
    format_type: format,
    has_generated: true,
    has_signed: true,
  } as unknown as PlanDocument
}

function mockPlan(plan?: Plan) {
  vi.mocked(useGetMyPlans).mockReturnValue({
    data: { data: plan ? [plan] : [] },
    isPending: false,
  } as unknown as ReturnType<typeof useGetMyPlans>)

  vi.mocked(useGetPlanIndicators).mockReturnValue({
    data: { data: { aspects: [], threshold: 3.5, dimensions: [] } },
  } as unknown as ReturnType<typeof useGetPlanIndicators>)

  vi.mocked(useDownloadDocument).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDownloadDocument>)
}

function plan(documents: PlanDocument[]): Plan {
  return {
    id: 5,
    title: 'Plan de Ada',
    status: 'EN_SEGUIMIENTO',
    acta_status: 'FIRMADA',
    progress: 40,
    items: [],
    checkpoints: [],
    evidences: [],
    courses: [],
    documents,
  } as unknown as Plan
}

function renderAt(path = '/mis-planes/5') {
  const { hook } = memoryLocation({ path })

  return render(
    <Router hook={hook}>
      <MyPlanDetailPage />
    </Router>,
  )
}

describe('MyPlanDetailPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('never offers the teacher the Formato 1: it is the department’s own case file', () => {
    mockPlan(plan([document('FORMATO_1'), document('FORMATO_2')]))

    renderAt()

    expect(screen.queryByText(/Formato 1/)).not.toBeInTheDocument()
    expect(screen.getByText(/Formato 2/)).toBeInTheDocument()
  })

  it('drops the documents section entirely when only the Formato 1 exists', () => {
    mockPlan(plan([document('FORMATO_1')]))

    renderAt()

    expect(screen.queryByRole('heading', { name: 'Documentos' })).not.toBeInTheDocument()
  })

  it('says so when the id does not belong to one of the teacher’s plans', () => {
    mockPlan(plan([document('FORMATO_2')]))

    renderAt('/mis-planes/999')

    expect(screen.getByRole('alert')).toHaveTextContent(/No encontramos este plan/)
  })
})

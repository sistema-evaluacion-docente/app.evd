import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import {
  useDownloadDocument,
  useDownloadSignedDocument,
  useGetMyPlans,
  useGetPlanIndicators,
  usePreviewSignedDocument,
} from '@/features/plans/api'
import MyPlanDetailPage from '@/features/plans/pages/MyPlanDetailPage'
import type { Plan, PlanDocument } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useGetMyPlans: vi.fn(),
  useGetPlanIndicators: vi.fn(),
  useDownloadDocument: vi.fn(),
  useDownloadSignedDocument: vi.fn(),
  usePreviewSignedDocument: vi.fn(),
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

function document(
  format: PlanDocument['format_type'],
  overrides: Partial<PlanDocument> = {},
): PlanDocument {
  return {
    id: 1,
    plan_id: 1,
    format_type: format,
    has_generated: true,
    has_signed: true,
    signed_at: '2026-03-04T10:00:00Z',
    signed_filename: 'acta-012.pdf',
    ...overrides,
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
    mutate: downloadGenerated,
    isPending: false,
  } as unknown as ReturnType<typeof useDownloadDocument>)

  vi.mocked(useDownloadSignedDocument).mockReturnValue({
    mutate: downloadSigned,
    isPending: false,
  } as unknown as ReturnType<typeof useDownloadSignedDocument>)

  vi.mocked(usePreviewSignedDocument).mockReturnValue({
    mutate: previewSigned,
    isPending: false,
  } as unknown as ReturnType<typeof usePreviewSignedDocument>)
}

const downloadGenerated = vi.fn()
const downloadSigned = vi.fn()
const previewSigned = vi.fn()

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

  it('hands over the signed copy, to read and to keep', async () => {
    // The signed scan is what the plan actually is; the generated PDF is only
    // the draft it was printed from.
    mockPlan(plan([document('FORMATO_2')]))

    renderAt()

    expect(screen.getByText('Firmado')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Descargar' }))

    expect(downloadSigned).toHaveBeenCalledWith({
      format: 'formato-2',
      filename: 'acta-012.pdf',
    })
    expect(downloadGenerated).not.toHaveBeenCalled()
  })

  it('opens the signed copy in a tab of its own', async () => {
    mockPlan(plan([document('FORMATO_2')]))

    renderAt()

    await userEvent.click(screen.getByRole('button', { name: 'Ver' }))

    expect(previewSigned).toHaveBeenCalled()
    expect(previewSigned.mock.calls[0][0]).toBe('formato-2')
  })

  it('falls back to the generated form while nothing has been signed yet', async () => {
    mockPlan(plan([document('FORMATO_3', { has_signed: false, signed_at: null })]))

    renderAt()

    expect(screen.queryByText('Firmado')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Descargar' }))
    expect(downloadGenerated).toHaveBeenCalledWith('formato-3')
  })

  it('shows a form that is only signed, never generated', () => {
    // The director can attach a scan without the system having rendered a PDF
    // first; leaving it out would hide the very document that matters.
    mockPlan(plan([document('FORMATO_2', { has_generated: false })]))

    renderAt()

    expect(screen.getByText(/Formato 2/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument()
  })

  it('says when it was signed', () => {
    mockPlan(plan([document('FORMATO_2')]))

    renderAt()

    expect(screen.getByText(/Firmado el/)).toBeInTheDocument()
  })

  it('says so when the id does not belong to one of the teacher’s plans', () => {
    mockPlan(plan([document('FORMATO_2')]))

    renderAt('/mis-planes/999')

    expect(screen.getByRole('alert')).toHaveTextContent(/No encontramos este plan/)
  })
})

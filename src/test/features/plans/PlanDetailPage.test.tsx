import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetPlan, useGetPlanIndicators } from '@/features/plans/api'
import PlanDetailPage from '@/features/plans/pages/PlanDetailPage'
import type { Plan, PlanAspect, PlanItem } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useGetPlan: vi.fn(),
  useGetPlanIndicators: vi.fn(),
}))

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { roles: ['DIRECTOR DE DEPARTAMENTO'] } }),
}))

// The panels below the commitments have their own tests; stubbed here so this
// one stays on what the page itself decides to show.
vi.mock('@/features/plans/components/PlanCheckpoints', () => ({
  PlanCheckpoints: () => <div data-testid="checkpoints" />,
}))
vi.mock('@/features/plans/components/PlanActa', () => ({
  PlanActa: () => <div data-testid="acta" />,
}))
vi.mock('@/features/plans/components/PlanEvidences', () => ({
  PlanEvidences: () => <div data-testid="evidences" />,
}))
vi.mock('@/features/plans/components/PlanDocuments', () => ({
  PlanDocuments: () => <div data-testid="documents" />,
}))
vi.mock('@/features/plans/components/PlanClosure', () => ({
  PlanClosure: () => <div data-testid="closure" />,
  PlanClosedSummary: () => <div data-testid="closed-summary" />,
}))

const ASPECTS: PlanAspect[] = [
  { aspect: 1, label: 'Desarrollo de Conocimiento', dimension: 'Dimensión 1' },
  { aspect: 2, label: 'Desempeño Docente', dimension: 'Dimensión 2' },
  { aspect: 3, label: 'Procesos de Evaluación', dimension: 'Dimensión 3' },
  { aspect: 4, label: 'Integración Interpersonal', dimension: 'Dimensión 4' },
  { aspect: 5, label: 'Observaciones de los Estudiantes', dimension: null },
]

function item(id: number, aspect: number | null, description: string): PlanItem {
  return {
    id,
    aspect,
    description,
    commitment: 'Un compromiso',
    status: 'PENDIENTE',
    baseline_value: null,
    target_value: null,
    result_value: null,
    comments: [],
  } as unknown as PlanItem
}

function mockPlan(items: PlanItem[], overrides: Partial<Plan> = {}) {
  vi.mocked(useGetPlan).mockReturnValue({
    data: {
      data: {
        id: 7,
        title: 'Plan de mejoramiento',
        teacher_name: 'Ada Lovelace',
        status: 'EN_SEGUIMIENTO',
        acta_status: 'BORRADOR',
        progress: 40,
        items,
        courses: [],
        checkpoints: [],
        documents: [],
        ...overrides,
      } as unknown as Plan,
    },
    isPending: false,
  } as unknown as ReturnType<typeof useGetPlan>)

  vi.mocked(useGetPlanIndicators).mockReturnValue({
    data: { data: { threshold: 3.5, aspects: ASPECTS } },
  } as unknown as ReturnType<typeof useGetPlanIndicators>)
}

function renderPage() {
  const { hook } = memoryLocation({ path: '/planes/7' })

  return render(
    <Router hook={hook}>
      <PlanDetailPage />
    </Router>,
  )
}

describe('PlanDetailPage · compromisos', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows only the aspects that were actually committed to', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas'), item(2, 3, 'Retroalimenta tarde')])

    renderPage()

    expect(screen.getByText('Desarrollo de Conocimiento')).toBeInTheDocument()
    expect(screen.getByText('Procesos de Evaluación')).toBeInTheDocument()
    expect(screen.queryByText('Desempeño Docente')).not.toBeInTheDocument()
    expect(screen.queryByText('Integración Interpersonal')).not.toBeInTheDocument()
    expect(screen.queryByText('Observaciones de los Estudiantes')).not.toBeInTheDocument()
  })

  it('never prints the empty-aspect placeholder any more', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')])

    renderPage()

    expect(screen.queryByText('Sin compromisos.')).not.toBeInTheDocument()
  })

  it('counts the committed aspects against the five of the form', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas'), item(2, 3, 'Retroalimenta tarde')])

    renderPage()

    expect(screen.getByText('2 de 5 aspectos con compromisos.')).toBeInTheDocument()
  })

  it('surfaces commitments left without an aspect instead of dropping them', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas'), item(2, null, 'Compromiso suelto')])

    renderPage()

    expect(screen.getByText('Sin aspecto asignado')).toBeInTheDocument()
    expect(screen.getByText('Compromiso suelto')).toBeInTheDocument()
  })

  it('explains an empty plan rather than showing five empty aspects', () => {
    mockPlan([])

    renderPage()

    expect(
      screen.getByText('Este plan todavía no tiene compromisos registrados.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Desarrollo de Conocimiento')).not.toBeInTheDocument()
  })
})

/** The signed Ficha de acuerdo, which is what settles the agreement. */
const SIGNED_ACTA = [
  { format_type: 'FORMATO_2', has_signed: true, has_generated: true },
] as unknown as Plan['documents']

describe('PlanDetailPage · editar el plan', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ofrece editar mientras el acuerdo no esté firmado', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')])

    renderPage()

    expect(screen.getByRole('link', { name: /Editar/ })).toHaveAttribute(
      'href',
      '/planes/7/editar',
    )
  })

  it('deja de ofrecerlo en cuanto la ficha firmada está subida', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')], {
      documents: SIGNED_ACTA,
      acta_status: 'FIRMADA',
      acta_locked: true,
    })

    renderPage()

    expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument()
  })

  it('tampoco lo ofrece con el plan ya cerrado', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')], { status: 'CERRADO_CUMPLIDO' })

    renderPage()

    expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument()
  })

  it('cambia el panel de cierre por el resumen cuando el plan ya está cerrado', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')], { status: 'CERRADO_CUMPLIDO' })

    renderPage()

    expect(screen.getByTestId('closed-summary')).toBeInTheDocument()
    expect(screen.queryByTestId('closure')).not.toBeInTheDocument()
  })
})

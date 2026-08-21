import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetPlan, useGetPlanIndicators } from '@/features/plans/api'
import PlanDetailPage from '@/features/plans/pages/PlanDetailPage'
import type {
  Plan,
  PlanAspect,
  PlanCheckpoint,
  PlanDocument,
  PlanItem,
} from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useGetPlan: vi.fn(),
  useGetPlanIndicators: vi.fn(),
  useDeletePlan: () => mockDelete,
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

/** Shared so a test can assert what the confirmation ends up calling. */
const mockDelete = { mutate: vi.fn(), isPending: false }

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

/** The signed Ficha de acuerdo, which is what settles the agreement. */
const SIGNED_ACTA = [
  { format_type: 'FORMATO_2', has_signed: true, has_generated: true },
] as unknown as PlanDocument[]

/** A first cut already on the record, which is what moves the progress bar. */
const FIRST_CHECKPOINT = [
  { stage: 'PRIMER_SEGUIMIENTO', scheduled_date: '2026-05-04', aspect_notes: [] },
] as unknown as PlanCheckpoint[]

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

describe('PlanDetailPage · editar el plan', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ofrece editar mientras el acuerdo no esté firmado', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')])

    renderPage()

    expect(screen.getByRole('link', { name: /Editar/ })).toHaveAttribute('href', '/planes/7/editar')
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

describe('PlanDetailPage · la cabecera del plan', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lleva el acto administrativo arriba, con la identidad del plan', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')], {
      acta_number: '012',
      acta_date: '2026-03-03',
    })

    renderPage()

    const acta = screen.getByText(/Acta N\.º/)

    expect(acta).toHaveTextContent('012')
    expect(acta).toHaveTextContent('3 de marzo de 2026')
  })

  it('ya no le dedica una sección propia al acta', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')], { acta_number: '012' })

    renderPage()

    expect(screen.queryByText('Acto administrativo')).not.toBeInTheDocument()
  })

  it('no deja un renglón vacío cuando no hay acta que mostrar', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')])

    renderPage()

    expect(screen.queryByText(/Acta N\.º/)).not.toBeInTheDocument()
  })

  it('dice el avance en número, no sólo con la barra', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')], {
      documents: SIGNED_ACTA,
      checkpoints: FIRST_CHECKPOINT,
    })

    renderPage()

    // Acuerdo firmado + primer seguimiento: dos de los cuatro hitos del plan.
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('cuenta los hitos del plan, no el cumplimiento que la API deja en cero', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')], {
      progress: 0,
      documents: SIGNED_ACTA,
      checkpoints: [],
    })

    renderPage()

    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })
})

describe('PlanDetailPage · eliminar el plan', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ofrece eliminarlo junto a editar', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')])

    renderPage()

    expect(screen.getByRole('button', { name: /Eliminar/ })).toBeInTheDocument()
  })

  it('sigue ofreciéndolo con el acuerdo firmado, que ya no deja editar', () => {
    mockPlan([item(1, 1, 'Expresa sus ideas')], { documents: SIGNED_ACTA })

    renderPage()

    // Un plan hecho al docente equivocado tiene que poder deshacerse; la firma
    // no arregla el error, solo lo pone en vigencia.
    expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Eliminar/ })).toBeInTheDocument()
  })

  it('avisa de lo que se pierde antes de borrar nada', async () => {
    const user = userEvent.setup()
    mockPlan([item(1, 1, 'Expresa sus ideas')])

    renderPage()

    await user.click(screen.getByRole('button', { name: /Eliminar/ }))

    expect(await screen.findByText(/¿Eliminar el plan de mejoramiento\?/)).toBeInTheDocument()
    expect(screen.getByText(/no se puede deshacer/)).toBeInTheDocument()
    expect(mockDelete.mutate).not.toHaveBeenCalled()
  })

  it('subraya que el acuerdo está firmado cuando lo está', async () => {
    const user = userEvent.setup()
    mockPlan([item(1, 1, 'Expresa sus ideas')], { documents: SIGNED_ACTA })

    renderPage()

    await user.click(screen.getByRole('button', { name: /Eliminar/ }))

    expect(await screen.findByText(/está en vigencia/)).toBeInTheDocument()
  })

  it('borra solo al confirmar', async () => {
    const user = userEvent.setup()
    mockPlan([item(1, 1, 'Expresa sus ideas')])

    renderPage()

    await user.click(screen.getByRole('button', { name: /Eliminar/ }))
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }))

    expect(mockDelete.mutate).toHaveBeenCalledWith(7, expect.anything())
  })
})

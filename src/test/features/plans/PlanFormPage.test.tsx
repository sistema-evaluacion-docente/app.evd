import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import {
  useCreatePlan,
  useGetPlan,
  useGetPlanCandidates,
  useGetPlanIndicators,
  useGetPlanPeriods,
  useUpdatePlan,
} from '@/features/plans/api'
import { usePlanWorkbench } from '@/features/plans/hooks/usePlanWorkbench'
import PlanFormPage from '@/features/plans/pages/PlanFormPage'
import type { Plan, PlanCandidate, PlanIndicators, PlanPeriod } from '@/features/plans/types'

/**
 * The page is driven entirely by the feature's query hooks, so they are mocked
 * to place it in each loading state on purpose. What is under test is what the
 * director sees while the requests are in flight, not the query layer.
 */
vi.mock('@/features/plans/api', () => ({
  useCreatePlan: vi.fn(),
  useGetPlan: vi.fn(),
  useGetPlanCandidates: vi.fn(),
  useGetPlanIndicators: vi.fn(),
  useGetPlanPeriods: vi.fn(),
  useUpdatePlan: vi.fn(),
}))

vi.mock('@/features/plans/hooks/usePlanWorkbench', () => ({
  usePlanWorkbench: vi.fn(),
}))

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { department_name: 'Ingeniería de Sistemas' } }),
}))

const PERIODS: PlanPeriod[] = [
  { id: 2, code: '2025-1', name: '2025-1' },
  { id: 1, code: '2024-2', name: '2024-2' },
]

const ASPECT_LABELS = [
  'Planeación del curso',
  'Desarrollo de la clase',
  'Evaluación del aprendizaje',
  'Relaciones interpersonales',
  'Observaciones de los Estudiantes',
]

const INDICATORS = {
  threshold: 3.5,
  aspects: ASPECT_LABELS.map((label, index) => ({
    aspect: index + 1,
    label,
    dimension: index < 4 ? `Dimensión ${index + 1}` : null,
  })),
  overall: { target_type: 'OVERALL_AVERAGE', target_ref: null, label: 'General', suggestions: [] },
  dimensions: [],
} as PlanIndicators

const CANDIDATE: PlanCandidate = {
  teacher_id: 7,
  name: 'Ada Lovelace',
  avatar_url: null,
  institutional_code: '1150123',
  overall_average: 3.1,
  below_threshold: true,
  has_plan: false,
  dimensions: [],
  weak_dimensions: [],
  weak_questions: [],
  overall_suggestions: [],
}

/** Only the fields the page reads matter; the rest of the query is irrelevant. */
function mockQueries({
  periodsLoading = false,
  indicatorsLoading = false,
  periodsFailed = false,
  candidatesLoading = false,
  candidates = [CANDIDATE],
  plan,
  updateMutate = vi.fn(),
}: {
  periodsLoading?: boolean
  indicatorsLoading?: boolean
  periodsFailed?: boolean
  candidatesLoading?: boolean
  candidates?: PlanCandidate[]
  plan?: Plan
  updateMutate?: ReturnType<typeof vi.fn>
} = {}) {
  vi.mocked(useGetPlanPeriods).mockReturnValue({
    data: periodsLoading || periodsFailed ? undefined : { data: PERIODS },
    isLoading: periodsLoading,
    isError: periodsFailed,
  } as unknown as ReturnType<typeof useGetPlanPeriods>)

  vi.mocked(useGetPlanIndicators).mockReturnValue({
    data: indicatorsLoading ? undefined : { data: INDICATORS },
    isLoading: indicatorsLoading,
    isError: false,
  } as unknown as ReturnType<typeof useGetPlanIndicators>)

  vi.mocked(useGetPlanCandidates).mockReturnValue({
    data: candidatesLoading ? undefined : { data: candidates },
    isLoading: candidatesLoading,
  } as unknown as ReturnType<typeof useGetPlanCandidates>)

  vi.mocked(useCreatePlan).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreatePlan>)

  vi.mocked(useGetPlan).mockReturnValue({
    data: plan ? { data: plan } : undefined,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useGetPlan>)

  vi.mocked(useUpdatePlan).mockReturnValue({
    mutate: updateMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdatePlan>)

  vi.mocked(usePlanWorkbench).mockReturnValue({
    allSubjects: [],
    subjectOptions: [],
    activeSubject: null,
    effectiveSubjectKey: 'ALL',
    dimensions: [],
    comments: { byDimension: {}, uncategorized: [] },
    weakCount: 0,
    riskyCount: 0,
    aiStatus: 'ANALYZED',
    hasCommentData: false,
    isLoading: false,
  } as unknown as ReturnType<typeof usePlanWorkbench>)
}

function renderAt(ui: ReactNode, path = '/planes/nuevo') {
  const { hook } = memoryLocation({ path })

  return render(<Router hook={hook}>{ui}</Router>)
}

describe('PlanFormPage · creación', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('holds the whole form back until the periods and the aspects are in', () => {
    mockQueries({ periodsLoading: true, indicatorsLoading: true })

    renderAt(<PlanFormPage />)

    expect(screen.getByText(/Cargando el formulario del plan/)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Observaciones del Consejo/)).not.toBeInTheDocument()
  })

  it('waits for the aspects even when the periods already arrived', () => {
    mockQueries({ indicatorsLoading: true })

    renderAt(<PlanFormPage />)

    expect(screen.getByText(/Cargando el formulario del plan/)).toBeInTheDocument()
  })

  it('paints the five aspects together with the observations, never one without the other', () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    for (const label of ASPECT_LABELS) {
      expect(screen.getByRole('heading', { name: new RegExp(label) })).toBeInTheDocument()
    }

    expect(screen.getByLabelText(/Observaciones del Consejo/)).toBeInTheDocument()
  })

  it('says it is looking for the teachers instead of just going dead', () => {
    mockQueries({ candidatesLoading: true })

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    expect(teacher).toHaveTextContent('Cargando docentes…')
    expect(teacher).toBeDisabled()
    expect(teacher).toHaveAttribute('aria-busy', 'true')
  })

  it('explains an empty period on the trigger, where the disabled list cannot', () => {
    mockQueries({ candidates: [] })

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    expect(teacher).toHaveTextContent('Sin docentes evaluados en este periodo')
    expect(teacher).toBeDisabled()
  })

  it('lets the teacher be picked once the candidates are in', () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    expect(teacher).toBeEnabled()
    expect(teacher).toHaveTextContent('Selecciona un docente…')
  })

  it('holds the space of the indicators when it arrives with a teacher preselected', () => {
    mockQueries({ candidatesLoading: true })

    renderAt(<PlanFormPage />, '/planes/nuevo?teacher=7&period=2')

    expect(screen.getByText(/Cargando los indicadores del docente/)).toBeInTheDocument()
  })

  it('reports a broken shell instead of an empty form', () => {
    mockQueries({ periodsFailed: true })

    renderAt(<PlanFormPage />)

    expect(screen.getByRole('alert')).toHaveTextContent(/No fue posible cargar los periodos/)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})

/** A saved plan, reduced to the fields the form reads back. */
function savedPlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 8,
    teacher_id: 7,
    teacher_name: 'Ada Lovelace',
    origin_period_id: 2,
    origin_period_code: '2025-1',
    title: 'Plan de mejoramiento · Ada Lovelace · 2025-1',
    description: 'Acordado en consejo',
    program_name: 'Ingeniería de Sistemas',
    faculty_name: 'Ingeniería',
    department_name: 'Departamento de Sistemas',
    status: 'EN_SEGUIMIENTO',
    start_date: '2026-03-03',
    acta_number: '012',
    acta_date: '2026-03-03',
    acta_status: 'BORRADOR',
    acta_locked: false,
    council_observations: 'Sin observaciones',
    items: [
      {
        id: 41,
        plan_id: 8,
        description: 'Metodología — Álgebra (2.80)',
        commitment: 'Rediseñar las guías de clase',
        aspect: 1,
        target_type: 'DIMENSION',
        target_ref: 'Metodología',
        baseline_value: 2.8,
        target_value: 3.5,
        result_value: null,
        status: 'PENDIENTE',
        order: 0,
        comments: [],
      },
    ],
    checkpoints: [],
    evidences: [],
    courses: [],
    documents: [],
    case_report: null,
    evidence_count: 0,
    progress: 0,
    ...overrides,
  } as unknown as Plan
}

describe('PlanFormPage · edición', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fija docente y periodo: no son campos, son lo que el plan es', () => {
    mockQueries({ plan: savedPlan() })

    renderAt(<PlanFormPage />, '/planes/8/editar')

    expect(screen.queryByRole('combobox', { name: 'Docente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Periodo de origen' })).not.toBeInTheDocument()
    expect(screen.getByText('Docente').closest('p')).toHaveTextContent('Ada Lovelace')
    expect(screen.getByText('Periodo de origen').closest('p')).toHaveTextContent('2025-1')
  })

  it('devuelve los compromisos guardados al editor, con su compromiso', () => {
    mockQueries({ plan: savedPlan() })

    renderAt(<PlanFormPage />, '/planes/8/editar')

    expect(screen.getByDisplayValue('Metodología — Álgebra (2.80)')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rediseñar las guías de clase')).toBeInTheDocument()
  })

  it('conserva el id de cada compromiso, para no recrearlo y perder sus evidencias', async () => {
    const updateMutate = vi.fn()

    mockQueries({ plan: savedPlan(), updateMutate })

    renderAt(<PlanFormPage />, '/planes/8/editar')

    await userEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))

    const [payload] = updateMutate.mock.calls[0] as [Record<string, unknown>]

    expect(payload.items).toEqual([expect.objectContaining({ id: 41, status: 'PENDIENTE' })])
    expect(payload.acta_number).toBe('012')
    // The single date field feeds both: Formato 2 prints one, Formato 3 the other.
    expect(payload.start_date).toBe('2026-03-03')
    expect(payload.acta_date).toBe('2026-03-03')
  })

  it('con el acuerdo firmado no manda nada que el API vaya a rechazar', async () => {
    const updateMutate = vi.fn()

    mockQueries({ plan: savedPlan({ acta_locked: true, acta_status: 'FIRMADA' }), updateMutate })

    renderAt(<PlanFormPage />, '/planes/8/editar')

    await userEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))

    const [payload] = updateMutate.mock.calls[0] as [Record<string, unknown>]

    for (const locked of ['items', 'courses', 'acta_number', 'acta_date', 'council_observations']) {
      expect(payload).not.toHaveProperty(locked)
    }

    expect(payload.title).toBe('Plan de mejoramiento · Ada Lovelace · 2025-1')
    expect(payload.faculty_name).toBe('Ingeniería')
  })

  it('separa departamento de programa en vez de imprimir el mismo dos veces', () => {
    mockQueries({ plan: savedPlan() })

    renderAt(<PlanFormPage />, '/planes/8/editar')

    expect(screen.getByLabelText('Departamento académico')).toHaveValue('Departamento de Sistemas')
    expect(screen.getByLabelText('Programa académico')).toHaveValue('Ingeniería de Sistemas')
  })

  it('pide la fecha una sola vez: la del acta es la de inicio', () => {
    mockQueries({ plan: savedPlan() })

    renderAt(<PlanFormPage />, '/planes/8/editar')

    expect(screen.getByLabelText('Fecha del acta')).toBeInTheDocument()
    expect(screen.queryByLabelText('Fecha de inicio')).not.toBeInTheDocument()
  })
})

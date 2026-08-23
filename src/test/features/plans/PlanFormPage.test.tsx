import { render, screen, waitFor } from '@testing-library/react'
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
  useUploadPlanDocument,
} from '@/features/plans/api'
import { usePlanWorkbench } from '@/features/plans/hooks/usePlanWorkbench'
import { PLAN_DRAFT_MAX_AGE_MS, planDraftKey } from '@/features/plans/lib/planFormStorage'
import PlanFormPage from '@/features/plans/pages/PlanFormPage'
import { toast } from 'sonner'
import type {
  Plan,
  PlanCandidate,
  PlanIndicators,
  PlanPeriod,
  PlanSubjectOption,
} from '@/features/plans/types'

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
  useUploadPlanDocument: vi.fn(),
}))

vi.mock('@/features/plans/hooks/usePlanWorkbench', () => ({
  usePlanWorkbench: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}))

vi.mock('@/features/auth', () => ({
  ROLE: {
    ADMIN: 'ADMIN',
    TEACHER: 'DOCENTE',
    DEPARTMENT_DIRECTOR: 'DIRECTOR DE DEPARTAMENTO',
  },
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

/** Nothing under the threshold and no risky comment: no plan is suggested. */
const HEALTHY_CANDIDATE: PlanCandidate = {
  ...CANDIDATE,
  teacher_id: 9,
  name: 'Grace Hopper',
  institutional_code: '1150456',
  overall_average: 4.5,
  below_threshold: false,
}

/** What the evaluation report says the teacher taught. */
const SUBJECTS: PlanSubjectOption[] = [
  {
    key: 'group:11',
    label: 'Álgebra Lineal · Grupo A',
    course_name: 'Álgebra Lineal',
    course_code: '1155201',
    group_name: 'A',
    academic_group_id: 11,
  },
  {
    key: 'group:12',
    label: 'Cálculo I · Grupo B',
    course_name: 'Cálculo I',
    course_code: '1155202',
    group_name: 'B',
    academic_group_id: 12,
  },
]

/** Only the fields the page reads matter; the rest of the query is irrelevant. */
function mockQueries({
  periodsLoading = false,
  indicatorsLoading = false,
  periodsFailed = false,
  candidatesLoading = false,
  candidates = [CANDIDATE],
  subjects = [],
  plan,
  updateMutate = vi.fn(),
  createMutate = vi.fn(),
}: {
  periodsLoading?: boolean
  indicatorsLoading?: boolean
  periodsFailed?: boolean
  candidatesLoading?: boolean
  candidates?: PlanCandidate[]
  subjects?: PlanSubjectOption[]
  plan?: Plan
  updateMutate?: ReturnType<typeof vi.fn>
  createMutate?: ReturnType<typeof vi.fn>
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
    mutate: createMutate,
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

  vi.mocked(useUploadPlanDocument).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUploadPlanDocument>)

  vi.mocked(usePlanWorkbench).mockReturnValue({
    allSubjects: subjects,
    subjectOptions: subjects,
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

  it('offers the five aspects to add a commitment to, without listing them empty', async () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    // Nothing is picked yet, so no aspect has a section of its own.
    for (const label of ASPECT_LABELS) {
      expect(screen.queryByRole('heading', { name: new RegExp(label) })).not.toBeInTheDocument()
    }

    await userEvent.click(screen.getByRole('button', { name: /Añadir compromiso manual/ }))

    for (const label of ASPECT_LABELS) {
      expect(await screen.findByRole('menuitem', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('keeps the institutional observations up whatever was picked', () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    expect(screen.getByLabelText(/Observaciones del Consejo/)).toBeInTheDocument()
    expect(screen.getByLabelText(/director de departamento/)).toBeInTheDocument()
    expect(screen.getByLabelText(/director de programa/)).toBeInTheDocument()
  })

  it('says it is looking for the teachers instead of just going dead', () => {
    mockQueries({ candidatesLoading: true })

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    expect(teacher).toHaveAttribute('placeholder', 'Cargando docentes…')
    expect(teacher).toHaveAttribute('aria-busy', 'true')
  })

  it('explains an empty period on the field, where the disabled list cannot', () => {
    mockQueries({ candidates: [] })

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    expect(teacher).toHaveAttribute('placeholder', 'Sin docentes evaluados en este periodo')
    expect(teacher).toBeDisabled()
  })

  it('lets the teacher be picked once the candidates are in', () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    expect(teacher).toBeEnabled()
    expect(teacher).toHaveAttribute('placeholder', 'Selecciona un docente…')
  })

  it('counts the teachers a plan is suggested for, so the icon on them can be read', () => {
    mockQueries({ candidates: [CANDIDATE, HEALTHY_CANDIDATE] })

    renderAt(<PlanFormPage />)

    expect(screen.getByText(/docente con plan sugerido por sus resultados/)).toBeInTheDocument()
  })

  it('keeps the legend out when nobody is under the threshold', () => {
    mockQueries({ candidates: [HEALTHY_CANDIDATE] })

    renderAt(<PlanFormPage />)

    expect(screen.queryByText(/plan sugerido por sus resultados/)).not.toBeInTheDocument()
  })

  it('does not suggest a plan for a teacher that already has one', () => {
    mockQueries({ candidates: [{ ...CANDIDATE, has_plan: true }] })

    renderAt(<PlanFormPage />)

    expect(screen.queryByText(/plan sugerido por sus resultados/)).not.toBeInTheDocument()
  })

  it('narrows the teacher list as it is typed into, without going back to the API', async () => {
    mockQueries({ candidates: [CANDIDATE, HEALTHY_CANDIDATE] })

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    await userEvent.click(teacher)

    expect(screen.getByRole('option', { name: /Ada Lovelace/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Grace Hopper/ })).toBeInTheDocument()

    await userEvent.type(teacher, 'grace')

    expect(screen.queryByRole('option', { name: /Ada Lovelace/ })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Grace Hopper/ })).toBeInTheDocument()
    // The candidates all came in one response, so no refetch was needed.
    expect(vi.mocked(useGetPlanCandidates)).not.toHaveBeenCalledWith(expect.anything(), 'grace')
  })

  it('says so when the search matches nobody, instead of an empty list', async () => {
    mockQueries({ candidates: [CANDIDATE] })

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    await userEvent.click(teacher)
    await userEvent.type(teacher, 'zzz')

    expect(screen.getByText(/Sin docentes que coincidan/)).toBeInTheDocument()
  })

  it('finds a teacher by their institutional code too', async () => {
    mockQueries({ candidates: [CANDIDATE, HEALTHY_CANDIDATE] })

    renderAt(<PlanFormPage />)

    const teacher = screen.getByRole('combobox', { name: 'Docente' })

    await userEvent.click(teacher)
    await userEvent.type(teacher, '1150456')

    expect(screen.getByRole('option', { name: /Grace Hopper/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Ada Lovelace/ })).not.toBeInTheDocument()
  })

  it('holds the space of the indicators when it arrives with a teacher preselected', () => {
    mockQueries({ candidatesLoading: true })

    renderAt(<PlanFormPage />, '/planes/nuevo?teacher=7&period=2')

    expect(screen.getByText(/Cargando los indicadores del docente/)).toBeInTheDocument()
  })

  it('never lets the save button go dead: pressing it is how the gaps are found', () => {
    mockQueries({ candidates: [] })

    renderAt(<PlanFormPage />)

    expect(screen.getByRole('button', { name: /Crear plan/ })).toBeEnabled()
  })

  it('keeps quiet about the fields nobody has reached yet', () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    expect(screen.getByLabelText(/^Título/)).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('on saving an incomplete form it says so, paints it, and goes to the first gap', async () => {
    const createMutate = vi.fn()

    mockQueries({ createMutate })

    renderAt(<PlanFormPage />)

    await userEvent.click(screen.getByRole('button', { name: /Crear plan/ }))

    expect(createMutate).not.toHaveBeenCalled()
    expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
      'Faltan campos obligatorios por completar.',
      { description: 'Revisa los campos marcados en rojo.' },
    )
    // The summary, now one alert among the per-field ones below it.
    expect(screen.getByText(/Faltan \d+ campos obligatorios/)).toBeInTheDocument()
    // No teacher yet, so that is the field the cursor is sent to. The scroll is
    // deferred a frame, so is the focus that rides along with it.
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Docente' })).toHaveFocus())
    expect(
      screen
        .getByRole('combobox', { name: 'Docente' })
        .closest('[data-slot="combobox-input-group"]'),
    ).toHaveAttribute('aria-invalid', 'true')

    // And red is not the only thing saying so: the field points at the reason
    // in words, which is the half a screen reader and a colour-blind director
    // both depend on.
    const reason = screen.getByText('Selecciona un docente.')

    expect(screen.getByRole('combobox', { name: 'Docente' })).toHaveAttribute(
      'aria-describedby',
      reason.id,
    )
  })

  it('submits on Enter from a text field, like any form', async () => {
    const createMutate = vi.fn()

    mockQueries({ createMutate })

    renderAt(<PlanFormPage />)

    await userEvent.type(screen.getByLabelText(/Acta N/), '012{Enter}')

    // The form is still incomplete, so Enter lands on the same validation the
    // button runs — which is exactly the point: Enter *submitted*.
    expect(createMutate).not.toHaveBeenCalled()
    expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
      'Faltan campos obligatorios por completar.',
      { description: 'Revisa los campos marcados en rojo.' },
    )
  })

  it('does not submit when Enter picks an option out of a combobox', async () => {
    const createMutate = vi.fn()

    mockQueries({ createMutate })

    renderAt(<PlanFormPage />)

    // Enter inside an open suggestion list belongs to the list, not to the
    // form: choosing a faculty must not try to save the plan behind it.
    await userEvent.type(screen.getByLabelText(/Facultad/), 'INGENIER{Enter}')

    expect(createMutate).not.toHaveBeenCalled()
    expect(vi.mocked(toast.warning)).not.toHaveBeenCalled()
  })

  it('paints the header of the format red too, and sends the cursor to the first of it', async () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    await userEvent.click(screen.getByRole('button', { name: /Crear plan/ }))

    for (const label of [/^Departamento académico/, /^Acta N\.º/]) {
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
    }

    // Facultad, Programa and la fecha del acta arrive already resolved — from
    // the director's own department and from today — so there is nothing to
    // paint on them.
    expect(screen.getByLabelText(/^Programa académico/)).toHaveValue('Ingeniería de Sistemas')
    expect(screen.getByLabelText(/^Facultad/)).not.toHaveValue('')
    expect(screen.getByLabelText(/^Fecha del acta/)).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('paints the fecha del acta red once it is cleared away', async () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar fecha' }))
    await userEvent.click(screen.getByRole('button', { name: /Crear plan/ }))

    expect(screen.getByLabelText(/^Fecha del acta/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('paints a combobox of the header red once it is emptied out', async () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    const faculty = screen.getByLabelText(/^Facultad/)

    await userEvent.clear(faculty)
    await userEvent.tab()

    // The red rides on the group of the combobox, not on the input inside it.
    expect(faculty.closest('[data-slot="autocomplete-input-group"]')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('keeps the institutional observations optional, asterisk and all', () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    for (const label of [/Observaciones del Consejo/, /director de departamento/]) {
      expect(screen.getByLabelText(label).textContent).not.toContain('*')
      expect(screen.getByLabelText(label)).not.toHaveAttribute('aria-invalid', 'true')
    }
  })

  it('goes red on a field the director left empty, without waiting for the save', async () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    const acta = screen.getByLabelText(/^Acta N\.º/)

    expect(acta).not.toHaveAttribute('aria-invalid', 'true')

    await userEvent.click(acta)
    await userEvent.tab()

    expect(acta).toHaveAttribute('aria-invalid', 'true')
    // Only the one that was left behind: the rest are still untouched.
    expect(screen.getByLabelText(/^Título/)).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('lists every asignatura of the teacher when a commitment is written by hand', async () => {
    mockQueries({ subjects: SUBJECTS })

    renderAt(<PlanFormPage />, '/planes/nuevo?teacher=7&period=2')

    expect(screen.getByText(/Todavía no hay asignaturas/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Añadir compromiso manual/ }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /Planeación del curso/ }))

    // A manual commitment is written at teacher level, so it covers all of them.
    expect(screen.getByText('Álgebra Lineal')).toBeInTheDocument()
    expect(screen.getByText('Cálculo I')).toBeInTheDocument()
    expect(screen.queryByText(/Todavía no hay asignaturas/)).not.toBeInTheDocument()
  })

  it('refuses a plan with no asignatura and puts the cursor on the gap it left', async () => {
    const createMutate = vi.fn()

    mockQueries({ subjects: SUBJECTS, createMutate })

    renderAt(<PlanFormPage />, '/planes/nuevo?teacher=7&period=2')

    const empty = screen.getByText(/Todavía no hay asignaturas/)

    expect(empty).not.toHaveClass('border-destructive')

    await userEvent.click(screen.getByRole('button', { name: /Crear plan/ }))

    expect(createMutate).not.toHaveBeenCalled()
    expect(empty).toHaveClass('border-destructive')
  })

  it('marks the empty commitments message rather than the button that fills it', async () => {
    mockQueries({ subjects: SUBJECTS, candidates: [] })

    renderAt(<PlanFormPage />, '/planes/nuevo?teacher=7&period=2')

    const empty = screen.getByText(/Todavía no hay compromisos/)

    await userEvent.click(screen.getByRole('button', { name: /Crear plan/ }))

    expect(empty).toHaveClass('border-destructive')
    await waitFor(() => expect(empty).toHaveFocus())
  })

  it('drops the red as soon as the field has something in it', async () => {
    mockQueries()

    renderAt(<PlanFormPage />)

    const title = screen.getByLabelText(/^Título/)

    await userEvent.click(screen.getByRole('button', { name: /Crear plan/ }))

    expect(title).toHaveAttribute('aria-invalid', 'true')

    // The failed save sends the cursor to the first gap; let it land before
    // typing, or the keystroke goes to whatever it took the focus from.
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Docente' })).toHaveFocus())

    await userEvent.type(title, 'P')

    expect(title).not.toHaveAttribute('aria-invalid', 'true')
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
    courses: [
      {
        id: 21,
        plan_id: 8,
        academic_group_id: 11,
        course_name: 'Álgebra Lineal',
        course_code: '1155201',
        group_name: 'A',
        program_name: 'Ingeniería de Sistemas',
        order: 0,
      },
    ],
    documents: [],
    case_report: null,
    evidence_count: 0,
    progress: 0,
    ...overrides,
  } as unknown as Plan
}

describe('PlanFormPage · autoguardado', () => {
  afterEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  /** A draft as `usePlanFormDraft` would have left it on the last visit. */
  function storeDraft(overrides: Record<string, unknown> = {}) {
    window.localStorage.setItem(
      planDraftKey(),
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        teacherId: 7,
        periodId: 2,
        titleOverride: 'Plan a medio escribir',
        description: 'Lo que quedó sin enviar',
        facultyOverride: null,
        departmentOverride: null,
        programOverride: null,
        actaDate: '2026-08-19',
        actaNumber: '012',
        councilObservations: '',
        departmentObservations: '',
        programObservations: '',
        items: [],
        courses: [],
        ...overrides,
      }),
    )
  }

  it('brings back what was being written and says so, instead of a blank form', () => {
    storeDraft()
    mockQueries()

    renderAt(<PlanFormPage />)

    expect(screen.getByLabelText(/^Título/)).toHaveValue('Plan a medio escribir')
    expect(screen.getByLabelText('Descripción')).toHaveValue('Lo que quedó sin enviar')
    expect(screen.getByText(/Recuperamos lo que estabas escribiendo/)).toBeInTheDocument()
  })

  it('drops the draft and empties the form when the director says so', async () => {
    storeDraft()
    mockQueries()

    renderAt(<PlanFormPage />)

    await userEvent.click(screen.getByRole('button', { name: /Descartar y empezar de nuevo/ }))

    expect(screen.getByLabelText('Descripción')).toHaveValue('')
    expect(screen.queryByText(/Recuperamos lo que estabas escribiendo/)).not.toBeInTheDocument()
    expect(window.localStorage.getItem(planDraftKey())).toBeNull()
  })

  it('lets the notice be closed without losing what it brought back', async () => {
    storeDraft()
    mockQueries()

    renderAt(<PlanFormPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar el aviso' }))

    expect(screen.queryByText(/Recuperamos lo que estabas escribiendo/)).not.toBeInTheDocument()
    // Closing the notice is not discarding the draft: the form keeps it, and so
    // does the browser.
    expect(screen.getByLabelText('Descripción')).toHaveValue('Lo que quedó sin enviar')
    expect(window.localStorage.getItem(planDraftKey())).not.toBeNull()
  })

  it('says when the draft was written the way a date is said in Spanish', () => {
    storeDraft()
    mockQueries()

    renderAt(<PlanFormPage />)

    // "19 de agosto de 2026", never "agosto 19, 2026".
    expect(
      screen.getByText(/Recuperamos lo que estabas escribiendo el \d+ de \w+ de \d{4}/),
    ).toBeInTheDocument()
  })

  it('backs the form up as it is typed into, so a reload costs nothing', async () => {
    mockQueries()

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    vi.useFakeTimers({ shouldAdvanceTime: true })

    try {
      renderAt(<PlanFormPage />)

      expect(window.localStorage.getItem(planDraftKey())).toBeNull()

      await user.type(screen.getByLabelText('Descripción'), 'Algo que no quiero perder')

      // Nothing is written mid-sentence; the save waits for a pause.
      await vi.advanceTimersByTimeAsync(1_000)

      const stored = JSON.parse(window.localStorage.getItem(planDraftKey()) ?? '{}')

      expect(stored.description).toBe('Algo que no quiero perder')
      expect(stored.version).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores a draft for another teacher: that link starts a new plan', () => {
    storeDraft({ teacherId: 999 })
    mockQueries()

    renderAt(<PlanFormPage />, '/planes/nuevo?teacher=7')

    expect(screen.getByLabelText('Descripción')).toHaveValue('')
    expect(screen.queryByText(/Recuperamos lo que estabas escribiendo/)).not.toBeInTheDocument()
  })

  it('leaves a stale draft alone rather than resurrecting last month’s work', () => {
    storeDraft({
      savedAt: new Date(Date.now() - PLAN_DRAFT_MAX_AGE_MS - 1_000).toISOString(),
    })
    mockQueries()

    renderAt(<PlanFormPage />)

    expect(screen.getByLabelText('Descripción')).toHaveValue('')
  })
})

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

    expect(screen.getByLabelText(/^Departamento académico/)).toHaveValue('Departamento de Sistemas')
    expect(screen.getByLabelText(/^Programa académico/)).toHaveValue('Ingeniería de Sistemas')
  })

  it('pide la fecha una sola vez: la del acta es la de inicio', () => {
    mockQueries({ plan: savedPlan() })

    renderAt(<PlanFormPage />, '/planes/8/editar')

    expect(screen.getByLabelText(/^Fecha del acta/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Fecha de inicio')).not.toBeInTheDocument()
  })
})

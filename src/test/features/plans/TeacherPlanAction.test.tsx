import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetPlans } from '@/features/plans/api'
import { TeacherPlanAction } from '@/features/plans/components/TeacherPlanAction'
import type { Plan } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({ useGetPlans: vi.fn() }))

// The selection panel has its own tests and pulls three queries of its own;
// stubbed here so this one stays on what the profile strip decides to offer.
vi.mock('@/features/plans/components/IndicatorSelectionSheet', () => ({
  IndicatorSelectionSheet: ({ open, target }: { open: boolean; target: { kind: string } }) =>
    open ? <div data-testid="selection-sheet">{target.kind}</div> : null,
}))

/** The role the director is signed in as, which is what gates the actions. */
let selectedRole = 'DIRECTOR DE DEPARTAMENTO'

vi.mock('@/features/auth', () => ({
  ROLE: {
    ADMIN: 'ADMIN',
    TEACHER: 'DOCENTE',
    DEPARTMENT_DIRECTOR: 'DIRECTOR DE DEPARTAMENTO',
  },
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ selectedRole }),
}))

/** The period the profile under test is showing. */
const PERIOD = '2028-2'

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 7,
    title: 'Plan de mejoramiento',
    teacher_name: 'Ada Lovelace',
    status: 'EN_SEGUIMIENTO',
    origin_period_code: PERIOD,
    ...overrides,
  } as unknown as Plan
}

const PLAN = plan()

function renderAction({
  plans = [PLAN],
  name,
  isPending = false,
}: { plans?: Plan[]; name?: string; isPending?: boolean } = {}) {
  vi.mocked(useGetPlans).mockReturnValue({
    data: isPending ? undefined : { data: plans },
    isPending,
  } as unknown as ReturnType<typeof useGetPlans>)

  const { hook, history } = memoryLocation({ path: '/docentes/42', record: true })

  const { container } = render(
    <Router hook={hook}>
      <TeacherPlanAction teacherId={42} teacherName={name} periodCode={PERIOD} />
    </Router>,
  )

  return { container, history }
}

afterEach(() => {
  selectedRole = 'DIRECTOR DE DEPARTAMENTO'
  vi.clearAllMocks()
})

describe('TeacherPlanAction', () => {
  it('opens the whole history of the teacher in the plans directory', async () => {
    const user = userEvent.setup()
    const { history } = renderAction({ name: 'Ada Lovelace' })

    await user.click(screen.getByRole('button', { name: 'Ver historial' }))

    expect(history[history.length - 1]).toBe(
      '/planes?docente=42&nombre=Ada%20Lovelace&periodo=todos',
    )
  })

  it('names the teacher from his own plan when the profile passed none', async () => {
    const user = userEvent.setup()
    const { history } = renderAction()

    await user.click(screen.getByRole('button', { name: 'Ver historial' }))

    expect(history[history.length - 1]).toBe(
      '/planes?docente=42&nombre=Ada%20Lovelace&periodo=todos',
    )
  })

  it('offers no history when the teacher has never had a plan', () => {
    renderAction({ plans: [] })

    expect(screen.queryByRole('button', { name: 'Ver historial' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear plan/ })).toBeInTheDocument()
  })

  it('shows nothing at all to a teacher looking at a profile', () => {
    selectedRole = 'DOCENTE'
    renderAction()

    expect(screen.queryByRole('button', { name: 'Ver historial' })).not.toBeInTheDocument()
  })

  it('abre el panel de selección desde el perfil, para empezar un plan', async () => {
    const user = userEvent.setup()

    renderAction({ plans: [] })

    await user.click(screen.getByRole('button', { name: 'Seleccionar indicadores' }))

    expect(await screen.findByTestId('selection-sheet')).toHaveTextContent('new')
  })

  // With a plan already in force the selection has somewhere to land: its
  // commitments, not a second plan the semester cannot have.
  it('con un plan en curso, la selección se agrega a ese plan', async () => {
    const user = userEvent.setup()

    renderAction()

    await user.click(screen.getByRole('button', { name: 'Agregar indicadores al plan' }))

    expect(await screen.findByTestId('selection-sheet')).toHaveTextContent('edit')
  })

  it('no ofrece agregar indicadores a un acta ya firmada', () => {
    renderAction({ plans: [plan({ acta_locked: true, acta_status: 'FIRMADA' })] })

    expect(screen.queryByRole('button', { name: /indicadores/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver plan' })).toBeInTheDocument()
  })

  it('no ofrece crear un segundo plan cuando el periodo ya tiene el suyo', () => {
    renderAction()

    expect(screen.getByRole('button', { name: 'Ver plan' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Crear plan/ })).not.toBeInTheDocument()
  })

  // The follow-up of an unmet plan is the next semester's, not a second one
  // filed under the same acta.
  it('tampoco lo ofrece con el plan del periodo ya cerrado, y dice por qué', () => {
    renderAction({ plans: [plan({ status: 'CERRADO_NO_CUMPLIDO' })] })

    expect(screen.queryByRole('button', { name: /Crear plan/ })).not.toBeInTheDocument()
    expect(screen.getByText('El periodo ya tuvo su plan.')).toBeInTheDocument()
  })

  /**
   * The list is not ordered by period, so the first plan it hands over can be
   * another semester's. Read as "the current plan" it named the wrong one *and*
   * hid the create button that this period was still owed.
   */
  it('ignora los planes de otros periodos al decidir si este ya tiene uno', () => {
    renderAction({ plans: [plan({ id: 3, origin_period_code: '2027-1' })] })

    expect(screen.getByRole('button', { name: /Crear plan/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver plan' })).not.toBeInTheDocument()
    expect(screen.getByText(/Sin plan en el periodo 2028-2/)).toHaveTextContent(
      'Tiene 1 plan en otros periodos.',
    )
  })

  it('encuentra el plan del periodo aunque no sea el primero de la lista', () => {
    renderAction({
      plans: [plan({ id: 3, origin_period_code: '2027-1' }), plan({ id: 9 })],
    })

    expect(screen.queryByRole('button', { name: /Crear plan/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver plan' })).toBeInTheDocument()
  })

  it('deja ver el historial aunque este periodo no tenga plan', async () => {
    const user = userEvent.setup()
    const { history } = renderAction({ plans: [plan({ origin_period_code: '2027-1' })] })

    await user.click(screen.getByRole('button', { name: 'Ver historial' }))

    expect(history[history.length - 1]).toBe(
      '/planes?docente=42&nombre=Ada%20Lovelace&periodo=todos',
    )
  })

  it('holds its verdict while the plans of the teacher are on their way', () => {
    const { container } = renderAction({ isPending: true })

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)

    // Neither answer yet: no "he has none, create one", no plan to open.
    expect(screen.queryByText(/no tiene un plan/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Crear plan/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver plan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver historial' })).not.toBeInTheDocument()
  })
})

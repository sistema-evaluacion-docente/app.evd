import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetPlanPeriods, useGetPlans } from '@/features/plans/api'
import PlansPage from '@/features/plans/pages/PlansPage'
import type { Plan, PlanPeriod } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useGetPlans: vi.fn(),
  useGetPlanPeriods: vi.fn(),
  useDeletePlan: () => mockDelete,
}))

// The directory is the director's; the delete action is gated on the role.
vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { roles: ['DIRECTOR DE DEPARTAMENTO'] } }),
}))

const mockDelete = { mutate: vi.fn(), isPending: false }

const PERIODS: PlanPeriod[] = [
  { id: 9, code: '2028-2', name: null },
  { id: 8, code: '2028-1', name: null },
  { id: 7, code: '2027-2', name: null },
]

function plan(id: number, periodCode: string): Plan {
  return {
    id,
    title: `Plan ${id}`,
    teacher_name: 'Ada Lovelace',
    teacher_avatar_url: null,
    origin_period_code: periodCode,
    progress: 40,
    status: 'EN_SEGUIMIENTO',
    acta_status: 'BORRADOR',
  } as unknown as Plan
}

/** Arguments the page last asked the list with. */
function lastQuery() {
  const calls = vi.mocked(useGetPlans).mock.calls

  return calls[calls.length - 1][0]
}

function renderPage(url = '/planes') {
  vi.mocked(useGetPlanPeriods).mockReturnValue({
    data: { data: PERIODS },
    isLoading: false,
  } as unknown as ReturnType<typeof useGetPlanPeriods>)

  vi.mocked(useGetPlans).mockReturnValue({
    data: { data: [plan(1, '2028-1'), plan(2, '2027-2')], pagination: { pages: 1 } },
    isPending: false,
    isFetching: false,
  } as unknown as ReturnType<typeof useGetPlans>)

  const { hook, history } = memoryLocation({ path: url, record: true })

  render(
    <Router hook={hook}>
      <PlansPage />
    </Router>,
  )

  return { history }
}

/** Where the memory router stands after the page rewrote the query string. */
function currentUrl(history: string[]) {
  return history[history.length - 1]
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('PlansPage', () => {
  it('leads with the most recent period when the URL carries no filter', () => {
    renderPage()

    expect(lastQuery()).toMatchObject({ periodId: 9, teacherId: undefined, search: '' })
  })

  it('resolves ?periodo= to the id of that semester', () => {
    renderPage('/planes?periodo=2027-2')

    expect(lastQuery()).toMatchObject({ periodId: 7 })
  })

  it('asks for every semester with ?periodo=todos', () => {
    renderPage('/planes?periodo=todos')

    expect(lastQuery()).toMatchObject({ periodId: undefined })
  })

  it('falls back to the most recent period when the code no longer has plans', () => {
    renderPage('/planes?periodo=1999-1')

    expect(lastQuery()).toMatchObject({ periodId: 9 })
  })

  it('pins the teacher of the link by id and shows his name in the search box', () => {
    renderPage('/planes?docente=42&nombre=Ada%20Lovelace&periodo=todos')

    // Filtered by id, not by the name printed in the box: a name spelled
    // differently by the API can't empty the history.
    expect(lastQuery()).toMatchObject({ teacherId: 42, periodId: undefined, search: '' })

    expect(screen.getByRole('textbox', { name: /Buscar por docente/ })).toHaveValue('Ada Lovelace')
    expect(screen.getByText(/Historial de planes de/)).toHaveTextContent(
      'Historial de planes de Ada Lovelace en todos los periodos',
    )
  })

  it('ignores a teacher that is not an id', () => {
    renderPage('/planes?docente=ada')

    expect(lastQuery()).toMatchObject({ teacherId: undefined })
    expect(screen.queryByText(/Historial de planes de/)).not.toBeInTheDocument()
  })

  it('names the pinned teacher from the list when the link carried no name', () => {
    renderPage('/planes?docente=42&periodo=todos')

    expect(screen.getByText(/Historial de planes de/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Buscar por docente/ })).toHaveValue('')
  })

  it('drops the pin and goes back to the whole directory', async () => {
    const user = userEvent.setup()
    const { history } = renderPage('/planes?docente=42&nombre=Ada&periodo=todos')

    await user.click(screen.getByRole('button', { name: 'Quitar filtro' }))

    expect(currentUrl(history)).toBe('/planes?periodo=todos')
    expect(lastQuery()).toMatchObject({ teacherId: undefined, periodId: undefined })
  })

  it('releases the pin when the box is typed over', async () => {
    const user = userEvent.setup()
    const { history } = renderPage('/planes?docente=42&nombre=Ada&periodo=todos')

    await user.type(screen.getByRole('textbox', { name: /Buscar por docente/ }), '!')

    expect(currentUrl(history)).toBe('/planes?periodo=todos&buscar=Ada%21')
    expect(lastQuery()).toMatchObject({ teacherId: undefined })
  })

  it('writes the free-text search to the URL and sends it debounced', async () => {
    const user = userEvent.setup()
    const { history } = renderPage('/planes?periodo=todos')

    await user.type(screen.getByRole('textbox', { name: /Buscar por docente/ }), 'ada')

    // The URL follows the box at once; the list only once the typing settles.
    expect(currentUrl(history)).toBe('/planes?periodo=todos&buscar=ada')

    await waitFor(() => expect(lastQuery()).toMatchObject({ search: 'ada' }))
  })

  it('reads the page and the page size from the URL', () => {
    renderPage('/planes?pagina=3&filas=20')

    expect(lastQuery()).toMatchObject({ page: 3, limit: 20 })
  })

  it('ignores a page size the table does not offer', () => {
    renderPage('/planes?filas=999')

    expect(lastQuery()).toMatchObject({ limit: 10 })
  })

  it('ignores a status that is not one of the plan statuses', () => {
    renderPage('/planes?estado=INVENTADO')

    expect(lastQuery()).toMatchObject({ status: '' })
  })

  it('keeps a valid status from the URL', () => {
    renderPage('/planes?estado=CERRADO_CUMPLIDO')

    expect(lastQuery()).toMatchObject({ status: 'CERRADO_CUMPLIDO' })
  })
})

describe('PlansPage · eliminar un plan', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ofrece eliminar desde la fila', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click((await screen.findAllByRole('button', { name: 'Acciones' }))[0])

    expect(await screen.findByRole('menuitem', { name: /Eliminar/ })).toBeInTheDocument()
  })

  it('pide confirmación nombrando el plan y el docente', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click((await screen.findAllByRole('button', { name: 'Acciones' }))[0])
    await user.click(await screen.findByRole('menuitem', { name: /Eliminar/ }))

    const dialog = await screen.findByRole('alertdialog')

    expect(dialog).toHaveTextContent('Ada Lovelace')
    expect(mockDelete.mutate).not.toHaveBeenCalled()
  })
})

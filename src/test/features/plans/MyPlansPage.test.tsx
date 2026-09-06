import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetMyPlans, useGetPlanPeriods } from '@/features/plans/api'
import MyPlansPage from '@/features/plans/pages/MyPlansPage'
import type { Plan, PlanPeriod } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useGetMyPlans: vi.fn(),
  useGetPlanPeriods: vi.fn(),
}))

const PERIODS: PlanPeriod[] = [
  { id: 9, code: '2026-1', name: null },
  { id: 8, code: '2025-2', name: null },
  { id: 7, code: '2025-1', name: null },
]

function plan(id: number, periodCode: string): Plan {
  return {
    id,
    title: `Plan ${id}`,
    origin_period_code: periodCode,
    acta_date: '2026-03-01',
    progress: 40,
    status: 'EN_SEGUIMIENTO',
    acta_status: 'BORRADOR',
  } as unknown as Plan
}

/** Arguments the page last asked the list with. */
function lastQuery() {
  const calls = vi.mocked(useGetMyPlans).mock.calls

  return calls[calls.length - 1][0]
}

function mockPlans(plans: Plan[], { isPending = false, pages = 1 } = {}) {
  vi.mocked(useGetMyPlans).mockReturnValue({
    data: isPending ? undefined : { data: plans, pagination: { pages } },
    isPending,
    isFetching: false,
  } as unknown as ReturnType<typeof useGetMyPlans>)
}

function renderPage(url = '/mis-planes') {
  vi.mocked(useGetPlanPeriods).mockReturnValue({
    data: { data: PERIODS },
    isLoading: false,
  } as unknown as ReturnType<typeof useGetPlanPeriods>)

  const { hook, history } = memoryLocation({ path: url, record: true })

  render(
    <Router hook={hook}>
      <MyPlansPage />
    </Router>,
  )

  return history
}

describe('MyPlansPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lists the page of plans the API answered with', () => {
    mockPlans([plan(1, '2026-1'), plan(2, '2025-2'), plan(3, '2025-1')])

    renderPage()

    expect(screen.getByText('2026-1')).toBeInTheDocument()
    expect(screen.getByText('2025-2')).toBeInTheDocument()
    expect(screen.getByText('2025-1')).toBeInTheDocument()
  })

  it('does not carry a "Docente" column: every row is the same person', () => {
    mockPlans([plan(1, '2026-1')])

    renderPage()

    expect(screen.queryByRole('columnheader', { name: 'Docente' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Periodo' })).toBeInTheDocument()
  })

  it('opens the plan it was asked for, under the teacher’s own route', async () => {
    mockPlans([plan(1, '2026-1'), plan(2, '2025-2')])

    const history = renderPage()

    await userEvent.click(screen.getByText('2025-2'))

    expect(history[history.length - 1]).toBe('/mis-planes/2')
  })

  it('explains an empty history instead of showing a bare table', () => {
    mockPlans([])

    renderPage()

    expect(screen.getByText(/No tienes un plan de mejoramiento asignado/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('does not claim there is no plan when a filter emptied the list', () => {
    mockPlans([], { pages: 0 })

    renderPage('/mis-planes?estado=CERRADO_CUMPLIDO')

    // The teacher may well have plans — just none in that estado. Saying they
    // have none would be a lie the filter can undo.
    expect(screen.queryByText(/No tienes un plan de mejoramiento asignado/)).not.toBeInTheDocument()
    expect(screen.getByText(/No hay planes que coincidan/)).toBeInTheDocument()
  })

  it('leads with every period, unlike the director’s directory', () => {
    mockPlans([plan(1, '2026-1')])

    renderPage()

    // `/planes` opens on the newest semester; a history has to open on all of
    // them, or the teacher lands on a page that hides their older plans.
    expect(lastQuery()).toMatchObject({ periodId: undefined })
    expect(screen.getByText('Todos los periodos')).toBeInTheDocument()
  })

  it('sends the search to the API once the typing settles', async () => {
    mockPlans([plan(1, '2026-1')])

    const history = renderPage()

    await userEvent.type(screen.getByPlaceholderText(/Buscar por título/), 'acta')

    // The URL follows the box at once; the list only once the typing settles.
    expect(history[history.length - 1]).toBe('/mis-planes?buscar=acta')

    await waitFor(() => expect(lastQuery()).toMatchObject({ search: 'acta' }))
  })

  it('reads the page and the page size from the URL', () => {
    mockPlans([plan(1, '2026-1')])

    renderPage('/mis-planes?pagina=3&filas=20')

    expect(lastQuery()).toMatchObject({ page: 3, limit: 20 })
  })

  it('turns the chosen period into the id the API filters by', async () => {
    mockPlans([plan(1, '2025-2')])

    renderPage()

    await userEvent.click(screen.getByRole('combobox', { name: 'Periodo' }))
    await userEvent.click(screen.getByRole('option', { name: '2025-2' }))

    await waitFor(() => expect(lastQuery()).toMatchObject({ periodId: 8 }))
  })
})

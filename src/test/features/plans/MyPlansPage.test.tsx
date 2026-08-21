import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetMyPlans } from '@/features/plans/api'
import MyPlansPage from '@/features/plans/pages/MyPlansPage'
import type { Plan } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useGetMyPlans: vi.fn(),
}))

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

function mockPlans(plans: Plan[], { isPending = false } = {}) {
  vi.mocked(useGetMyPlans).mockReturnValue({
    data: isPending ? undefined : { data: plans },
    isPending,
    isFetching: false,
  } as unknown as ReturnType<typeof useGetMyPlans>)
}

function renderPage(path = '/mis-planes') {
  const { hook, history } = memoryLocation({ path, record: true })

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

  it('lists every plan the teacher has had, not just the current one', () => {
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

  it('filters what is already loaded, since the API answers with the whole list', async () => {
    mockPlans([plan(1, '2026-1'), plan(2, '2025-2')])

    renderPage()

    await userEvent.type(screen.getByPlaceholderText(/Buscar por título o periodo/), '2025-2')

    expect(screen.getByText('2025-2')).toBeInTheDocument()
    expect(screen.queryByText('2026-1')).not.toBeInTheDocument()
    // One request, at mount: the search never went back to the API.
    expect(vi.mocked(useGetMyPlans).mock.calls.every((call) => call.length === 0)).toBe(true)
  })
})

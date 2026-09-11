import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { TeachersList } from '@/features/teachers/components/TeachersList'
import type { TeacherRecord, TeacherUser } from '@/features/teachers/types'
import { renderRouted, screen, waitFor, within } from '@/test/render'

/**
 * RF-5.6 — Ranking de desempeño paginado y ordenable: el listado de docentes
 * de un periodo, ordenado por su promedio de mayor a menor (o al revés), con
 * paginación en el servidor. Ejercitado a través de un axios mockeado, para
 * que corran los hooks de consulta reales y el propio control «Ordenar por».
 */

vi.mock('@/config/axios', () => ({ default: { get: vi.fn(), put: vi.fn() } }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const departmentId = { current: 3 as number | null }

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { department_id: departmentId.current } }),
}))

// `useTableFilters` persists in a module-level store keyed by `tableKey`, so
// it normally survives across renders on purpose (navigating away and back
// keeps the filter). That is exactly what would leak one test's sort choice
// into the next one here — each test mounts its own `TeachersList`, so it
// needs its own filter state instead, seeded fresh from `defaults` every time.
vi.mock('@/hooks/useTableFilters', () => ({
  useTableFilters: (_key: string, defaults: Record<string, unknown>) => {
    const [filters, setFilters] = useState(defaults)

    return { filters, setFilters, resetFilters: () => setFilters(defaults) }
  },
}))

const mockApi = vi.mocked(api)

const PERIODS = [{ id: 4, name: '2028-1', code: '2028-1', active: true }]

function user(overrides: Partial<TeacherUser> = {}): TeacherUser {
  return {
    id: 10,
    uid: 'uid-10',
    email: 'ada@ufps.edu.co',
    department_id: 3,
    name: 'Ada Lovelace',
    active: true,
    avatar_url: '',
    institutional_code: 'A1',
    roles: ['DOCENTE'],
    teacher_id: 1,
    created_at: '2028-01-01T00:00:00Z',
    updated_at: '2028-01-01T00:00:00Z',
    ...overrides,
  }
}

function teacher(overrides: Partial<TeacherRecord> = {}): TeacherRecord {
  return {
    id: overrides.id ?? 1,
    institutional_code: 'A1',
    department_id: 3,
    contract_type: 'Planta',
    user_id: 10,
    user: user(),
    active: true,
    overall_average: 4.5,
    high_risk_comments_count: 0,
    created_at: '2028-01-01T00:00:00Z',
    updated_at: '2028-01-01T00:00:00Z',
    ...overrides,
  }
}

const ADA = teacher({ id: 1, overall_average: 4.5 })
const GRACE = teacher({
  id: 2,
  overall_average: 3.1,
  user: user({ name: 'Grace Hopper', email: 'grace@ufps.edu.co' }),
})

/** One page of teachers, plus whatever the period selector needs. */
function serve({ teachers = [ADA, GRACE], pages = 1, periods = PERIODS } = {}) {
  mockApi.get.mockImplementation((url: string) => {
    if (url.includes('/academic-periods')) return Promise.resolve({ data: periods })

    if (url.includes('/teachers/with-averages')) {
      return Promise.resolve({ data: teachers, pagination: { pages, page: 1, limit: 10 } })
    }

    return Promise.resolve({ data: [] })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  departmentId.current = 3
  serve()
})

/** The list only queries once the period selector has resolved a period. */
async function renderList(path = '/docentes?period=2028-1') {
  const rendered = renderRouted(<TeachersList />, { path })

  await screen.findByText('Ada Lovelace')

  return rendered
}

/**
 * Opens the sort popover, picks a field and a direction, and applies it. The
 * trigger button is found by its wrapping `title="Ordenar por"`, not by its
 * own label — that label is whatever field is currently active (defaults to
 * "Comentarios de alto riesgo" here), so matching on it would break the
 * moment a previous interaction in the same test changed it.
 */
async function sortBy(user: ReturnType<typeof userEvent.setup>, field: string, direction: string) {
  const trigger = within(screen.getByTitle('Ordenar por')).getByRole('button')

  await user.click(trigger)
  await user.click(screen.getByRole('button', { name: field }))
  await user.click(screen.getByRole('button', { name: direction }))
  await user.click(screen.getByRole('button', { name: 'Aplicar' }))
}

/** `sort_by` sent on the most recent request to `/teachers/with-averages`. */
function lastSortBy(): string | undefined {
  const calls = mockApi.get.mock.calls.filter(([url]) =>
    String(url).includes('/teachers/with-averages'),
  )
  const [, config] = calls[calls.length - 1]!

  return (config as { params: Record<string, string> }).params.sort_by
}

describe('TeachersList', () => {
  it('lista a los docentes del departamento con su promedio', async () => {
    await renderList()

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
  })

  it('ordena de mayor a menor promedio al elegir Promedio + Desc', async () => {
    const user = userEvent.setup()

    await renderList()
    // El servidor es quien ordena — la tabla nunca reordena por su cuenta —
    // así que la respuesta ya llega en el orden que se espera ver.
    serve({ teachers: [ADA, GRACE] })

    await sortBy(user, 'Promedio', 'Desc')

    // The filter itself is debounced 400ms before it reaches the query.
    await waitFor(() => expect(lastSortBy()).toBe('overall_average_desc'), { timeout: 1000 })

    const rows = screen.getAllByRole('row').slice(1) // sin el encabezado
    expect(within(rows[0]!).getByText('Ada Lovelace')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Grace Hopper')).toBeInTheDocument()
  })

  it('ordena de menor a mayor promedio al elegir Promedio + Asc', async () => {
    const user = userEvent.setup()

    await renderList()
    serve({ teachers: [GRACE, ADA] })

    await sortBy(user, 'Promedio', 'Asc')

    await waitFor(() => expect(lastSortBy()).toBe('overall_average_asc'), { timeout: 1000 })

    const rows = screen.getAllByRole('row').slice(1)
    expect(within(rows[0]!).getByText('Grace Hopper')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Ada Lovelace')).toBeInTheDocument()
  })

  it('pagina los resultados en el servidor', async () => {
    const user = userEvent.setup()

    serve({ pages: 3 })
    await renderList()

    expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))

    expect(await screen.findByText(/Página 2 de 3/)).toBeInTheDocument()

    const calls = mockApi.get.mock.calls.filter(([url]) =>
      String(url).includes('/teachers/with-averages'),
    )
    const [, config] = calls[calls.length - 1]!
    expect((config as { params: Record<string, number> }).params.page).toBe(2)
  })

  it('dice que no hay docentes cuando el periodo no tiene ninguno', async () => {
    serve({ teachers: [] })

    renderRouted(<TeachersList />, { path: '/docentes?period=2028-1' })

    expect(
      await screen.findByText('No hay docentes registrados en su departamento.'),
    ).toBeInTheDocument()
  })

  it('avisa cuando el director no tiene departamento asignado, en vez de listar', async () => {
    departmentId.current = null

    renderRouted(<TeachersList />, { path: '/docentes?period=2028-1' })

    expect(
      await screen.findByText(
        'Su usuario no está vinculado a un departamento. Contacte al administrador del sistema.',
      ),
    ).toBeInTheDocument()
    expect(mockApi.get.mock.calls.some(([url]) => String(url).includes('with-averages'))).toBe(
      false,
    )
  })
})

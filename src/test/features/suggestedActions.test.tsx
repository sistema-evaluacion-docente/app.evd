import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { ApiError } from '@/lib/apiError'
import { SuggestedActionsList } from '@/features/suggested-actions/components/SuggestedActionsList'
import { renderRouted, screen, waitFor, within } from '@/test/render'

/**
 * The department's default improvement actions, stored as a single JSON
 * setting. Driven through a mocked axios so the real query/mutation hooks —
 * and the GLOBAL/DEPARTMENT scope logic — run end to end.
 */

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const authState = { current: { department_id: 3 } as { department_id: number | null } | null }

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector?: (s: { user: typeof authState.current }) => unknown) => {
    const state = { user: authState.current }
    return selector ? selector(state) : state
  },
}))

const mockApi = vi.mocked(api)

const INDICATORS = {
  threshold: 3.5,
  aspects: [
    { aspect: 1, label: 'Conocimiento', dimension: 'Desarrollo del Conocimiento' },
    { aspect: 2, label: 'Desempeño', dimension: 'Desempeño Docente' },
  ],
  overall: { target_type: 'OVERALL_AVERAGE', target_ref: null, label: 'General', suggestions: [] },
}

const GLOBAL_SETTING = {
  id: 1,
  key: 'improvement_plan.suggested_actions',
  value: JSON.stringify([{ id: 'a', aspect: 1, action: 'Asistir a tutorías' }]),
  value_type: 'JSON',
  description: 'x',
  department_id: null,
  department_name: null,
  scope: 'GLOBAL',
  changed_by: 'u1',
  changed_by_name: 'Admin',
  changed_by_avatar_url: null,
  effective_from: '2028-01-01T00:00:00Z',
  created_at: '2028-01-01T00:00:00Z',
  updated_at: '2028-01-01T00:00:00Z',
}

const DEPT_SETTING = {
  ...GLOBAL_SETTING,
  id: 2,
  department_id: 3,
  department_name: 'Sistemas',
  scope: 'DEPARTMENT',
  value: JSON.stringify([{ id: 'b', aspect: 2, action: 'Entregar retroalimentación' }]),
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.current = { department_id: 3 }

  mockApi.get.mockImplementation((url: string) => {
    if (url.startsWith('/settings/by-key')) return Promise.resolve({ data: GLOBAL_SETTING })
    if (url === '/improvement-plans/indicators') return Promise.resolve({ data: INDICATORS })

    return Promise.resolve({ data: null })
  })
  mockApi.post.mockResolvedValue({ data: DEPT_SETTING })
  mockApi.put.mockResolvedValue({ data: DEPT_SETTING })
  mockApi.delete.mockResolvedValue({ data: undefined })
})

describe('SuggestedActionsList', () => {
  it('shows the institutional list and its notice when the department has none of its own', async () => {
    renderRouted(<SuggestedActionsList />)

    expect(await screen.findByText('Asistir a tutorías')).toBeInTheDocument()
    expect(screen.getByText('Estás viendo las acciones institucionales')).toBeInTheDocument()
  })

  it("shows the department's own list and notice once it has one", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/settings/by-key')) return Promise.resolve({ data: DEPT_SETTING })
      if (url === '/improvement-plans/indicators') return Promise.resolve({ data: INDICATORS })
      return Promise.resolve({ data: null })
    })

    renderRouted(<SuggestedActionsList />)

    expect(await screen.findByText('Entregar retroalimentación')).toBeInTheDocument()
    expect(screen.getByText('Lista propia de Sistemas')).toBeInTheDocument()
  })

  it('says there is nothing yet when the key has no value at all', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/settings/by-key')) return Promise.reject(new ApiError('nf', { status: 404 }))
      if (url === '/improvement-plans/indicators') return Promise.resolve({ data: INDICATORS })
      return Promise.resolve({ data: null })
    })

    renderRouted(<SuggestedActionsList />)

    expect(await screen.findByText('Todavía no hay acciones sugeridas')).toBeInTheDocument()
  })

  it('refuses to render the list without a department assigned', async () => {
    authState.current = { department_id: null }

    renderRouted(<SuggestedActionsList />)

    expect(
      await screen.findByText('No se pudo abrir la configuración'),
    ).toBeInTheDocument()
    expect(screen.getByText(/no tiene un departamento asignado/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nueva acción' })).not.toBeInTheDocument()
  })

  it('adds a new action, creating the department its own copy of the list', async () => {
    const user = userEvent.setup()
    renderRouted(<SuggestedActionsList />)
    await screen.findByText('Asistir a tutorías')
    // Waits for the aspect catalogue to load too — its arrival re-renders the
    // table columns, and clicking mid-render is what made this flaky.
    await screen.findByText('Conocimiento')

    await user.click(screen.getByRole('button', { name: 'Nueva acción' }))
    await user.type(await screen.findByLabelText(/Acción/), 'Reforzar la puntualidad')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith(
        '/settings/',
        expect.objectContaining({
          key: 'improvement_plan.suggested_actions',
          department_id: 3,
          value_type: 'JSON',
        }),
      ),
    )
    const created = JSON.parse(mockApi.post.mock.calls[0][1].value)
    expect(created).toHaveLength(2)
    expect(created[1].action).toBe('Reforzar la puntualidad')
  })

  it('edits an existing action on a department-owned list with a PUT', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/settings/by-key')) return Promise.resolve({ data: DEPT_SETTING })
      if (url === '/improvement-plans/indicators') return Promise.resolve({ data: INDICATORS })
      return Promise.resolve({ data: null })
    })
    const user = userEvent.setup()
    renderRouted(<SuggestedActionsList />)
    await screen.findByText('Entregar retroalimentación')
    // Waits for the aspect catalogue too — see the note in the "adds" test.
    const row = (await screen.findByText('Desempeño')).closest('tr')!

    await user.click(within(row).getByRole('button', { name: 'Acciones' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const field = await screen.findByLabelText(/Acción/)
    await user.clear(field)
    await user.type(field, 'Entregar retroalimentación oportuna')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(mockApi.put).toHaveBeenCalledWith('/settings/2', expect.any(Object)))
  })

  it('deletes an action behind a confirmation', async () => {
    const user = userEvent.setup()
    renderRouted(<SuggestedActionsList />)
    const row = (await screen.findByText('Asistir a tutorías')).closest('tr')!

    await user.click(within(row).getByRole('button', { name: 'Acciones' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled())
    const created = JSON.parse(mockApi.post.mock.calls[0][1].value)
    expect(created).toEqual([])
  })

  it('opens the change history of a department-owned list', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/settings/by-key')) return Promise.resolve({ data: DEPT_SETTING })
      if (url === '/improvement-plans/indicators') return Promise.resolve({ data: INDICATORS })
      if (url === '/settings/2/history') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: null })
    })
    const user = userEvent.setup()
    renderRouted(<SuggestedActionsList />)
    await screen.findByText('Entregar retroalimentación')

    await user.click(screen.getByRole('button', { name: 'Historial' }))

    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith('/settings/2/history', expect.any(Object)))
  })

  it('does not offer a history button on the institutional list', async () => {
    renderRouted(<SuggestedActionsList />)
    await screen.findByText('Asistir a tutorías')

    expect(screen.queryByRole('button', { name: 'Historial' })).not.toBeInTheDocument()
  })
})

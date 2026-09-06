import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { DirectorsList } from '@/features/directors/components/DirectorsList'
import { LogsList } from '@/features/admin/components/LogsList'
import { renderRouted, screen, waitFor, within } from '@/test/render'

/**
 * The audit log table (with its detail drawer) and the directors table — a
 * `DataTable` over a paginated endpoint each, driven through a mocked axios so
 * the real query hooks, filters and row actions run end to end.
 */

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

const DIRECTORS = [
  {
    id: 1,
    institutional_code: 'D-001',
    user_id: 10,
    department_id: 3,
    user: { id: 10, email: 'ada@ufps.edu.co', name: 'Ada Lovelace', avatar_url: '' },
    department: { id: 3, name: 'Sistemas', code: 'SIS' },
    active: true,
    created_at: '2028-01-10T00:00:00Z',
    updated_at: '2028-01-10T00:00:00Z',
  },
]

const AUDIT_LOGS = [
  {
    id: 5,
    user_id: 10,
    user: { id: 10, name: 'Ada Lovelace', email: 'ada@ufps.edu.co', avatar_url: null },
    table_name: 'teachers',
    operation: 'UPDATE',
    element: 'Docente #7',
    description: 'Actualizó el correo',
    created_at: '2028-02-01T00:00:00Z',
    updated_at: '2028-02-01T00:00:00Z',
  },
]

/** One page of results, in the envelope the axios interceptor hands back. */
function page(rows: unknown[]) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages: 1, limit: 10 } }
}

beforeEach(() => {
  vi.clearAllMocks()

  mockApi.get.mockImplementation((url: string) => {
    if (url.startsWith('/directors')) return Promise.resolve(page(DIRECTORS))
    if (url === '/audits/5') return Promise.resolve({ data: { ...AUDIT_LOGS[0], element_data: { email: 'ada@ufps.edu.co' } } })
    if (url.startsWith('/audits')) return Promise.resolve(page(AUDIT_LOGS))

    return Promise.resolve(page([]))
  })

  mockApi.delete.mockResolvedValue({ data: undefined })
})

/** Opens the row menu of the row whose text contains `rowText`. */
async function openRowMenu(user: ReturnType<typeof userEvent.setup>, rowText: string) {
  const row = (await screen.findByText(rowText)).closest('tr')!
  await user.click(within(row).getByRole('button', { name: 'Acciones' }))
}

describe('DirectorsList', () => {
  it('shows what the endpoint answered', async () => {
    renderRouted(<DirectorsList />)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('D-001')).toBeInTheDocument()
    expect(screen.getByText('Sistemas')).toBeInTheDocument()
  })

  it('asks before deleting, and only then calls the endpoint', async () => {
    const user = userEvent.setup()

    renderRouted(<DirectorsList />)
    await openRowMenu(user, 'Ada Lovelace')
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))

    expect(mockApi.delete).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Ada Lovelace')
    expect(dialog).toHaveTextContent('Sistemas')

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith('/directors/1'))
  })

  it('searches on the server rather than filtering the page in the browser', async () => {
    const user = userEvent.setup()

    renderRouted(<DirectorsList />)
    await screen.findByText('Ada Lovelace')

    await user.type(screen.getByRole('textbox'), 'ada')

    await waitFor(
      () =>
        expect(
          mockApi.get.mock.calls.some(
            ([url, config]) =>
              String(url).startsWith('/directors') && config?.params?.search === 'ada',
          ),
        ).toBe(true),
      { timeout: 2000 },
    )
  })
})

describe('LogsList', () => {
  it('shows what the endpoint answered', async () => {
    renderRouted(<LogsList />)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Docentes')).toBeInTheDocument()
  })

  it('opens the detail drawer for a row and shows its element data', async () => {
    const user = userEvent.setup()

    renderRouted(<LogsList />)
    await openRowMenu(user, 'Ada Lovelace')
    await user.click(await screen.findByRole('menuitem', { name: 'Ver detalle' }))

    expect(await screen.findByText('Registro de auditoría #5')).toBeInTheDocument()
    expect(screen.getByText('Actualizó el correo')).toBeInTheDocument()
    expect(screen.getByText(/"email": "ada@ufps.edu.co"/)).toBeInTheDocument()
  })
})

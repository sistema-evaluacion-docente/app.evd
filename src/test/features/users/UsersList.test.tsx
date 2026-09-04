import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { UsersList } from '@/features/users/components/UsersList'
import { renderRouted, screen, waitFor, within } from '@/test/render'

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

const USERS = [
  {
    id: 1,
    uid: 'u1',
    institutional_code: 'U-001',
    email: 'ada@ufps.edu.co',
    name: 'Ada Lovelace',
    active: true,
    department_id: null,
    department_name: null,
    roles: ['DOCENTE'],
    avatar_url: '',
    teacher_id: null,
    created_at: '2028-01-10T00:00:00Z',
    updated_at: '2028-01-10T00:00:00Z',
  },
]

function page(rows: unknown[]) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages: 1, limit: 10 } }
}

beforeEach(() => {
  vi.clearAllMocks()

  mockApi.get.mockImplementation((url: string) => {
    if (url.startsWith('/users')) return Promise.resolve(page(USERS))
    return Promise.resolve(page([]))
  })

  mockApi.put.mockResolvedValue({ data: {} })
})

describe('UsersList', () => {
  it('shows what the endpoint answered', async () => {
    renderRouted(<UsersList />)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('U-001')).toBeInTheDocument()
    expect(screen.getByText('Docente')).toBeInTheDocument()
  })

  it('edits a user, toggling a role and saving through the drawer', async () => {
    const user = userEvent.setup()

    renderRouted(<UsersList />)
    const row = (await screen.findByText('Ada Lovelace')).closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Acciones' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))

    expect(await screen.findByText('Editar usuario: Ada Lovelace')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Administrador' }))
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith(
        '/users/1',
        expect.objectContaining({
          name: 'Ada Lovelace',
          roles: expect.arrayContaining(['DOCENTE', 'ADMIN']),
        }),
      ),
    )
  })

  it('searches on the server rather than filtering the page in the browser', async () => {
    const user = userEvent.setup()

    renderRouted(<UsersList />)
    await screen.findByText('Ada Lovelace')

    await user.type(screen.getByRole('textbox'), 'ada')

    await waitFor(
      () =>
        expect(
          mockApi.get.mock.calls.some(
            ([url, config]) => String(url).startsWith('/users') && config?.params?.search === 'ada',
          ),
        ).toBe(true),
      { timeout: 2000 },
    )
  })
})

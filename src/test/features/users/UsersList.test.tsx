import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { UsersList } from '@/features/users/components/UsersList'
import { renderRouted, screen, waitFor, within } from '@/test/render'

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const { toast } = await import('sonner')

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

const DEPARTMENTS = [
  { id: 7, name: 'Sistemas' },
  { id: 14, name: 'Ciencias Agrícolas y de la Tierra' },
  { id: 15, name: 'Ciencias Agricolas y Pecuarias' },
]

/** A director of department 15 whose teacher record was left in 14. */
const MISPLACED_DIRECTOR = {
  ...USERS[0],
  roles: ['DOCENTE', 'DIRECTOR DE DEPARTAMENTO'],
  department_id: 15,
  department_name: 'Ciencias Agricolas y Pecuarias',
  teacher_id: 146,
  teacher_department_id: 14,
}

function mockBackend(user: Record<string, unknown> = USERS[0]) {
  mockApi.get.mockImplementation((url: string) => {
    if (url.startsWith('/users/by-id/')) return Promise.resolve({ data: user })
    if (url.startsWith('/users')) return Promise.resolve(page([user]))
    if (url.startsWith('/departments')) return Promise.resolve(page(DEPARTMENTS))
    return Promise.resolve(page([]))
  })
}

async function openEditDrawer(user: ReturnType<typeof userEvent.setup>) {
  const row = (await screen.findByText('Ada Lovelace')).closest('tr')!
  await user.click(within(row).getByRole('button', { name: 'Acciones' }))
  await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
  expect(await screen.findByText('Editar usuario: Ada Lovelace')).toBeInTheDocument()
}

beforeEach(() => {
  vi.clearAllMocks()
  mockBackend()
  mockApi.put.mockResolvedValue({ data: {} })
  mockApi.patch.mockResolvedValue({ data: {} })
})

describe('UsersList', () => {
  it('shows what the endpoint answered', async () => {
    renderRouted(<UsersList />)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('U-001')).toBeInTheDocument()
    expect(screen.getByText('Docente')).toBeInTheDocument()
  })

  it('edits name, email, code and roles in a single request by id', async () => {
    const user = userEvent.setup()

    renderRouted(<UsersList />)
    await openEditDrawer(user)

    const email = screen.getByLabelText(/Correo institucional/)
    await user.clear(email)
    await user.type(email, 'Ada.L@ufps.edu.co')
    await user.click(screen.getByRole('button', { name: 'Administrador' }))
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith('/users/by-id/1', {
        name: 'Ada Lovelace',
        email: 'ada.l@ufps.edu.co',
        institutional_code: 'U-001',
        roles: expect.arrayContaining(['DOCENTE', 'ADMIN']),
        active: true,
      }),
    )
    // Un departamento sin tocar no se reenvía.
    expect(mockApi.put.mock.calls[0][1]).not.toHaveProperty('department_id')
    expect(mockApi.patch).not.toHaveBeenCalled()
  })

  it('cierra al guardar y, al reabrir, trae los datos actuales del usuario', async () => {
    const user = userEvent.setup()

    // El guardado cambia lo que el servidor devuelve de ahí en adelante.
    mockApi.put.mockImplementation(async () => {
      mockBackend({ ...USERS[0], name: 'Ada King' })
      return { data: {} }
    })

    renderRouted(<UsersList />)
    await openEditDrawer(user)
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(screen.queryByText('Editar usuario: Ada Lovelace')).not.toBeInTheDocument(),
    )

    const row = (await screen.findByText('Ada King')).closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Acciones' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))

    await waitFor(() => expect(screen.getByLabelText(/Nombre completo/)).toHaveValue('Ada King'))
  })

  it("prefills a director's teacher department, not the one they direct", async () => {
    const user = userEvent.setup()
    mockBackend(MISPLACED_DIRECTOR)

    renderRouted(<UsersList />)
    await openEditDrawer(user)

    expect(screen.getByRole('combobox', { name: /Departamento/ })).toHaveTextContent(
      'Ciencias Agrícolas y de la Tierra',
    )
  })

  it("moves a director's teacher record to the department they direct", async () => {
    const user = userEvent.setup()
    mockBackend(MISPLACED_DIRECTOR)

    renderRouted(<UsersList />)
    await openEditDrawer(user)

    await user.click(screen.getByRole('combobox', { name: /Departamento/ }))
    await user.click(await screen.findByRole('option', { name: 'Ciencias Agricolas y Pecuarias' }))
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith(
        '/users/by-id/1',
        expect.objectContaining({ department_id: 15 }),
      ),
    )
  })

  it('edita también a quien nunca ha iniciado sesión (sin uid)', async () => {
    const user = userEvent.setup()
    mockBackend({ ...USERS[0], uid: null as unknown as string })

    renderRouted(<UsersList />)
    await openEditDrawer(user)
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith('/users/by-id/1', expect.any(Object)),
    )
  })

  it('rechaza un correo fuera del dominio institucional sin llamar a la API', async () => {
    const user = userEvent.setup()

    renderRouted(<UsersList />)
    await openEditDrawer(user)

    const email = screen.getByLabelText(/Correo institucional/)
    await user.clear(email)
    await user.type(email, 'ada@gmail.com')
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    expect(toast.error).toHaveBeenCalledWith('El correo debe terminar en @ufps.edu.co')
    expect(mockApi.put).not.toHaveBeenCalled()
  })

  it('filtra por el departamento de la URL y lo nombra en el aviso', async () => {
    renderRouted(<UsersList />, { path: '/admin/usuarios?departamento=7' })

    expect(await screen.findByText('Sistemas')).toBeInTheDocument()
    expect(screen.getByText(/Usuarios del departamento/)).toBeInTheDocument()

    await waitFor(() =>
      expect(
        mockApi.get.mock.calls.some(
          ([url, config]) => url === '/users/' && config?.params?.department_id === 7,
        ),
      ).toBe(true),
    )
  })

  it('quita el filtro de departamento y vuelve a listar a todos', async () => {
    const user = userEvent.setup()

    const { history } = renderRouted(<UsersList />, { path: '/admin/usuarios?departamento=7' })
    await user.click(await screen.findByRole('button', { name: /Quitar filtro/ }))

    expect(screen.queryByText(/Usuarios del departamento/)).not.toBeInTheDocument()
    expect(history.at(-1)).not.toContain('departamento')
    await waitFor(() => {
      const [, config] = mockApi.get.mock.calls.filter(([url]) => url === '/users/').at(-1)!
      expect(config?.params).not.toHaveProperty('department_id')
    })
  })

  it('ignora un departamento que no es un id válido', async () => {
    renderRouted(<UsersList />, { path: '/admin/usuarios?departamento=abc' })

    await screen.findByText('Ada Lovelace')

    expect(screen.queryByText(/Usuarios del departamento/)).not.toBeInTheDocument()
    const usersCalls = mockApi.get.mock.calls.filter(([url]) => url === '/users/')
    expect(usersCalls.every(([, config]) => config?.params?.department_id === undefined)).toBe(true)
  })

  it('filtra por rol en el servidor', async () => {
    const user = userEvent.setup()

    renderRouted(<UsersList />)
    await screen.findByText('Ada Lovelace')

    await user.click(screen.getByRole('button', { name: /Filtros/ }))
    await user.click(await screen.findByRole('combobox', { name: 'Rol' }))
    await user.click(await screen.findByRole('option', { name: 'Decano' }))

    await waitFor(
      () =>
        expect(
          mockApi.get.mock.calls.some(
            ([url, config]) =>
              url === '/users/' && JSON.stringify(config?.params?.roles) === '["DECANO"]',
          ),
        ).toBe(true),
      { timeout: 2000 },
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

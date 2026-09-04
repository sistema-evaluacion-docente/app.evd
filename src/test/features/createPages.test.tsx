import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { DepartmentsPage } from '@/features/departments/pages/DepartmentsPage'
import { FacultiesPage } from '@/features/faculties/pages/FacultiesPage'
import { ProgramsPage } from '@/features/programs/pages/ProgramsPage'
import TeachersPage from '@/features/teachers/pages/TeachersPage'
import UsersPage from '@/features/users/pages/UsersPage'
import { renderRouted, screen, waitFor } from '@/test/render'

/**
 * The five "catalogue" pages: a `PageTitle` action that opens a create
 * drawer, over a list already tested on its own — so the list here is a
 * stub, and what's pinned down is the page's own create flow reaching the
 * right endpoint with the right payload.
 */

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/features/programs/components', () => ({ ProgramsList: () => <div /> }))
vi.mock('@/features/faculties/components', () => ({ FacultiesList: () => <div /> }))
vi.mock('@/features/departments/components', () => ({ DepartmentsList: () => <div /> }))
vi.mock('@/features/users/components', () => ({ UsersList: () => <div /> }))
vi.mock('@/features/teachers/components', () => ({ TeachersList: () => <div /> }))

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { department_id: 3 } }),
}))

const mockApi = vi.mocked(api)

function page(rows: unknown[]) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages: 1, limit: 10 } }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockResolvedValue(page([]))
  mockApi.post.mockResolvedValue({ data: {} })
})

describe('ProgramsPage', () => {
  it('creates a program from the drawer', async () => {
    const user = userEvent.setup()
    renderRouted(<ProgramsPage />)

    expect(screen.getByText('Programas académicos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear programa' }))
    await user.type(await screen.findByLabelText(/Nombre del programa/), 'Sistemas')
    await user.type(screen.getByLabelText(/Código/), 'IS')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith('/programs/', { name: 'Sistemas', code: 'IS' }),
    )
  })
})

describe('FacultiesPage', () => {
  it('creates a faculty from the drawer', async () => {
    const user = userEvent.setup()
    renderRouted(<FacultiesPage />)

    await user.click(screen.getByRole('button', { name: 'Crear facultad' }))
    await user.type(await screen.findByLabelText(/Nombre de la facultad/), 'Ingeniería')
    await user.type(screen.getByLabelText(/Código/), 'ING')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith('/faculties/', { name: 'Ingeniería', code: 'ING' }),
    )
  })
})

describe('DepartmentsPage', () => {
  it('creates a department, picking a faculty fetched for the dropdown', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/faculties'))
        return Promise.resolve(page([{ id: 2, name: 'Ingeniería', code: 'ING' }]))
      return Promise.resolve(page([]))
    })
    const user = userEvent.setup()
    renderRouted(<DepartmentsPage />)

    await user.click(screen.getByRole('button', { name: 'Crear departamento' }))
    await user.type(await screen.findByLabelText(/Nombre del departamento/), 'Sistemas')
    await user.type(screen.getByLabelText(/Código/), '52')
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Ingeniería' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith('/departments/', {
        name: 'Sistemas',
        code: '52',
        faculty_id: 2,
      }),
    )
  })
})

describe('TeachersPage', () => {
  it('creates a teacher tied to the director own department', async () => {
    const user = userEvent.setup()
    renderRouted(<TeachersPage />)

    await user.click(screen.getByRole('button', { name: 'Crear docente' }))
    await user.type(await screen.findByLabelText(/Nombre completo/), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/Correo institucional/), 'ada@ufps.edu.co')
    await user.type(screen.getByLabelText(/Código institucional/), 'DOC-1')
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Cátedra' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith(
        '/teachers/with-user',
        expect.objectContaining({ name: 'Ada Lovelace', department_id: 3 }),
      ),
    )
  })
})

describe('UsersPage', () => {
  it('refuses an email outside the institutional domain', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    renderRouted(<UsersPage />)

    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))
    await user.type(await screen.findByLabelText(/Nombre completo/), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/Correo institucional/), 'ada@gmail.com')
    await user.type(screen.getByLabelText(/Código institucional/), '115')
    await user.click(screen.getByRole('button', { name: 'Administrador' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('El correo debe terminar en @ufps.edu.co'),
    )
    expect(mockApi.post).not.toHaveBeenCalledWith('/users/', expect.anything())
  })

  it('creates a user with a lower-cased institutional email', async () => {
    const user = userEvent.setup()
    renderRouted(<UsersPage />)

    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))
    await user.type(await screen.findByLabelText(/Nombre completo/), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/Correo institucional/), 'Ada@UFPS.edu.co')
    await user.type(screen.getByLabelText(/Código institucional/), '115')
    await user.click(screen.getByRole('button', { name: 'Administrador' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith(
        '/users/',
        expect.objectContaining({ email: 'ada@ufps.edu.co', roles: ['ADMIN'] }),
      ),
    )
  })
})

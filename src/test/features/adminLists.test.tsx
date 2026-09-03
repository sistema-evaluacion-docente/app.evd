import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { DepartmentsList } from '@/features/departments/components/DepartmentsList'
import { FacultiesList } from '@/features/faculties/components/FacultiesList'
import { ProgramsList } from '@/features/programs/components/ProgramsList'
import { renderRouted, screen, waitFor, within } from '@/test/render'

/**
 * The three admin catalogue tables — faculties, departments, programs — are the
 * same screen three times: a `DataTable` over a paginated endpoint, with an
 * edit drawer and a delete confirmation hanging off the row menu.
 *
 * They are driven here through a mocked axios rather than mocked query hooks,
 * so what runs is the real path from the component down through its `api`
 * module: the row is what the endpoint answered, and the edit lands on the URL
 * the backend actually exposes.
 */

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

const FACULTIES = [
  {
    id: 2,
    name: 'Ingeniería',
    code: 'ING',
    active: true,
    department_count: 4,
    created_at: '2028-01-10T00:00:00Z',
    updated_at: '2028-01-10T00:00:00Z',
  },
]

const DEPARTMENTS = [
  {
    id: 3,
    name: 'Sistemas',
    code: 'SIS',
    faculty_id: 2,
    active: true,
    director: { id: 7, name: 'Ada Lovelace', avatar_url: null },
    teacher_count: 12,
    created_at: '2028-01-10T00:00:00Z',
    updated_at: '2028-01-10T00:00:00Z',
  },
  {
    id: 4,
    name: 'Matemáticas',
    code: 'MAT',
    faculty_id: 2,
    active: false,
    director: null,
    teacher_count: 5,
    created_at: '2028-01-10T00:00:00Z',
    updated_at: '2028-01-10T00:00:00Z',
  },
]

const PROGRAMS = [
  {
    id: 5,
    name: 'Ingeniería de Sistemas',
    code: 'IS',
    active: true,
    created_at: '2028-01-10T00:00:00Z',
    updated_at: '2028-01-10T00:00:00Z',
  },
]

/** One page of results, in the envelope the axios interceptor hands back. */
function page(rows: unknown[]) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages: 1, limit: 10 } }
}

beforeEach(() => {
  vi.clearAllMocks()

  mockApi.get.mockImplementation((url: string) => {
    if (url.startsWith('/faculties')) return Promise.resolve(page(FACULTIES))
    if (url.startsWith('/departments')) return Promise.resolve(page(DEPARTMENTS))
    if (url.startsWith('/programs')) return Promise.resolve(page(PROGRAMS))

    return Promise.resolve(page([]))
  })

  mockApi.post.mockResolvedValue({ data: {} })
  mockApi.put.mockResolvedValue({ data: {} })
  mockApi.delete.mockResolvedValue({ data: undefined })
})

/** Opens the row menu of the row whose text contains `rowText`. */
async function openRowMenu(user: ReturnType<typeof userEvent.setup>, rowText: string) {
  const row = (await screen.findByText(rowText)).closest('tr')!
  await user.click(within(row).getByRole('button', { name: 'Acciones' }))
}

describe('FacultiesList', () => {
  it('shows what the endpoint answered', async () => {
    renderRouted(<FacultiesList />)

    expect(await screen.findByText('Ingeniería')).toBeInTheDocument()
    expect(screen.getByText('ING')).toBeInTheDocument()
  })

  it('edits a faculty through the drawer, landing on its own endpoint', async () => {
    const user = userEvent.setup()

    renderRouted(<FacultiesList />)
    await openRowMenu(user, 'Ingeniería')
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))

    const name = await screen.findByLabelText(/Nombre/)
    await user.clear(name)
    await user.type(name, 'Ingenierías')
    await user.click(screen.getByRole('button', { name: /Guardar|Actualizar/ }))

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith(
        '/faculties/2',
        expect.objectContaining({
          name: 'Ingenierías',
        }),
      ),
    )
  })

  it('asks before deleting, and only then calls the endpoint', async () => {
    const user = userEvent.setup()

    renderRouted(<FacultiesList />)
    await openRowMenu(user, 'Ingeniería')
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))

    // The dialog is the point: nothing has been deleted yet.
    expect(mockApi.delete).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /Eliminar/ }))

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith('/faculties/2'))
  })
})

describe('DepartmentsList', () => {
  it('lists departments with their director and teacher count', async () => {
    renderRouted(<DepartmentsList />)

    expect(await screen.findByText('Sistemas')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Matemáticas')).toBeInTheDocument()
  })

  it('offers to assign a director only on the department that has none', async () => {
    const user = userEvent.setup()

    renderRouted(<DepartmentsList />)

    await openRowMenu(user, 'Matemáticas')
    expect(await screen.findByRole('menuitem', { name: 'Asignar director' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Desasignar director' })).not.toBeInTheDocument()
  })

  it('offers to unassign on the one that has a director', async () => {
    const user = userEvent.setup()

    renderRouted(<DepartmentsList />)

    await openRowMenu(user, 'Sistemas')
    expect(await screen.findByRole('menuitem', { name: 'Desasignar director' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Asignar director' })).not.toBeInTheDocument()
  })

  it('unassigns a director behind a confirmation', async () => {
    const user = userEvent.setup()

    renderRouted(<DepartmentsList />)
    await openRowMenu(user, 'Sistemas')
    await user.click(await screen.findByRole('menuitem', { name: 'Desasignar director' }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /Desasignar|Confirmar/ }))

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith('/departments/3/director'))
  })

  it('deletes a department behind a confirmation', async () => {
    const user = userEvent.setup()

    renderRouted(<DepartmentsList />)
    await openRowMenu(user, 'Sistemas')
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /Eliminar/ }))

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith('/departments/3'))
  })

  it('searches on the server rather than filtering the page in the browser', async () => {
    const user = userEvent.setup()

    renderRouted(<DepartmentsList />)
    await screen.findByText('Sistemas')

    await user.type(screen.getByRole('textbox'), 'mate')

    await waitFor(
      () =>
        expect(
          mockApi.get.mock.calls.some(
            ([url, config]) =>
              String(url).startsWith('/departments') && config?.params?.search === 'mate',
          ),
        ).toBe(true),
      { timeout: 2000 },
    )
  })
})

describe('ProgramsList', () => {
  it('shows what the endpoint answered', async () => {
    renderRouted(<ProgramsList />)

    expect(await screen.findByText('Ingeniería de Sistemas')).toBeInTheDocument()
  })

  it('edits a program', async () => {
    const user = userEvent.setup()

    renderRouted(<ProgramsList />)
    await openRowMenu(user, 'Ingeniería de Sistemas')
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))

    const name = await screen.findByLabelText(/Nombre/)
    await user.clear(name)
    await user.type(name, 'Ing. de Sistemas')
    await user.click(screen.getByRole('button', { name: /Guardar|Actualizar/ }))

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith(
        '/programs/5',
        expect.objectContaining({ name: 'Ing. de Sistemas' }),
      ),
    )
  })
})

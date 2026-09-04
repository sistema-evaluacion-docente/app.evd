import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { AssignDirectorDrawer } from '@/features/departments/components/AssignDirectorDrawer'
import type { Department } from '@/features/departments/types'
import { renderRouted, screen, waitFor } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

const DEPARTMENT: Department = {
  id: 3,
  code: 'SIS',
  name: 'Sistemas',
  faculty_id: 1,
  active: true,
  director: null,
  teacher_count: 12,
  created_at: '2028-01-01',
  updated_at: '2028-01-01',
}

const USERS = [
  {
    id: 10,
    institutional_code: 'U-010',
    email: 'ada@ufps.edu.co',
    name: 'Ada Lovelace',
    active: true,
    department_id: 3,
    department_name: 'Sistemas',
    roles: ['DOCENTE'],
    avatar_url: '',
    teacher_id: 1,
    created_at: '2028-01-01',
    updated_at: '2028-01-01',
  },
]

function page(rows: unknown[], pages = 1) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages, limit: 5 } }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockResolvedValue(page(USERS))
  mockApi.post.mockResolvedValue({ data: undefined })
})

describe('AssignDirectorDrawer', () => {
  it('names the department in the description', async () => {
    renderRouted(
      <AssignDirectorDrawer department={DEPARTMENT} open onOpenChange={vi.fn()} />,
    )

    expect(
      await screen.findByText('Selecciona un director para el departamento Sistemas.'),
    ).toBeInTheDocument()
  })

  it('lists the eligible users, requesting only DOCENTE/DIRECTOR roles', async () => {
    renderRouted(<AssignDirectorDrawer department={DEPARTMENT} open onOpenChange={vi.fn()} />)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(
      mockApi.get.mock.calls.some(
        ([url, config]) =>
          url === '/users/' &&
          JSON.stringify(config?.params?.roles) ===
            JSON.stringify(['DOCENTE', 'DIRECTOR DE DEPARTAMENTO']),
      ),
    ).toBe(true)
  })

  it('shows the empty state when nothing matches', async () => {
    mockApi.get.mockResolvedValue(page([]))

    renderRouted(<AssignDirectorDrawer department={DEPARTMENT} open onOpenChange={vi.fn()} />)

    expect(await screen.findByText('No hay usuarios que coincidan.')).toBeInTheDocument()
  })

  it('shows an error state when the users fail to load', async () => {
    mockApi.get.mockRejectedValue(new Error('down'))

    renderRouted(<AssignDirectorDrawer department={DEPARTMENT} open onOpenChange={vi.fn()} />)

    expect(await screen.findByText('Error al cargar los usuarios.')).toBeInTheDocument()
  })

  it('disables assigning until a user is picked, then assigns them', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    renderRouted(
      <AssignDirectorDrawer department={DEPARTMENT} open onOpenChange={onOpenChange} />,
    )
    await screen.findByText('Ada Lovelace')

    const assign = screen.getByRole('button', { name: 'Asignar director' })
    expect(assign).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Ada Lovelace/ }))
    expect(assign).toBeEnabled()

    await user.click(assign)

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith('/departments/3/director', { user_id: 10 }),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('searches on the server and resets to the first page', async () => {
    const user = userEvent.setup()
    renderRouted(<AssignDirectorDrawer department={DEPARTMENT} open onOpenChange={vi.fn()} />)
    await screen.findByText('Ada Lovelace')

    await user.type(screen.getByRole('textbox', { name: 'Buscar usuario' }), 'ada')

    await waitFor(() =>
      expect(
        mockApi.get.mock.calls.some(
          ([url, config]) => url === '/users/' && config?.params?.search === 'ada',
        ),
      ).toBe(true),
    )
  })

  it('paginates through the results', async () => {
    mockApi.get.mockResolvedValue(page(USERS, 2))
    const user = userEvent.setup()
    renderRouted(<AssignDirectorDrawer department={DEPARTMENT} open onOpenChange={vi.fn()} />)
    await screen.findByText('Página 1 de 2')

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))

    await waitFor(() =>
      expect(
        mockApi.get.mock.calls.some(
          ([url, config]) => url === '/users/' && config?.params?.page === 2,
        ),
      ).toBe(true),
    )
  })

  it('closes on cancel', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    renderRouted(<AssignDirectorDrawer department={DEPARTMENT} open onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { CommentsList } from '@/features/comments/components/CommentsList'
import { EvaluationsList } from '@/features/evaluations/components/EvaluationsList'
import { TeachersList } from '@/features/teachers/components/TeachersList'
import { renderRouted, screen, waitFor, within } from '@/test/render'

/**
 * The three working lists a director spends most of their time in: the uploaded
 * evaluations, the teachers of the department and the classified comments.
 *
 * Driven through a mocked axios so the real query hooks and filter plumbing run
 * — what each case pins down is the filter reaching the backend and the row
 * action landing on the right endpoint.
 */

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/features/auth', () => ({
  ROLE: { ADMIN: 'ADMIN', TEACHER: 'DOCENTE', DEPARTMENT_DIRECTOR: 'DIRECTOR DE DEPARTAMENTO' },
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ selectedRole: 'DIRECTOR DE DEPARTAMENTO', user: { department_id: 3 } }),
}))

const mockApi = vi.mocked(api)

const PERIODS = [{ id: 4, name: '2028-1', code: '2028-1', active: true }]

const EVALUATIONS = [
  {
    id: 9,
    academic_period_id: 4,
    academic_period_name: '2028-1',
    academic_period_code: '2028-1',
    department_id: 3,
    pdf_url: 'e.pdf',
    active: true,
    status: 'COMPLETED',
    ai_status: 'ANALYZED',
    count: 12,
    overall_average: 4.25,
    created_at: '2028-02-01T00:00:00Z',
    updated_at: '2028-02-01T00:00:00Z',
  },
]

const TEACHERS = [
  {
    id: 4,
    institutional_code: 'A1',
    department_id: 3,
    contract_type: 'TIEMPO COMPLETO',
    user_id: 7,
    user: {
      id: 7,
      uid: 'u7',
      email: 'ada@ufps.edu.co',
      department_id: 3,
      department_name: 'Sistemas',
      name: 'Ada Lovelace',
      active: true,
      avatar_url: '',
      institutional_code: 'A1',
      roles: ['DOCENTE'],
    },
    active: true,
    overall_average: 4.5,
    high_risk_comments_count: 1,
    created_at: '2028-01-01T00:00:00Z',
    updated_at: '2028-01-01T00:00:00Z',
  },
]

const COMMENTS = [
  {
    id: 77,
    teacher_id: 4,
    evaluation_id: 9,
    academic_groups_id: 1,
    group_name: 'A',
    teacher_name: 'Ada Lovelace',
    teacher_avatar_url: '',
    course_name: 'Cálculo',
    original_text: 'Explica muy bien, pero califica lento.',
    risk_level: { id: 1, name: 'Bajo', color_hex: '#1baf7a' },
    risk_score: 0.2,
    pedagogical_categories: [{ id: 1, code: 'LABEL_0', name: 'Conocimiento', score: 0.9 }],
  },
]

function page(rows: unknown[], pages = 1) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages, limit: 10 } }
}

beforeEach(() => {
  vi.clearAllMocks()

  mockApi.get.mockImplementation((url: string) => {
    if (url.includes('/academic-periods')) return Promise.resolve({ data: PERIODS })
    if (url.startsWith('/evaluations')) return Promise.resolve(page(EVALUATIONS))
    if (url.includes('/teachers')) return Promise.resolve(page(TEACHERS))
    if (url.startsWith('/comments')) return Promise.resolve(page(COMMENTS))

    return Promise.resolve(page([]))
  })

  mockApi.post.mockResolvedValue({ data: {} })
  mockApi.put.mockResolvedValue({ data: {} })
  mockApi.patch.mockResolvedValue({ data: {} })
  mockApi.delete.mockResolvedValue({ data: null })
})

/** Opens the row menu of the row whose text contains `rowText`. */
async function openRowMenu(user: ReturnType<typeof userEvent.setup>, rowText: string) {
  const row = (await screen.findByText(rowText)).closest('tr')!
  await user.click(within(row).getByRole('button', { name: 'Acciones' }))
}

/** Whether any request to `path` carried `params` matching `expected`. */
function askedWith(path: string, expected: Record<string, unknown>) {
  return mockApi.get.mock.calls.some(
    ([url, config]) =>
      String(url).startsWith(path) &&
      Object.entries(expected).every(([key, value]) => config?.params?.[key] === value),
  )
}

describe('EvaluationsList', () => {
  it('lists the uploaded evaluations of the department', async () => {
    renderRouted(<EvaluationsList />)

    expect(await screen.findByText('2028-1')).toBeInTheDocument()
    expect(screen.getByText('Docentes')).toBeInTheDocument()
  })

  it('deactivates an evaluation from the row menu', async () => {
    const user = userEvent.setup()

    renderRouted(<EvaluationsList />)
    await openRowMenu(user, '2028-1')
    await user.click(await screen.findByRole('menuitem', { name: 'Desactivar' }))

    await waitFor(() =>
      expect(mockApi.patch).toHaveBeenCalledWith('/evaluations/9/status', { active: false }),
    )
  })

  it('asks before deleting one, and only then calls the endpoint', async () => {
    const user = userEvent.setup()

    renderRouted(<EvaluationsList />)
    await openRowMenu(user, '2028-1')
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))

    expect(mockApi.delete).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /Eliminar/ }))

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith('/evaluations/9'))
  })

  it('offers the AI analysis only where it has not run yet', async () => {
    const user = userEvent.setup()

    renderRouted(<EvaluationsList />)
    await openRowMenu(user, '2028-1')

    // This one is already ANALYZED.
    expect(screen.queryByRole('menuitem', { name: 'Analizar con IA' })).not.toBeInTheDocument()
  })

  it('searches on the server', async () => {
    const user = userEvent.setup()

    renderRouted(<EvaluationsList />)
    await screen.findByText('2028-1')

    await user.type(screen.getByRole('textbox'), '2028')

    await waitFor(() => expect(askedWith('/evaluations', { search: '2028' })).toBe(true), {
      timeout: 2000,
    })
  })
})

describe('TeachersList', () => {
  it('lists the teachers of the department for the selected period', async () => {
    renderRouted(<TeachersList />, { path: '/docentes?period=4' })

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('TIEMPO COMPLETO')).toBeInTheDocument()
  })

  it('scopes the request to the signed-in director’s department', async () => {
    renderRouted(<TeachersList />, { path: '/docentes?period=4' })

    await screen.findByText('Ada Lovelace')

    expect(askedWith('/teachers/with-averages', { department_id: 3 })).toBe(true)
  })

  it('edits a teacher from the row menu', async () => {
    const user = userEvent.setup()

    renderRouted(<TeachersList />, { path: '/docentes?period=4' })
    await openRowMenu(user, 'Ada Lovelace')
    await user.click(await screen.findByRole('menuitem', { name: 'Editar docente' }))

    const name = await screen.findByLabelText(/Nombre/)
    await user.clear(name)
    await user.type(name, 'Ada L.')
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /Guardar|Actualizar/ }),
    )

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith(
        '/teachers/4',
        expect.objectContaining({ name: 'Ada L.' }),
      ),
    )
  })

  it('searches on the server', async () => {
    const user = userEvent.setup()

    renderRouted(<TeachersList />, { path: '/docentes?period=4' })
    await screen.findByText('Ada Lovelace')

    await user.type(screen.getByRole('textbox'), 'ada')

    await waitFor(
      () => expect(askedWith('/teachers/with-averages', { search: 'ada' })).toBe(true),
      {
        timeout: 2000,
      },
    )
  })
})

describe('CommentsList', () => {
  it('shows the classified comments verbatim', async () => {
    renderRouted(<CommentsList />, { path: '/comentarios?period=4' })

    expect(await screen.findByText('Explica muy bien, pero califica lento.')).toBeInTheDocument()
  })

  it('says so when no comment matches the filters', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes('/academic-periods')) return Promise.resolve({ data: PERIODS })

      return Promise.resolve(page([]))
    })

    renderRouted(<CommentsList />, { path: '/comentarios?period=4' })

    expect(
      await screen.findByText('No hay comentarios que coincidan con los filtros aplicados.'),
    ).toBeInTheDocument()
  })

  it('takes the caller’s own empty message when it was given one', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes('/academic-periods')) return Promise.resolve({ data: PERIODS })

      return Promise.resolve(page([]))
    })

    renderRouted(<CommentsList emptyMessage="No hay comentarios de riesgo alto." />, {
      path: '/comentarios?period=4',
    })

    expect(await screen.findByText('No hay comentarios de riesgo alto.')).toBeInTheDocument()
  })

  it('carries the risk level from the URL into the request', async () => {
    renderRouted(<CommentsList />, { path: '/comentarios?period=4&riskLevel=3' })

    await screen.findByText('Explica muy bien, pero califica lento.')

    await waitFor(() => expect(askedWith('/comments/', { risk_level: 3 })).toBe(true))
  })

  it('searches the comment text on the server', async () => {
    const user = userEvent.setup()

    renderRouted(<CommentsList />, { path: '/comentarios?period=4' })
    await screen.findByText('Explica muy bien, pero califica lento.')

    await user.type(screen.getByLabelText('Buscar en los comentarios'), 'califica')

    await waitFor(() => expect(askedWith('/comments/', { search: 'califica' })).toBe(true), {
      timeout: 2000,
    })
  })

  it('pages through the results', async () => {
    const user = userEvent.setup()

    mockApi.get.mockImplementation((url: string) => {
      if (url.includes('/academic-periods')) return Promise.resolve({ data: PERIODS })
      if (url.startsWith('/comments')) return Promise.resolve(page(COMMENTS, 3))

      return Promise.resolve(page([]))
    })

    renderRouted(<CommentsList />, { path: '/comentarios?period=4' })
    await screen.findByText('Explica muy bien, pero califica lento.')

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))

    await waitFor(() => expect(askedWith('/comments/', { page: 2 })).toBe(true))
  })
})

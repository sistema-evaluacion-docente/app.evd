import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import type { DepartmentSubjectAverage } from '@/features/stats'
import { SubjectsList } from '@/features/subjects/components/SubjectsList'
import { renderRouted, screen, waitFor, within } from '@/test/render'

/**
 * The department's subjects for one period, each row expanding into the groups
 * behind its average. Driven through a mocked axios so the real query hooks and
 * the period selector run.
 */

vi.mock('@/config/axios', () => ({ default: { get: vi.fn(), put: vi.fn() } }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

const PERIODS = [
  { id: 4, name: '2028-1', code: '2028-1', active: true },
  { id: 3, name: '2027-2', code: '2027-2', active: false },
]

function group(overrides: Partial<DepartmentSubjectAverage['groups'][number]> = {}) {
  return {
    academic_group_id: 1,
    group_name: 'A',
    course_id: 8,
    course_code: 'IS101',
    teacher_id: 4,
    teacher_name: 'Ada Lovelace',
    teacher_avatar_url: '',
    academic_period_id: 4,
    academic_period_code: '2028-1',
    overall_average: 4.3,
    respondent_count: 20,
    modality: 'PRESENCIAL',
    ...overrides,
  }
}

const SUBJECTS = [
  {
    course_name: 'Cálculo',
    course_codes: ['IS101'],
    teacher_count: 2,
    group_count: 2,
    overall_average: 4.1,
    total_respondents: 35,
    groups: [
      group(),
      group({
        academic_group_id: 2,
        group_name: 'B',
        teacher_id: 5,
        teacher_name: 'Grace Hopper',
        overall_average: 3.9,
        modality: 'DISTANCIA',
      }),
    ],
  },
  {
    course_name: 'Álgebra',
    course_codes: ['IS102'],
    teacher_count: 1,
    group_count: 1,
    overall_average: 3.2,
    total_respondents: 15,
    groups: [group({ academic_group_id: 3, course_code: 'IS102', modality: null })],
  },
] as unknown as DepartmentSubjectAverage[]

/** One page of subjects, plus whatever the period selector needs. */
function serve({ subjects = SUBJECTS, pages = 1, periods = PERIODS, fail = false } = {}) {
  mockApi.get.mockImplementation((url: string) => {
    if (url.includes('/academic-periods')) return Promise.resolve({ data: periods })

    if (url.includes('period-range/subjects')) {
      if (fail) return Promise.reject(new Error('El servidor no respondió'))

      return Promise.resolve({ data: subjects, pagination: { pages, page: 1, limit: 10 } })
    }

    return Promise.resolve({ data: [] })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  serve()
  mockApi.put.mockResolvedValue({ data: {} })
})

/** The subject list only queries once the period selector has resolved a period. */
async function renderList(path = '/materias?period=4') {
  const rendered = renderRouted(<SubjectsList />, { path })

  await screen.findByText('Cálculo')

  return rendered
}

/** Opens a subject row, whose trigger wraps the subject name. */
async function expand(subjectName: string) {
  await userEvent.setup().click(screen.getByText(subjectName).closest('button')!)
}

describe('SubjectsList', () => {
  it('shows each subject with the average behind it', async () => {
    await renderList()

    expect(screen.getByText('Cálculo')).toBeInTheDocument()
    expect(screen.getByText('Álgebra')).toBeInTheDocument()
  })

  it('asks for the selected period at both ends of the range', async () => {
    await renderList()

    const [, config] = mockApi.get.mock.calls.find(([url]) =>
      String(url).includes('period-range/subjects'),
    )!

    expect((config as { params: Record<string, string> }).params).toMatchObject({
      start_period: '2028-1',
      end_period: '2028-1',
    })
  })

  it('says so when the department has no periods at all', async () => {
    serve({ periods: [] })

    renderRouted(<SubjectsList />, { path: '/materias' })

    expect(
      await screen.findByText('No existen periodos académicos para mostrar.'),
    ).toBeInTheDocument()
  })

  it('says so when the period has no subjects with an average', async () => {
    serve({ subjects: [] })

    renderRouted(<SubjectsList />, { path: '/materias?period=4' })

    expect(
      await screen.findByText('No hay materias con promedio para este periodo.'),
    ).toBeInTheDocument()
  })

  it('surfaces a failed request instead of an empty list', async () => {
    serve({ fail: true })

    renderRouted(<SubjectsList />, { path: '/materias?period=4' })

    expect(await screen.findByText('El servidor no respondió')).toBeInTheDocument()
  })

  it('expands a subject into its course codes, and those into their teachers', async () => {
    const user = userEvent.setup()

    await renderList()

    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument()

    await expand('Cálculo')

    // One code, two teachers behind it — so the code is its own level.
    expect(await screen.findByText('IS101')).toBeInTheDocument()
    expect(screen.getByText('2 docentes')).toBeInTheDocument()
    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument()

    await user.click(screen.getByText('IS101').closest('button')!)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
  })

  it('links straight to the detail when a code has a single group', async () => {
    await renderList()
    await expand('Álgebra')

    // Nothing to choose between, so the row is the link rather than a level.
    expect(await screen.findByText('IS102 - A')).toBeInTheDocument()
    expect(screen.getByText('Ver detalle')).toBeInTheDocument()
  })

  it('labels how each group is taught, and prints nothing when it is unknown', async () => {
    const user = userEvent.setup()

    await renderList()
    await expand('Cálculo')
    await user.click((await screen.findByText('IS101')).closest('button')!)

    expect(await screen.findByText('Presencial')).toBeInTheDocument()
    expect(screen.getByText('Distancia')).toBeInTheDocument()

    await expand('Álgebra')

    // The second subject's only group carries no modality, so no badge is drawn.
    await screen.findByText('IS102 - A')
    expect(screen.getAllByText('Presencial')).toHaveLength(1)
  })

  it('searches subjects on the server', async () => {
    const user = userEvent.setup()

    await renderList()
    await user.type(screen.getByLabelText('Buscar materia'), 'álge')

    await waitFor(
      () =>
        expect(
          mockApi.get.mock.calls.some(
            ([url, config]) =>
              String(url).includes('period-range/subjects') && config?.params?.search === 'álge',
          ),
        ).toBe(true),
      { timeout: 2000 },
    )
  })

  it('searches teachers on a separate filter', async () => {
    const user = userEvent.setup()

    await renderList()
    await user.type(screen.getByLabelText('Buscar docente'), 'grace')

    await waitFor(
      () =>
        expect(
          mockApi.get.mock.calls.some(
            ([url, config]) =>
              String(url).includes('period-range/subjects') &&
              config?.params?.teacher_name === 'grace',
          ),
        ).toBe(true),
      { timeout: 2000 },
    )
  })

  it('hides the pager when everything fits on one page', async () => {
    await renderList()

    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument()
  })

  it('pages through the results', async () => {
    const user = userEvent.setup()

    serve({ pages: 3 })
    await renderList()

    expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText(/Página 2 de 3/)).toBeInTheDocument()
    await waitFor(() =>
      expect(
        mockApi.get.mock.calls.some(
          ([url, config]) =>
            String(url).includes('period-range/subjects') && config?.params?.page === 2,
        ),
      ).toBe(true),
    )
  })

  it('renames a subject, normalising the name to upper case', async () => {
    const user = userEvent.setup()

    await renderList()
    await user.click(screen.getByRole('button', { name: 'Editar materia Cálculo' }))

    const name = await screen.findByLabelText(/Nombre de la materia/)
    await user.clear(name)
    await user.type(name, 'Cálculo I')
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Guardar' }),
    )

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith(
        '/courses/8',
        expect.objectContaining({ name: 'CÁLCULO I' }),
      ),
    )
  })
})

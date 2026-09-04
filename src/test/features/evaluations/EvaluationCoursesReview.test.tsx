import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { EvaluationCoursesReview } from '@/features/evaluations/components/EvaluationCoursesReview'
import { renderRouted, screen, waitFor } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn(), put: vi.fn() } }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

function page(rows: unknown[], pages = 1) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages, limit: 100 } }
}

const SUBJECTS = [
  {
    course_name: 'CALCULO DIFERENC',
    course_codes: ['CAL'],
    teacher_count: 2,
    group_count: 2,
    overall_average: 4.1,
    total_respondents: 40,
    groups: [
      {
        academic_group_id: 1,
        group_name: 'A',
        course_id: 100,
        course_code: 'CAL',
        teacher_id: 7,
        teacher_name: 'Ada Lovelace',
        academic_period_id: 1,
        academic_period_code: '2028-1',
        overall_average: 4.2,
        respondent_count: 20,
      },
      {
        academic_group_id: 2,
        group_name: 'B',
        course_id: 100,
        course_code: 'CAL',
        teacher_id: 8,
        teacher_name: 'Grace Hopper',
        academic_period_id: 1,
        academic_period_code: '2028-1',
        overall_average: 4.0,
        respondent_count: 20,
      },
    ],
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockImplementation((url: string) => {
    if (url === '/stats/departments/period-range/subjects') return Promise.resolve(page(SUBJECTS))
    return Promise.resolve(page([]))
  })
  mockApi.put.mockResolvedValue({ data: {} })
})

describe('EvaluationCoursesReview', () => {
  it('flattens the report into one row per real course, with teacher/group counts', async () => {
    renderRouted(<EvaluationCoursesReview periodCode="2028-1" />)

    expect(await screen.findByText('CALCULO DIFERENC')).toBeInTheDocument()
    expect(screen.getByText('CAL · 2 docentes · 2 grupos')).toBeInTheDocument()
    expect(screen.getByText('1 materia')).toBeInTheDocument()
  })

  it('shows the empty state without a period code', async () => {
    mockApi.get.mockResolvedValue(page([]))

    renderRouted(<EvaluationCoursesReview />)

    expect(
      await screen.findByText('No se encontraron materias para este periodo.'),
    ).toBeInTheDocument()
  })

  it('renames a course, marking it updated', async () => {
    const user = userEvent.setup()
    renderRouted(<EvaluationCoursesReview periodCode="2028-1" />)
    await screen.findByText('CALCULO DIFERENC')

    await user.click(screen.getByRole('button', { name: 'Editar nombre de la materia CAL' }))
    const input = screen.getByRole('textbox', { name: 'Editar nombre de la materia CAL' })
    await user.clear(input)
    await user.type(input, 'Cálculo Diferencial')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith('/courses/100', { name: 'CÁLCULO DIFERENCIAL' }),
    )
    expect(await screen.findByText('Actualizada')).toBeInTheDocument()
  })

  it('searches on the server as the query is typed', async () => {
    const user = userEvent.setup()
    renderRouted(<EvaluationCoursesReview periodCode="2028-1" />)
    await screen.findByText('CALCULO DIFERENC')

    await user.type(screen.getByRole('textbox', { name: 'Buscar materia' }), 'calc')

    await waitFor(() =>
      expect(
        mockApi.get.mock.calls.some(
          ([url, config]) =>
            url === '/stats/departments/period-range/subjects' && config?.params?.search === 'calc',
        ),
      ).toBe(true),
    )
  })

  it('shows an inline error when the report fails to load', async () => {
    mockApi.get.mockRejectedValue(new Error('Reporte no disponible'))

    renderRouted(<EvaluationCoursesReview periodCode="2028-1" />)

    expect(await screen.findByText('Reporte no disponible')).toBeInTheDocument()
  })

  it('paginates when there is more than one page', async () => {
    mockApi.get.mockResolvedValue(page(SUBJECTS, 2))
    const user = userEvent.setup()
    renderRouted(<EvaluationCoursesReview periodCode="2028-1" />)
    await screen.findByText('Página 1 de 2')

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    await waitFor(() =>
      expect(
        mockApi.get.mock.calls.some(
          ([url, config]) =>
            url === '/stats/departments/period-range/subjects' && config?.params?.page === 2,
        ),
      ).toBe(true),
    )
  })
})

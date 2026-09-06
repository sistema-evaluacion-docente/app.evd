import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { TeacherPeriodInsights } from '@/features/teachers/components/TeacherPeriodInsights'
import { renderRouted, screen, within } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user: { teacher_id: 4 } }),
}))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const mockApi = vi.mocked(api)

const DIMENSIONS = [
  {
    dimension: 'Desempeño Docente',
    average: 4.5,
    questions: [{ code: '011', text: 'Asiste puntualmente a clase.', score: 4.5 }],
  },
]

const HISTORY = {
  items: [
    { evaluation_id: 9, period_id: 3, period_code: '2028-1', period_name: '2028-1', overall_average: 4.4, group_count: 1 },
    { evaluation_id: 8, period_id: 2, period_code: '2027-2', period_name: '2027-2', overall_average: 3.9, group_count: 1 },
  ],
  total: 2,
  page: 1,
  pages: 1,
  limit: 50,
}

function detail(periodCode: string, overallAverage: number) {
  return {
    teacher_id: 4,
    institutional_code: 'A1',
    name: 'Ada Lovelace',
    avatar_url: '',
    contract_type: 'TIEMPO COMPLETO',
    evaluation_id: periodCode === '2028-1' ? 9 : 8,
    period_code: periodCode,
    period_name: periodCode,
    overall_average: overallAverage,
    group_count: 1,
    courses: [
      {
        course_code: 'CAL',
        course_name: 'Cálculo I',
        group_name: 'A',
        respondent_count: 10,
        overall_average: overallAverage,
        dimensions: DIMENSIONS,
      },
    ],
    dimensions: DIMENSIONS,
  }
}

const MATRIX = {
  teacher_id: 4,
  evaluation_id: 9,
  courses: [{ course_name: 'Cálculo I', question_averages: { '011': 4.5 }, overall_average: 4.5 }],
  column_averages: { '011': 4.5 },
}

const COMMENTS = {
  teacher_id: 4,
  evaluation_id: 9,
  ai_status: 'ANALYZED',
  courses: [
    {
      course_code: 'CAL',
      course_name: 'Cálculo I',
      group_name: 'A',
      comments: [
        {
          id: 1,
          teacher_id: 4,
          evaluation_id: 9,
          academic_groups_id: 1,
          group_name: 'A',
          teacher_name: 'Ada Lovelace',
          teacher_avatar_url: '',
          course_name: 'Cálculo I',
          original_text: 'Buena clase',
          risk_level: { id: 1, name: 'BAJO', color_hex: '#22c55e' },
          risk_score: 0.1,
          pedagogical_categories: [],
          created_at: '2028-02-01T00:00:00Z',
          updated_at: '2028-02-01T00:00:00Z',
        },
      ],
    },
  ],
}

function mockEndpoints() {
  mockApi.get.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
    if (url === '/teachers/4/history') return Promise.resolve({ data: HISTORY })
    if (url === '/evaluations/teachers/4/detail') {
      const periodName = config?.params?.period_name as string
      return Promise.resolve({ data: detail(periodName, periodName === '2028-1' ? 4.4 : 3.4) })
    }
    if (url === '/stats/teachers/4/matrix') return Promise.resolve({ data: MATRIX })
    if (url.includes('/teachers/4/comments')) return Promise.resolve({ data: COMMENTS })

    return Promise.resolve({ data: null })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TeacherPeriodInsights', () => {
  it('renders nothing when the teacher has no evaluated period', async () => {
    mockApi.get.mockResolvedValue({ data: { ...HISTORY, items: [] } })

    const { container } = renderRouted(<TeacherPeriodInsights />)

    await vi.waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('shows the mover badge comparing the selected period to the previous one', async () => {
    mockEndpoints()

    renderRouted(<TeacherPeriodInsights />)

    expect(await screen.findByText(/Cálculo I \(\+1\.00\)/)).toBeInTheDocument()
  })

  it('feeds the same evaluation into the comments summary and the question matrix', async () => {
    mockEndpoints()

    renderRouted(<TeacherPeriodInsights />)

    expect(await screen.findByText('Por nivel de riesgo')).toBeInTheDocument()
    const matrixTrigger = screen.getByRole('button', { name: /Ver preguntas/ })
    expect(matrixTrigger).toHaveTextContent('Ver preguntas (1)')
  })

  it('shows the question matrix table once expanded', async () => {
    mockEndpoints()
    const user = userEvent.setup()

    renderRouted(<TeacherPeriodInsights />)
    await user.click(await screen.findByRole('button', { name: /Ver preguntas/ }))

    const row = (await screen.findByText('011')).closest('tr')!
    expect(within(row).getByText('Asiste puntualmente a clase.')).toBeInTheDocument()
    expect(within(row).getAllByText('4.50')).toHaveLength(2)
  })

  it('offers the period picker only when there is more than one period', async () => {
    mockEndpoints()

    renderRouted(<TeacherPeriodInsights />)

    expect(
      await screen.findByLabelText('Periodo del resumen de comentarios y preguntas'),
    ).toBeInTheDocument()
  })

  it('hides the picker with a single evaluated period', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/teachers/4/history') return Promise.resolve({ data: { ...HISTORY, items: HISTORY.items.slice(0, 1) } })
      if (url === '/evaluations/teachers/4/detail') return Promise.resolve({ data: detail('2028-1', 4.4) })
      if (url === '/stats/teachers/4/matrix') return Promise.resolve({ data: MATRIX })
      if (url.includes('/comments')) return Promise.resolve({ data: COMMENTS })
      return Promise.resolve({ data: null })
    })

    renderRouted(<TeacherPeriodInsights />)

    await screen.findByText('Por nivel de riesgo')
    expect(
      screen.queryByLabelText('Periodo del resumen de comentarios y preguntas'),
    ).not.toBeInTheDocument()
  })
})

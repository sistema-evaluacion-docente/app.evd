import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import EvaluationDimensionsPage from '@/features/evaluations/pages/EvaluationDimensionsPage'
import { useGetEvaluationDimensionsDetail } from '@/features/evaluations/api'
import type { EvaluationDimensionsDetail } from '@/features/evaluations/types'
import { renderRouted, screen } from '@/test/render'

vi.mock('@/features/evaluations/api', () => ({ useGetEvaluationDimensionsDetail: vi.fn() }))

vi.mock('@/features/teachers', () => ({ TeacherSelect: () => <div>TeacherSelect</div> }))
vi.mock('@/features/courses', () => ({ CourseSelect: () => <div>CourseSelect</div> }))

vi.mock('@/features/evaluations/components', () => ({
  EvaluationDimensionDetailCard: ({ dimension }: { dimension: { dimension: string } }) => (
    <div data-testid="dimension-card">{dimension.dimension}</div>
  ),
  EvaluationDimensionsChart: () => <div data-testid="dimensions-chart" />,
}))

const DETAIL: EvaluationDimensionsDetail = {
  evaluation_id: 9,
  period_code: '2028-1',
  period_name: '2028-1',
  department_average: 4.1,
  dimensions: [
    {
      dimension: 'Desempeño Docente',
      average: 4.1,
      below_threshold: false,
      questions: [],
      best_teacher: null,
      worst_teacher: null,
      ranking: [],
    } as unknown as EvaluationDimensionsDetail['dimensions'][number],
  ],
}

function mockDetail(data: EvaluationDimensionsDetail | undefined, overrides: Partial<ReturnType<typeof useGetEvaluationDimensionsDetail>> = {}) {
  vi.mocked(useGetEvaluationDimensionsDetail).mockReturnValue({
    data: data ? { data } : undefined,
    isLoading: false,
    isFetching: false,
    ...overrides,
  } as unknown as ReturnType<typeof useGetEvaluationDimensionsDetail>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EvaluationDimensionsPage', () => {
  it('shows the skeleton while loading', () => {
    mockDetail(undefined, { isLoading: true })

    const { container } = renderRouted(<EvaluationDimensionsPage />, {
      path: '/evaluaciones/9/dimensiones',
    })

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('reports the evaluation as not found', () => {
    mockDetail(undefined)

    renderRouted(<EvaluationDimensionsPage />, { path: '/evaluaciones/9/dimensiones' })

    expect(screen.getByText('No se encontró la evaluación.')).toBeInTheDocument()
  })

  it('renders the period, average and one card per dimension', () => {
    mockDetail(DETAIL)

    renderRouted(<EvaluationDimensionsPage />, { path: '/evaluaciones/9/dimensiones' })

    expect(screen.getByText('2028-1')).toBeInTheDocument()
    expect(screen.getByText('Promedio del departamento')).toBeInTheDocument()
    expect(screen.getByTestId('dimension-card')).toHaveTextContent('Desempeño Docente')
    expect(screen.getByTestId('dimensions-chart')).toBeInTheDocument()
  })

  it('shows the fetching indicator only while refetching', () => {
    mockDetail(DETAIL, { isFetching: true })

    renderRouted(<EvaluationDimensionsPage />, { path: '/evaluaciones/9/dimensiones' })

    expect(screen.getByText('Actualizando…')).toBeInTheDocument()
  })

  it('shows the empty state when the filters leave nothing', () => {
    mockDetail({ ...DETAIL, dimensions: [] })

    renderRouted(<EvaluationDimensionsPage />, { path: '/evaluaciones/9/dimensiones' })

    expect(
      screen.getByText('No hay resultados para los filtros seleccionados.'),
    ).toBeInTheDocument()
  })

  it('opens the filters panel with the teacher and course selects', async () => {
    mockDetail(DETAIL)
    const user = userEvent.setup()

    renderRouted(<EvaluationDimensionsPage />, { path: '/evaluaciones/9/dimensiones' })
    await user.click(screen.getByRole('button', { name: /Filtros/ }))

    expect(screen.getByText('TeacherSelect')).toBeInTheDocument()
    expect(screen.getByText('CourseSelect')).toBeInTheDocument()
  })
})

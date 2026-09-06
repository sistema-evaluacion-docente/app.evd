import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import type { DepartmentPeriodRangeStats } from '@/features/stats'
import { DepartmentPeriodRangeSummary } from '@/features/stats/components/DepartmentPeriodRangeSummary'
import { renderRouted, screen, waitFor } from '@/test/render'

/**
 * The department's own report — averages, dimensions and comment risk — for a
 * single period or a range of them. The range switch is the interesting part:
 * it changes which endpoint gets asked and swaps the comments card for a
 * per-period breakdown that fetches its own data.
 */

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const mockApi = vi.mocked(api)

const PERIODS = [
  { id: 2, name: '2027-1', code: '2027-1', active: false },
  { id: 3, name: '2027-2', code: '2027-2', active: false },
  { id: 4, name: '2028-1', code: '2028-1', active: true },
]

const DIMENSIONS = [
  'Desarrollo del Conocimiento',
  'Desempeño Docente',
  'Procesos de Evaluación',
  'Integración Interpersonal',
]

const STATS = {
  department_id: 3,
  department_name: 'Sistemas',
  department_code: 'SIS',
  start_period_code: '2028-1',
  end_period_code: '2028-1',
  periods: [
    { academic_period_id: 4, academic_period_code: '2028-1', academic_period_name: '2028-1' },
  ],
  overall_average: 4.25,
  total_respondents: 350,
  evaluation_count: 1,
  period_averages: [
    {
      academic_period_id: 4,
      academic_period_code: '2028-1',
      academic_period_name: '2028-1',
      overall_average: 4.25,
      total_respondents: 350,
      evaluation_count: 1,
    },
  ],
  dimensions: DIMENSIONS.map((dimension, index) => ({
    dimension,
    average: 4 + index * 0.1,
    percentage: 0.8 + index * 0.02,
  })),
  comments_risk_counts: { BAJO: 30, MEDIO: 8, ALTO: 2 },
  comments_pedagogical_category_counts: { LABEL_0: 12, LABEL_1: 9 },
} as unknown as DepartmentPeriodRangeStats

function serve({
  periods = PERIODS,
  stats = STATS as DepartmentPeriodRangeStats | null,
  fail = false,
} = {}) {
  mockApi.get.mockImplementation((url: string, config?: { params?: Record<string, string> }) => {
    if (url.includes('/academic-periods')) return Promise.resolve({ data: periods })

    if (url.includes('/stats/departments/period-range')) {
      if (fail) return Promise.reject(new Error('El servidor no respondió'))
      if (!stats) return Promise.resolve({ data: null })

      // The report echoes back the periods the range actually covers — the
      // per-period comment breakdown is driven off exactly that list.
      const { start_period: start, end_period: end } = config?.params ?? {}
      const covered = PERIODS.filter(
        (period) => period.code >= String(start) && period.code <= String(end),
      )

      return Promise.resolve({
        data: {
          ...stats,
          start_period_code: start,
          end_period_code: end,
          periods: covered.map((period) => ({
            academic_period_id: period.id,
            academic_period_code: period.code,
            academic_period_name: period.name,
          })),
        },
      })
    }

    return Promise.resolve({ data: [] })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  serve()
})

/** Every request the range endpoint received, newest last. */
function rangeCalls() {
  return mockApi.get.mock.calls
    .filter(([url]) => String(url).endsWith('/stats/departments/period-range'))
    .map(([, config]) => config as { params?: Record<string, string> })
}

describe('DepartmentPeriodRangeSummary', () => {
  it('defaults to the latest period, asking for it at both ends of the range', async () => {
    renderRouted(<DepartmentPeriodRangeSummary />)

    await screen.findByText('Sistemas')

    expect(rangeCalls()[0]?.params).toEqual({
      start_period: '2028-1',
      end_period: '2028-1',
    })
  })

  it('shows the department’s averages and its dimension profile', async () => {
    renderRouted(<DepartmentPeriodRangeSummary />)

    expect(await screen.findByText('Sistemas')).toBeInTheDocument()
    expect(screen.getByText('Promedios por dimensión pedagógica')).toBeInTheDocument()
    expect(screen.getByText('Resumen del departamento')).toBeInTheDocument()
  })

  it('says so when there are no academic periods at all', async () => {
    serve({ periods: [] })

    renderRouted(<DepartmentPeriodRangeSummary />)

    expect(
      await screen.findByText('No existen periodos académicos para mostrar.'),
    ).toBeInTheDocument()
  })

  it('says so when the selected range has no data', async () => {
    serve({ stats: null })

    renderRouted(<DepartmentPeriodRangeSummary />)

    expect(
      await screen.findByText('No hay datos para el rango de periodos seleccionado.'),
    ).toBeInTheDocument()
  })

  it('surfaces a failed request', async () => {
    serve({ fail: true })

    renderRouted(<DepartmentPeriodRangeSummary />)

    expect(await screen.findByText('El servidor no respondió')).toBeInTheDocument()
  })

  it('widens to a real range once the director asks to compare', async () => {
    const user = userEvent.setup()

    renderRouted(<DepartmentPeriodRangeSummary />)
    await screen.findByText('Sistemas')

    await user.click(screen.getByRole('switch', { name: /Comparar un rango/ }))

    // `defaultRangeSize` of 2 walks the start back one period from the end.
    // Asserted as "was asked" rather than "asked last", because the per-period
    // breakdown fires its own single-period requests right after.
    await waitFor(() =>
      expect(
        rangeCalls().some(
          (config) =>
            config?.params?.start_period === '2027-2' && config?.params?.end_period === '2028-1',
        ),
      ).toBe(true),
    )
  })

  it('breaks the comments down per period once a range is being compared', async () => {
    const user = userEvent.setup()

    renderRouted(<DepartmentPeriodRangeSummary />)
    await screen.findByText('Sistemas')

    await user.click(screen.getByRole('switch', { name: /Comparar un rango/ }))

    // The per-period breakdown fetches each period on its own.
    await waitFor(() => expect(rangeCalls().length).toBeGreaterThan(2))
  })

  it('offers the PDF of the report', async () => {
    renderRouted(<DepartmentPeriodRangeSummary />)

    await screen.findByText('Sistemas')

    expect(screen.getByRole('button', { name: /Descargar/i })).toBeInTheDocument()
  })
})

import { render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGetDepartmentPeriodBreakdowns } from '@/features/stats/api'
import { DepartmentDimensionsPeriodComparison } from '@/features/stats/components/DepartmentDimensionsPeriodComparison'
import type { DepartmentPeriodRangeStats, StatsPeriodRef } from '@/features/stats/types'

// Mocked wholesale rather than spread over the original: importing the real
// module pulls in the axios instance and, with it, the auth store.
vi.mock('@/features/stats/api', () => ({ useGetDepartmentPeriodBreakdowns: vi.fn() }))

const PERIODS: StatsPeriodRef[] = [
  { academic_period_id: 1, academic_period_code: '2024-2', academic_period_name: '2024-II' },
  { academic_period_id: 2, academic_period_code: '2025-1', academic_period_name: '2025-I' },
]

function stats(desempeno: number, evaluacion: number) {
  return {
    data: {
      dimensions: [
        { dimension: 'Desempeño Docente', average: desempeno, percentage: desempeno / 5 },
        { dimension: 'Procesos de Evaluación', average: evaluacion, percentage: evaluacion / 5 },
      ],
    } as DepartmentPeriodRangeStats,
  }
}

/** Only the fields the component reads — the real hook returns full query results. */
function mockBreakdowns(results: { data?: unknown; isPending: boolean }[]) {
  vi.mocked(useGetDepartmentPeriodBreakdowns).mockReturnValue(
    results as unknown as ReturnType<typeof useGetDepartmentPeriodBreakdowns>,
  )
}

describe('DepartmentDimensionsPeriodComparison', () => {
  beforeEach(() => {
    vi.mocked(useGetDepartmentPeriodBreakdowns).mockReset()
  })

  it('asks for one breakdown per period in the range', () => {
    mockBreakdowns([
      { data: stats(4.1, 3.9), isPending: false },
      { data: stats(4.4, 4.2), isPending: false },
    ])

    render(<DepartmentDimensionsPeriodComparison periods={PERIODS} />)

    expect(useGetDepartmentPeriodBreakdowns).toHaveBeenCalledWith(['2024-2', '2025-1'])
  })

  it('draws one chart per dimension, each spanning every period', () => {
    mockBreakdowns([
      { data: stats(4.1, 3.9), isPending: false },
      { data: stats(4.4, 4.2), isPending: false },
    ])

    // Recharts measures tick text through a hidden span it leaves on
    // `document.body`, so queries stay scoped to this test's container.
    const { container } = render(<DepartmentDimensionsPeriodComparison periods={PERIODS} />)

    const titles = within(container).getAllByRole('heading', { level: 3 })
    expect(titles.map((title) => title.textContent)).toEqual([
      'Desempeño Docente',
      'Procesos de Evaluación',
    ])

    // One x axis per chart, both periods on each.
    expect(within(container).getAllByText('2024-II')).toHaveLength(2)
    expect(within(container).getAllByText('2025-I')).toHaveLength(2)
  })

  it('shows a skeleton while any period is still loading', () => {
    mockBreakdowns([{ data: stats(4.1, 3.9), isPending: false }, { isPending: true }])

    const { container } = render(<DepartmentDimensionsPeriodComparison periods={PERIODS} />)

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('shows the empty message when no period reports dimensions', () => {
    mockBreakdowns([
      { data: { data: { dimensions: [] } }, isPending: false },
      { data: { data: { dimensions: [] } }, isPending: false },
    ])

    const { container } = render(<DepartmentDimensionsPeriodComparison periods={PERIODS} />)

    expect(
      within(container).getByText('No hay promedios por dimensión en los periodos comparados.'),
    ).toBeInTheDocument()
  })
})

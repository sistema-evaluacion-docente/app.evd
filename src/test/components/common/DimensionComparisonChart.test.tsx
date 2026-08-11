import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  DimensionComparisonChart,
  type DimensionSeries,
} from '@/components/common/DimensionComparisonChart'

const SERIES: DimensionSeries[] = [
  {
    id: 'teacher',
    label: 'Docente',
    scores: [
      { dimension: 'Metodología', value: 4.2 },
      { dimension: 'Comunicación', value: 3.6 },
    ],
  },
]

describe('DimensionComparisonChart', () => {
  it('shows a skeleton while loading', () => {
    const { container } = render(<DimensionComparisonChart series={SERIES} isLoading />)

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('shows the error message instead of the chart', () => {
    render(<DimensionComparisonChart series={SERIES} error="No se pudo cargar la comparación" />)

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar la comparación')
  })

  it('shows the empty message when every score is null', () => {
    render(
      <DimensionComparisonChart
        series={[{ id: 'teacher', label: 'Docente', scores: [{ dimension: 'Metodología' }] }]}
      />,
    )

    expect(screen.getByText('No hay dimensiones para comparar.')).toBeInTheDocument()
  })

  it('uses a custom empty message', () => {
    render(<DimensionComparisonChart series={[]} emptyMessage="Sin dimensiones evaluadas." />)

    expect(screen.getByText('Sin dimensiones evaluadas.')).toBeInTheDocument()
  })

  it('renders the dimension axis labels', () => {
    // Recharts measures tick text width through a hidden span it appends
    // directly to `document.body` and leaves behind across renders, so
    // queries are scoped to this test's own container to avoid matching it.
    const { container } = render(<DimensionComparisonChart series={SERIES} />)

    expect(within(container).getByText('Metodología')).toBeInTheDocument()
    expect(within(container).getByText('Comunicación')).toBeInTheDocument()
  })

  it('applies the labelFormatter to the axis labels', () => {
    const { container } = render(
      <DimensionComparisonChart
        series={SERIES}
        labelFormatter={(dimension) => dimension.slice(0, 4)}
      />,
    )

    expect(within(container).getByText('Meto')).toBeInTheDocument()
    expect(within(container).getByText('Comu')).toBeInTheDocument()
  })

  it('shows the legend once there is more than one series', () => {
    const { container } = render(
      <DimensionComparisonChart
        series={[
          ...SERIES,
          {
            id: 'department',
            label: 'Departamento',
            scores: [{ dimension: 'Metodología', value: 3.9 }],
          },
        ]}
      />,
    )

    expect(within(container).getByText('Docente')).toBeInTheDocument()
    expect(within(container).getByText('Departamento')).toBeInTheDocument()
  })

  it('renders as a radar chart when variant is radar', () => {
    const { container } = render(<DimensionComparisonChart series={SERIES} variant="radar" />)

    expect(container.querySelector('.recharts-radar')).toBeInTheDocument()
  })

  it('renders as a bar chart by default', () => {
    const { container } = render(<DimensionComparisonChart series={SERIES} />)

    expect(container.querySelector('.recharts-bar')).toBeInTheDocument()
  })
})

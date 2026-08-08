import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AverageTrendChart, type TrendSeries } from '@/components/common/AverageTrendChart'

const SERIES: TrendSeries[] = [
  {
    id: 'teacher',
    label: 'Promedio general',
    data: [
      { x: '2024-1', value: 3.8 },
      { x: '2024-2', value: 4.1 },
    ],
  },
]

describe('AverageTrendChart', () => {
  it('shows a skeleton while loading', () => {
    const { container } = render(<AverageTrendChart series={SERIES} isLoading />)

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('shows the error message instead of the chart', () => {
    render(<AverageTrendChart series={SERIES} error="No se pudo cargar la tendencia" />)

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar la tendencia')
  })

  it('shows the empty message when every point is null', () => {
    render(
      <AverageTrendChart
        series={[
          { id: 'teacher', label: 'Promedio general', data: [{ x: '2024-1', value: null }] },
        ]}
      />,
    )

    expect(
      screen.getByText('No hay datos suficientes para mostrar la tendencia.'),
    ).toBeInTheDocument()
  })

  it('uses a custom empty message', () => {
    render(<AverageTrendChart series={[]} emptyMessage="Aún no hay periodos evaluados." />)

    expect(screen.getByText('Aún no hay periodos evaluados.')).toBeInTheDocument()
  })

  it('renders the x categories', () => {
    // Recharts measures tick text width through a hidden span it appends
    // directly to `document.body` and leaves behind across renders, so
    // queries are scoped to this test's own container to avoid matching it.
    const { container } = render(<AverageTrendChart series={SERIES} />)

    expect(within(container).getByText('2024-1')).toBeInTheDocument()
    expect(within(container).getByText('2024-2')).toBeInTheDocument()
  })

  it('shows the legend once there is more than one series', () => {
    const { container } = render(
      <AverageTrendChart
        series={[
          ...SERIES,
          {
            id: 'department',
            label: 'Promedio del departamento',
            data: [{ x: '2024-1', value: 3.5 }],
          },
        ]}
      />,
    )

    expect(within(container).getByText('Promedio general')).toBeInTheDocument()
    expect(within(container).getByText('Promedio del departamento')).toBeInTheDocument()
  })

  it('shows a customize button by default', () => {
    render(<AverageTrendChart series={SERIES} />)

    expect(screen.getByRole('button', { name: 'Personalizar gráfico' })).toBeInTheDocument()
  })

  it('hides the customize button when customizable is false', () => {
    render(<AverageTrendChart series={SERIES} customizable={false} />)

    expect(screen.queryByRole('button', { name: 'Personalizar gráfico' })).not.toBeInTheDocument()
  })

  it('opens a popover with the current min/max bounds', async () => {
    const user = userEvent.setup()

    render(<AverageTrendChart series={SERIES} min={0} max={5} />)

    await user.click(screen.getByRole('button', { name: 'Personalizar gráfico' }))

    expect(screen.getByLabelText('Mínimo')).toHaveValue(0)
    expect(screen.getByLabelText('Máximo')).toHaveValue(5)
  })

  it('overrides the bounds and shows a reset action', async () => {
    const user = userEvent.setup()

    render(<AverageTrendChart series={SERIES} min={0} max={5} />)

    await user.click(screen.getByRole('button', { name: 'Personalizar gráfico' }))
    const minInput = screen.getByLabelText('Mínimo')
    await user.clear(minInput)
    await user.type(minInput, '2')

    expect(minInput).toHaveValue(2)
    expect(screen.getByRole('button', { name: 'Restablecer' })).toBeInTheDocument()
  })

  it('resets the overridden bounds through the reset action', async () => {
    const user = userEvent.setup()

    render(<AverageTrendChart series={SERIES} min={0} max={5} />)

    await user.click(screen.getByRole('button', { name: 'Personalizar gráfico' }))
    const minInput = screen.getByLabelText('Mínimo')
    await user.clear(minInput)
    await user.type(minInput, '2')

    await user.click(screen.getByRole('button', { name: 'Restablecer' }))

    expect(screen.getByLabelText('Mínimo')).toHaveValue(0)
    expect(screen.queryByRole('button', { name: 'Restablecer' })).not.toBeInTheDocument()
  })
})

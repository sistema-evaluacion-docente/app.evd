import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ScoreBadge } from '@/components/common/ScoreBadge'

describe('ScoreBadge', () => {
  it('renders the score with two decimal by default', () => {
    render(<ScoreBadge value={2.80} />)

    expect(screen.getByText('2.80')).toBeInTheDocument()
  })

  it('renders the requested number of decimals', () => {
    render(<ScoreBadge value={92.5} max={100} decimals={2} />)

    expect(screen.getByText('92.50')).toBeInTheDocument()
  })

  it('renders the placeholder when value is undefined', () => {
    render(<ScoreBadge value={undefined} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders a custom placeholder when value is undefined', () => {
    render(<ScoreBadge value={undefined} placeholder="Sin nota" />)

    expect(screen.getByText('Sin nota')).toBeInTheDocument()
  })

  it('defaults to the small font size', () => {
    render(<ScoreBadge value={2.80} />)

    expect(screen.getByText('2.80')).toHaveClass('text-sm')
  })

  it('applies the requested font size to the score', () => {
    render(<ScoreBadge value={2.80} size="lg" />)

    expect(screen.getByText('2.80')).toHaveClass('text-lg')
  })

  it('applies the requested font size to the placeholder', () => {
    render(<ScoreBadge value={undefined} size="xs" />)

    expect(screen.getByText('—')).toHaveClass('text-xs')
  })

  it('does not render a trend indicator without a previousValue', () => {
    const { container } = render(<ScoreBadge value={4} />)

    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('shows a growth indicator when the score improved over the previous value', () => {
    render(<ScoreBadge value={4.3} previousValue={4} decimals={2} />)

    expect(screen.getByText('+0.30')).toBeInTheDocument()
  })

  it('shows a decrease indicator when the score dropped from the previous value', () => {
    render(<ScoreBadge value={3.7} previousValue={4} decimals={2} />)

    expect(screen.getByText('-0.30')).toBeInTheDocument()
  })

  it('hides the trend indicator when the score is unchanged from the previous value', () => {
    render(<ScoreBadge value={4} previousValue={4} decimals={2} />)

    expect(screen.queryByText('0.00')).not.toBeInTheDocument()
    expect(screen.getByText('4.00')).toBeInTheDocument()
  })

  it('hides the trend indicator when showTrend is false', () => {
    render(<ScoreBadge value={4.3} previousValue={4} decimals={2} showTrend={false} />)

    expect(screen.queryByText('+0.30')).not.toBeInTheDocument()
    expect(screen.getByText('4.30')).toBeInTheDocument()
  })

  it('does not render the max score by default', () => {
    render(<ScoreBadge value={3.92} />)

    expect(screen.queryByText('/5.0')).not.toBeInTheDocument()
  })

  it('renders the max score at the same font size when showMax is true', () => {
    render(<ScoreBadge value={3.92} size="5xl" showMax />)

    expect(screen.getByText('/5.0')).toHaveClass('text-5xl')
  })

  it('describes the trend and previous value on the indicator for assistive tech', () => {
    render(
      <ScoreBadge value={4.3} previousValue={4} previousLabel="semestre anterior" decimals={2} />,
    )

    expect(
      screen.getByLabelText('El puntaje aumentó 0.30 puntos respecto al semestre anterior'),
    ).toBeInTheDocument()
  })
})

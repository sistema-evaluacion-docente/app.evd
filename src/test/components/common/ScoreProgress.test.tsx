import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ScoreProgress } from '@/components/common/ScoreProgress'

describe('ScoreProgress', () => {
  it('exposes the score and its percentage to assistive tech', () => {
    render(<ScoreProgress value={4} label="Claridad al explicar" />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '4.00 de 5 (80%)')
  })

  it('scales the percentage against a custom max', () => {
    render(<ScoreProgress value={82} max={100} interactive={false} showTooltip={false} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '82.00 de 100 (82%)')
  })

  it('clamps a score above the maximum to 100%', () => {
    render(<ScoreProgress value={7} max={5} interactive={false} showTooltip={false} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '7.00 de 5 (100%)')
  })

  it('renders a plain bar with no control when both layers are disabled', () => {
    render(<ScoreProgress value={3} interactive={false} showTooltip={false} />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('labels the control with the score and the caller label', () => {
    render(<ScoreProgress value={4.25} label="Claridad al explicar" />)

    expect(
      screen.getByRole('button', { name: 'Claridad al explicar: 4.25 de 5' }),
    ).toBeInTheDocument()
  })

  it('falls back to the bare score when no label is given', () => {
    render(<ScoreProgress value={2.5} />)

    expect(screen.getByRole('button', { name: '2.50 de 5' })).toBeInTheDocument()
  })

  it('shows the score and percentage on hover', async () => {
    const user = userEvent.setup()

    render(<ScoreProgress value={4} label="Claridad" />)

    await user.hover(screen.getByRole('button'))

    expect(await screen.findByText('4.00 / 5 · 80%')).toBeInTheDocument()
  })

  it('shows a custom tooltip body when one is given', async () => {
    const user = userEvent.setup()

    render(<ScoreProgress value={4} label="Claridad" tooltipContent="Muy por encima del grupo" />)

    await user.hover(screen.getByRole('button'))

    expect(await screen.findByText('Muy por encima del grupo')).toBeInTheDocument()
  })

  it('opens the breakdown on click', async () => {
    const user = userEvent.setup()

    render(<ScoreProgress value={4.25} label="Claridad al explicar" />)

    expect(screen.queryByText('de 5')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Claridad al explicar/ }))

    expect(await screen.findByText('4.25')).toBeInTheDocument()
    expect(screen.getByText('de 5')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
  })

  it('renders the extra details inside the breakdown', async () => {
    const user = userEvent.setup()

    render(
      <ScoreProgress
        value={3}
        label="Metodología"
        detailsTitle="Detalle de la dimensión"
        details={<p>3 preguntas evaluadas</p>}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Metodología/ }))

    expect(await screen.findByText('Detalle de la dimensión')).toBeInTheDocument()
    expect(screen.getByText('3 preguntas evaluadas')).toBeInTheDocument()
  })

  it('does not open a breakdown when it is not interactive', async () => {
    const user = userEvent.setup()

    render(<ScoreProgress value={3} label="Metodología" interactive={false} />)

    await user.click(screen.getByRole('button', { name: /Metodología/ }))

    expect(screen.queryByText('de 5')).not.toBeInTheDocument()
  })

  it('does not render a trend indicator without a previousValue', () => {
    render(<ScoreProgress value={4} label="Claridad" />)

    expect(screen.queryByText(/^[+-]?\d\.\d{2}$/)).not.toBeInTheDocument()
  })

  it('shows a growth indicator when the score improved over the previous value', () => {
    render(<ScoreProgress value={4.3} previousValue={4} label="Claridad" />)

    expect(screen.getByText('+0.30')).toBeInTheDocument()
  })

  it('shows a decrease indicator when the score dropped from the previous value', () => {
    render(<ScoreProgress value={3.7} previousValue={4} label="Claridad" />)

    expect(screen.getByText('-0.30')).toBeInTheDocument()
  })

  it('shows no sign when the score is unchanged from the previous value', () => {
    render(<ScoreProgress value={4} previousValue={4} label="Claridad" />)

    expect(screen.getByText('0.00')).toBeInTheDocument()
  })

  it('describes the trend and previous value on the indicator for assistive tech', async () => {
    const user = userEvent.setup()

    render(
      <ScoreProgress
        value={4.3}
        previousValue={4}
        previousLabel="semestre anterior"
        label="Claridad"
      />,
    )

    const trigger = screen.getByLabelText(
      'El puntaje aumentó 0.30 puntos respecto al semestre anterior',
    )

    await user.hover(trigger)

    expect(await screen.findByText('semestre anterior: 4.00 / 5 · +7%')).toBeInTheDocument()
  })

  it('hides the inline indicator but keeps the comparison in the breakdown when showTrend is false', async () => {
    const user = userEvent.setup()

    render(
      <ScoreProgress
        value={4.3}
        previousValue={4}
        previousLabel="semestre anterior"
        label="Claridad"
        showTrend={false}
      />,
    )

    expect(screen.queryByText('+0.30')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Claridad/ }))

    expect(await screen.findByText('semestre anterior:')).toBeInTheDocument()
    expect(screen.getByText('4.00')).toBeInTheDocument()
  })
})

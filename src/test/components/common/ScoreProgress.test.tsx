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
})

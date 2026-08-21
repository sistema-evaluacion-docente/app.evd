import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SegmentedControl } from '@/components/common/SegmentedControl'

const OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'DISTANCIA', label: 'Distancia' },
]

function renderControl(props: Partial<React.ComponentProps<typeof SegmentedControl<string>>> = {}) {
  const onValueChange = vi.fn()

  render(
    <SegmentedControl
      ariaLabel="Modalidad"
      options={OPTIONS}
      value="ALL"
      onValueChange={onValueChange}
      {...props}
    />,
  )

  return { onValueChange }
}

describe('SegmentedControl', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('exposes the group and its segments as a radiogroup', () => {
    renderControl()

    expect(screen.getByRole('radiogroup', { name: 'Modalidad' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('marks only the selected segment as checked', () => {
    renderControl({ value: 'DISTANCIA' })

    expect(screen.getByRole('radio', { name: 'Distancia' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Todas' })).not.toBeChecked()
  })

  it('reports the segment the user clicks', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderControl()

    await user.click(screen.getByRole('radio', { name: 'Presencial' }))

    expect(onValueChange).toHaveBeenCalledWith('PRESENCIAL')
  })

  it('keeps a single tab stop, on the selected segment', () => {
    renderControl({ value: 'PRESENCIAL' })

    expect(screen.getByRole('radio', { name: 'Presencial' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Todas' })).toHaveAttribute('tabindex', '-1')
  })

  it('selects the next segment with the arrow keys', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderControl({ value: 'PRESENCIAL' })

    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onValueChange).toHaveBeenCalledWith('DISTANCIA')
  })

  it('wraps around to the first segment from the last one', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderControl({ value: 'DISTANCIA' })

    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onValueChange).toHaveBeenCalledWith('ALL')
  })

  it('walks backwards with the left arrow', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderControl({ value: 'PRESENCIAL' })

    await user.tab()
    await user.keyboard('{ArrowLeft}')

    expect(onValueChange).toHaveBeenCalledWith('ALL')
  })

  it('skips a disabled segment when arrowing past it', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderControl({
      value: 'ALL',
      options: [OPTIONS[0], { ...OPTIONS[1], disabled: true }, OPTIONS[2]],
    })

    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onValueChange).toHaveBeenCalledWith('DISTANCIA')
  })

  it('leaves keys it does not handle to the browser', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderControl()

    await user.tab()
    await user.keyboard('{End}')

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('disables every segment at once', () => {
    renderControl({ disabled: true })

    for (const segment of screen.getAllByRole('radio')) {
      expect(segment).toBeDisabled()
    }
  })
})

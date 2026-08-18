import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DatePicker } from '@/components/common/DatePicker'

describe('DatePicker', () => {
  it('shows the selected date written in Spanish', () => {
    render(<DatePicker value="2026-08-14" onChange={vi.fn()} />)

    expect(screen.getByText('14 de agosto de 2026')).toBeInTheDocument()
  })

  it('falls back to the placeholder when there is no date', () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Sin fecha" />)

    expect(screen.getByText('Sin fecha')).toBeInTheDocument()
  })

  it('clears the date as an empty string, the shape the API fields expect', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<DatePicker value="2026-08-14" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Limpiar fecha' }))

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('hides the clear action while there is nothing to clear', () => {
    render(<DatePicker value="" onChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Limpiar fecha' })).not.toBeInTheDocument()
  })
})

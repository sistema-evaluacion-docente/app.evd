import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Combobox } from '@/components/common/Combobox'

const OPTIONS = ['Ingeniería', 'Ciencias Básicas', 'Ciencias de la Salud']

/** The field is controlled, so free typing only shows through a stateful host. */
function StatefulCombobox() {
  const [value, setValue] = useState('')

  return <Combobox value={value} onValueChange={setValue} options={OPTIONS} />
}

describe('Combobox', () => {
  it('renders the current value and keeps the id for its label', () => {
    render(<Combobox id="faculty" value="Ingeniería" onValueChange={vi.fn()} options={OPTIONS} />)

    const input = screen.getByRole('combobox')

    expect(input).toHaveValue('Ingeniería')
    expect(input).toHaveAttribute('id', 'faculty')
  })

  it('accepts a value that is not in the catalogue', async () => {
    const user = userEvent.setup()

    render(<StatefulCombobox />)

    await user.type(screen.getByRole('combobox'), 'Facultad nueva')

    expect(screen.getByRole('combobox')).toHaveValue('Facultad nueva')
  })

  it('offers the catalogue when the field is opened', async () => {
    const user = userEvent.setup()

    render(<Combobox value="" onValueChange={vi.fn()} options={OPTIONS} />)

    await user.click(screen.getByRole('combobox'))

    expect(await screen.findByRole('option', { name: 'Ciencias Básicas' })).toBeInTheDocument()
  })
})

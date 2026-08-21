import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SearchSelect } from '@/components/common/SearchSelect'

interface Teacher {
  id: number
  name: string
  code: string
  hasPlan?: boolean
}

const TEACHERS: Teacher[] = [
  { id: 1, name: 'Ada Lovelace', code: '1150123' },
  { id: 2, name: 'Grace Hopper', code: '1150456' },
  { id: 3, name: 'Alan Turing', code: '1150789', hasPlan: true },
]

function renderSelect(overrides: Partial<Parameters<typeof SearchSelect<Teacher>>[0]> = {}) {
  const onValueChange = vi.fn()

  render(
    <SearchSelect<Teacher>
      id="teacher"
      value={null}
      onValueChange={onValueChange}
      items={TEACHERS}
      itemToKey={(teacher) => teacher.id}
      itemToLabel={(teacher) => teacher.name}
      filter={(teacher, query) => teacher.code.includes(query)}
      isItemDisabled={(teacher) => Boolean(teacher.hasPlan)}
      placeholder="Selecciona un docente…"
      {...overrides}
    />,
  )

  return { onValueChange }
}

/** Picking is what fills the field, so the value only shows through a host. */
function StatefulSelect() {
  const [value, setValue] = useState<Teacher | null>(null)

  return (
    <SearchSelect<Teacher>
      value={value}
      onValueChange={setValue}
      items={TEACHERS}
      itemToKey={(teacher) => teacher.id}
      itemToLabel={(teacher) => teacher.name}
    />
  )
}

describe('SearchSelect', () => {
  it('keeps the id its label points at', () => {
    renderSelect()

    expect(screen.getByRole('combobox')).toHaveAttribute('id', 'teacher')
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Selecciona un docente…')
  })

  it('offers every item when the field is opened', async () => {
    const user = userEvent.setup()

    renderSelect()

    await user.click(screen.getByRole('combobox'))

    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('narrows by the label as it is typed into', async () => {
    const user = userEvent.setup()

    renderSelect()

    await user.type(screen.getByRole('combobox'), 'grace')

    expect(screen.getByRole('option', { name: /Grace Hopper/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Ada Lovelace/ })).not.toBeInTheDocument()
  })

  it('searches the fields the caller says to search too, not only the label', async () => {
    const user = userEvent.setup()

    renderSelect()

    await user.type(screen.getByRole('combobox'), '1150456')

    expect(screen.getByRole('option', { name: /Grace Hopper/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Ada Lovelace/ })).not.toBeInTheDocument()
  })

  it('hands back the item itself, not the text of it', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderSelect()

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Grace Hopper/ }))

    expect(onValueChange).toHaveBeenCalledWith(TEACHERS[1])
  })

  it('shows the picked item once it is chosen', async () => {
    const user = userEvent.setup()

    render(<StatefulSelect />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Ada Lovelace' }))

    expect(screen.getByRole('combobox')).toHaveValue('Ada Lovelace')
  })

  it('lets an item be listed without being pickable', async () => {
    const user = userEvent.setup()

    renderSelect()

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByRole('option', { name: /Alan Turing/ })).toHaveAttribute('data-disabled', '')
  })

  it('decorates the options with whatever the caller renders', async () => {
    const user = userEvent.setup()

    renderSelect({
      renderItem: (teacher) => (
        <>
          {teacher.name}
          <span className="num">· {teacher.code}</span>
        </>
      ),
    })

    await user.click(screen.getByRole('combobox'))

    const option = screen.getByRole('option', { name: /Ada Lovelace/ })

    expect(option).toHaveTextContent('1150123')
  })

  it('says out loud that the options are still on their way', () => {
    renderSelect({ loading: true, loadingLabel: 'Cargando docentes…' })

    const input = screen.getByRole('combobox')

    expect(input).toHaveAttribute('placeholder', 'Cargando docentes…')
    expect(input).toHaveAttribute('aria-busy', 'true')
  })

  it('says nothing matched instead of dropping an empty list', async () => {
    const user = userEvent.setup()

    renderSelect({ emptyMessage: 'Sin docentes que coincidan.' })

    await user.type(screen.getByRole('combobox'), 'zzz')

    expect(screen.getByText('Sin docentes que coincidan.')).toBeInTheDocument()
  })
})

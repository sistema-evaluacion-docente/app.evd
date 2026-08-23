import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TeacherSelect } from '@/features/teachers'
import { useListTeachers } from '@/features/teachers/api'
import type { TeacherRecord } from '@/features/teachers/types'

vi.mock('@/features/teachers/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/teachers/api')>()),
  useListTeachers: vi.fn(),
}))

function teacher(id: number, name: string, code: string): TeacherRecord {
  return {
    id,
    institutional_code: code,
    department_id: 1,
    contract_type: 'TIEMPO COMPLETO',
    user_id: id,
    user: { id, name, email: `${id}@ufps.edu.co` },
    active: true,
    overall_average: 4,
    created_at: '',
    updated_at: '',
  } as TeacherRecord
}

const TEACHERS = [
  teacher(1, 'Ada Lovelace', '1150123'),
  teacher(2, 'Grace Hopper', '1150456'),
  teacher(3, 'Alan Turing', '1150789'),
]

function mockTeachers({ isLoading = false, data = TEACHERS } = {}) {
  vi.mocked(useListTeachers).mockReturnValue({
    data: isLoading ? undefined : { data },
    isLoading,
  } as ReturnType<typeof useListTeachers>)
}

describe('TeacherSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTeachers()
  })

  it('offers the department teachers once opened', async () => {
    const user = userEvent.setup()

    render(<TeacherSelect onIdChange={vi.fn()} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('narrows the list by name as it is typed into', async () => {
    const user = userEvent.setup()

    render(<TeacherSelect onIdChange={vi.fn()} />)

    await user.type(screen.getByRole('combobox'), 'grace')

    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option')).toHaveTextContent('Grace Hopper')
  })

  it('also matches the institutional code', async () => {
    const user = userEvent.setup()

    render(<TeacherSelect onIdChange={vi.fn()} />)

    await user.type(screen.getByRole('combobox'), '1150789')

    expect(screen.getByRole('option')).toHaveTextContent('Alan Turing')
  })

  it('reports the id in id mode', async () => {
    const user = userEvent.setup()
    const onIdChange = vi.fn()

    render(<TeacherSelect onIdChange={onIdChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Grace Hopper' }))

    expect(onIdChange).toHaveBeenCalledWith(2)
  })

  it('reports the name in name mode', async () => {
    // The subjects table filters by `teacher_name`, not by id — the two modes
    // are not interchangeable.
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(<TeacherSelect onValueChange={onValueChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Grace Hopper' }))

    expect(onValueChange).toHaveBeenCalledWith('Grace Hopper')
  })

  it('shows the picked teacher back in id mode', () => {
    render(<TeacherSelect idValue={1} onIdChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue('Ada Lovelace')
  })

  it('keeps the field on screen while the teachers load', () => {
    // It used to be replaced by a bare 20px spinner, so the whole filter row
    // reflowed the moment the request came back.
    mockTeachers({ isLoading: true })

    render(<TeacherSelect onIdChange={vi.fn()} />)

    const input = screen.getByRole('combobox')

    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Cargando docentes…')
  })

  it('carries an accessible name without a visible label', () => {
    // Every call site is a filter row with no `<Label>` of its own.
    render(<TeacherSelect onIdChange={vi.fn()} />)

    expect(screen.getByRole('combobox', { name: 'Docente' })).toBeInTheDocument()
  })

  it('says so when nothing matches', async () => {
    const user = userEvent.setup()

    render(<TeacherSelect onIdChange={vi.fn()} />)

    await user.type(screen.getByRole('combobox'), 'zzz')

    expect(screen.getByText('Sin docentes que coincidan.')).toBeInTheDocument()
  })
})

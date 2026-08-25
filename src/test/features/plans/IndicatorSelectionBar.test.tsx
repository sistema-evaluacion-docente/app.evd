import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IndicatorSelectionBar } from '@/features/plans/components/IndicatorSelectionBar'
import type {
  IndicatorSelection,
  SelectionEntry,
} from '@/features/plans/hooks/useIndicatorSelection'

const QUESTION: SelectionEntry = {
  kind: 'question',
  ref: '011',
  subjectKey: null,
  label: '011 · Asiste puntualmente',
  subjectLabel: null,
}

const IN_COURSE: SelectionEntry = {
  ...QUESTION,
  ref: '012',
  subjectKey: '1155::A',
  label: '012 · Fomenta la participación',
  subjectLabel: 'POO I · Grupo A',
}

function fakeSelection(overrides: Partial<IndicatorSelection> = {}): IndicatorSelection {
  const entries: [string, SelectionEntry][] = overrides.entries ?? []

  return {
    active: true,
    start: vi.fn(),
    cancel: vi.fn(),
    submit: vi.fn(),
    entries,
    count: entries.length,
    threshold: 3.5,
    isSelected: () => false,
    toggle: vi.fn(),
    markedElsewhere: () => 0,
    markMany: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    existingPlanId: null,
    isPending: false,
    ...overrides,
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('IndicatorSelectionBar', () => {
  it('tells the director what to do before anything is marked', () => {
    render(<IndicatorSelectionBar selection={fakeSelection()} />)

    expect(screen.getByText(/Marque los indicadores/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear plan/ })).toBeDisabled()
  })

  it('counts what is marked and carries it to the form', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    const selection = fakeSelection({
      entries: [
        ['a', QUESTION],
        ['b', IN_COURSE],
      ],
      submit,
    })

    render(<IndicatorSelectionBar selection={selection} />)

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('indicadores marcados')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Crear plan/ }))

    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('offers the existing plan of the period instead of a new one', () => {
    render(
      <IndicatorSelectionBar
        selection={fakeSelection({ entries: [['a', QUESTION]], existingPlanId: 9 })}
      />,
    )

    expect(screen.getByRole('button', { name: /Agregar al plan/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Crear plan/ })).not.toBeInTheDocument()
  })

  it('lists the selection back, saying where each mark was made', async () => {
    const user = userEvent.setup()

    render(
      <IndicatorSelectionBar
        selection={fakeSelection({
          entries: [
            ['a', QUESTION],
            ['b', IN_COURSE],
          ],
        })}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Ver selección' }))

    expect(await screen.findByText('011 · Asiste puntualmente')).toBeInTheDocument()
    expect(screen.getByText('Todas las asignaturas')).toBeInTheDocument()
    expect(screen.getByText('POO I · Grupo A')).toBeInTheDocument()
  })

  it('drops one mark from that list', async () => {
    const user = userEvent.setup()
    const remove = vi.fn()

    render(
      <IndicatorSelectionBar selection={fakeSelection({ entries: [['a', QUESTION]], remove })} />,
    )

    await user.click(screen.getByRole('button', { name: 'Ver selección' }))
    await user.click(await screen.findByRole('button', { name: /Quitar 011/ }))

    expect(remove).toHaveBeenCalledWith('a')
  })

  it('offers the weak ones as a shortcut, and only the ones still missing', async () => {
    const user = userEvent.setup()
    const markMany = vi.fn()
    const selection = fakeSelection({
      markMany,
      isSelected: (_kind, ref) => ref === '011',
    })

    render(<IndicatorSelectionBar selection={selection} weakEntries={[QUESTION, IN_COURSE]} />)

    // `011` is already marked, so only one is left to add.
    await user.click(screen.getByRole('button', { name: /Marcar los 1 bajos/ }))

    expect(markMany).toHaveBeenCalledWith([IN_COURSE])
  })

  it('says nothing about weak indicators once they are all marked', () => {
    render(
      <IndicatorSelectionBar
        selection={fakeSelection({ isSelected: () => true })}
        weakEntries={[QUESTION]}
      />,
    )

    expect(screen.queryByRole('button', { name: /Marcar los/ })).not.toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IndicatorSelectionApi } from '@/features/plans/hooks/useIndicatorSelection'
import { CourseDimensionBreakdown } from '@/features/teachers/components/CourseDimensionBreakdown'
import type { DimensionDetail } from '@/features/teachers/types'

const dimensions: DimensionDetail[] = [
  {
    dimension: 'Desempeño Docente',
    average: 3.1,
    questions: [
      { code: '011', text: 'Asiste puntualmente a clase.', score: 2.9 },
      { code: '012', text: 'Fomenta la participación.', score: 4.2 },
    ],
  } as unknown as DimensionDetail,
]

function fakeSelection(overrides: Partial<IndicatorSelectionApi> = {}): IndicatorSelectionApi {
  return {
    threshold: 3.5,
    isSelected: () => false,
    toggle: vi.fn(),
    markedElsewhere: () => 0,
    ...overrides,
  }
}

/** The dimension row is collapsed by default; its questions need opening. */
async function openDimension(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Desempeño Docente/ }))
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('CourseDimensionBreakdown', () => {
  it('is read-only when no selection is passed', async () => {
    const user = userEvent.setup()
    render(<CourseDimensionBreakdown dimensions={dimensions} />)

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    await openDimension(user)

    expect(screen.getByText(/Asiste puntualmente a clase/)).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('marks a dimension without collapsing the row it sits in', async () => {
    // The checkbox lives outside the trigger on purpose: nested in it, the
    // markup would be invalid and the click would toggle the panel instead.
    const user = userEvent.setup()
    const toggle = vi.fn()

    render(
      <CourseDimensionBreakdown dimensions={dimensions} selection={fakeSelection({ toggle })} />,
    )

    await user.click(screen.getByRole('checkbox', { name: /Seleccionar Desempeño Docente/ }))

    expect(toggle).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'dimension', ref: 'Desempeño Docente', subjectKey: null }),
    )
    expect(screen.queryByText(/Asiste puntualmente a clase/)).not.toBeInTheDocument()
  })

  it('marks a question from its own text, not only from the box', async () => {
    const user = userEvent.setup()
    const toggle = vi.fn()

    render(
      <CourseDimensionBreakdown dimensions={dimensions} selection={fakeSelection({ toggle })} />,
    )

    await openDimension(user)
    // The score bar carries the same text as its own label, so match the
    // numbered phrasing the row actually prints.
    await user.click(screen.getByRole('button', { name: '011. Asiste puntualmente a clase.' }))

    expect(toggle).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'question', ref: '011', subjectKey: null }),
    )
  })

  it('files a mark under the asignatura it was read on', async () => {
    const user = userEvent.setup()
    const toggle = vi.fn()

    render(
      <CourseDimensionBreakdown
        dimensions={dimensions}
        selection={fakeSelection({ toggle })}
        subjectKey="1155::A"
        subjectLabel="POO I · Grupo A"
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: /Seleccionar Desempeño Docente/ }))

    expect(toggle).toHaveBeenCalledWith(
      expect.objectContaining({ subjectKey: '1155::A', subjectLabel: 'POO I · Grupo A' }),
    )
  })

  it('warns that the same indicator is already marked somewhere else', async () => {
    const user = userEvent.setup()

    render(
      <CourseDimensionBreakdown
        dimensions={dimensions}
        selection={fakeSelection({ markedElsewhere: () => 2 })}
      />,
    )

    await openDimension(user)

    // Two commitments filed where one was meant is the failure this prevents.
    expect(screen.getAllByText(/ya marcado en otras 2 asignaturas/).length).toBeGreaterThan(0)
  })

  it('shows a marked row as checked', () => {
    render(
      <CourseDimensionBreakdown
        dimensions={dimensions}
        selection={fakeSelection({ isSelected: (kind) => kind === 'dimension' })}
      />,
    )

    expect(screen.getByRole('checkbox', { name: /Quitar Desempeño Docente/ })).toBeChecked()
  })
})

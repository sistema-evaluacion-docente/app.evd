import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CommitmentsEditor } from '@/features/plans/components/CommitmentsEditor'
import { buildBlankDraft, reserveDraftKeys } from '@/features/plans/lib/planDraft'
import type { DraftItem, PlanAspect } from '@/features/plans/types'

const ASPECTS: PlanAspect[] = [
  { aspect: 1, label: 'Desarrollo de Conocimiento', dimension: 'Dimensión 1' },
  { aspect: 2, label: 'Desempeño Docente', dimension: 'Dimensión 2' },
]

function item(overrides: Partial<DraftItem> = {}): DraftItem {
  return { ...buildBlankDraft(1), ...overrides }
}

function renderEditor(
  items: DraftItem[],
  overrides: Partial<{ invalidFields: Map<string, string> }> = {},
) {
  const onFieldBlur = vi.fn()

  render(
    <CommitmentsEditor
      items={items}
      aspects={ASPECTS}
      onChange={vi.fn()}
      onRemove={vi.fn()}
      invalidFields={overrides.invalidFields ?? new Map()}
      onFieldBlur={onFieldBlur}
    />,
  )

  return { onFieldBlur }
}

describe('CommitmentsEditor', () => {
  it('numbers the commitments across the whole plan, not within each aspect', () => {
    renderEditor([
      item({ description: 'A', commitment: 'a' }),
      item({ description: 'B', commitment: 'b' }),
      item({ aspect: 2, description: 'C', commitment: 'c' }),
    ])

    const [first, second] = screen.getAllByRole('heading', { name: /Desarrollo|Desempeño/ })

    const firstCards = within(first.closest('section') as HTMLElement).getAllByRole('listitem')
    const secondCards = within(second.closest('section') as HTMLElement).getAllByRole('listitem')

    expect(firstCards.map((card) => card.textContent?.slice(0, 12))).toEqual([
      'Compromiso 1',
      'Compromiso 2',
    ])
    // The third one opens a new aspect but keeps counting: "el compromiso 3" is
    // one card in the plan, not one per section.
    expect(secondCards[0].textContent?.slice(0, 12)).toBe('Compromiso 3')
  })

  it('counts the ones with no aspect last, where they are painted', () => {
    renderEditor([
      item({ aspect: null, description: 'Suelto', commitment: 'x' }),
      item({ aspect: 2, description: 'C', commitment: 'c' }),
      item({ description: 'A', commitment: 'a' }),
    ])

    expect(screen.getAllByRole('listitem').map((card) => card.textContent?.slice(0, 12))).toEqual([
      'Compromiso 1',
      'Compromiso 2',
      'Compromiso 3',
    ])
  })

  it('gives each card its own remove button, named so they are told apart', () => {
    renderEditor([
      item({ description: 'A', commitment: 'a' }),
      item({ description: 'B', commitment: 'b' }),
      item({ aspect: 2, description: 'C', commitment: 'c' }),
    ])

    expect(screen.getByRole('button', { name: 'Quitar compromiso 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar compromiso 2' })).toBeInTheDocument()
    // Used to collide with "Quitar compromiso 1": same name, different card.
    expect(screen.getByRole('button', { name: 'Quitar compromiso 3' })).toBeInTheDocument()
  })

  it('leaves out the aspects nothing was picked for, instead of listing them empty', () => {
    renderEditor([item({ description: 'A', commitment: 'a' })])

    expect(screen.getByRole('heading', { name: /Desarrollo de Conocimiento/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Desempeño Docente/ })).not.toBeInTheDocument()
  })

  it('says nothing about a commitment still being filled in', () => {
    renderEditor([item({ description: 'Metodología', commitment: '' })])

    // The amber "Falta el compromiso" chip used to shout before the director
    // had had a chance to type anything.
    expect(screen.queryByText(/Falta el compromiso/)).not.toBeInTheDocument()
    expect(screen.queryByText('Completo')).not.toBeInTheDocument()
  })

  it('paints red only the fields the page says are already due', () => {
    const draft = item({ description: '', commitment: '' })

    renderEditor([draft], {
      invalidFields: new Map([[`commit-${draft.key}`, 'Falta el compromiso.']]),
    })

    expect(screen.getByLabelText(/Descripción del indicador/)).not.toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText(/^Compromiso/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('says in words what is missing, and points the field at it', () => {
    const draft = item({ description: '', commitment: '' })

    renderEditor([draft], {
      invalidFields: new Map([[`commit-${draft.key}`, 'Falta el compromiso.']]),
    })

    // Red alone is not an error message: the reason has to be readable, and
    // reachable from the control for anyone who can't see the colour.
    const message = screen.getByRole('alert')

    expect(message).toHaveTextContent('Falta el compromiso.')
    expect(screen.getByLabelText(/^Compromiso/)).toHaveAttribute('aria-describedby', message.id)
  })

  it('reports a required field left empty, which is what turns it red', async () => {
    const draft = item()
    const { onFieldBlur } = renderEditor([draft])

    await userEvent.click(screen.getByLabelText(/^Compromiso/))
    await userEvent.tab()

    expect(onFieldBlur).toHaveBeenCalledWith(`commit-${draft.key}`)
  })

  it('starts the meta esperada empty, so the director has to decide it', () => {
    const draft = item({ target_type: 'DIMENSION', target_ref: 'Desempeño Docente' })

    renderEditor([draft])

    expect(screen.getByLabelText(/Meta esperada/)).toHaveValue(null)
  })

  it('hands an aspect picker to the commitments that have none', () => {
    renderEditor([item({ aspect: null, description: 'Suelto' })])

    expect(screen.getByRole('heading', { name: 'Sin aspecto asignado' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Aspecto del formato/)).toBeInTheDocument()
  })
})

describe('reserveDraftKeys', () => {
  it('hands out keys past the ones a restored draft already holds', () => {
    // A reload restarts the counter, so a restored 'draft-9000' would otherwise
    // be handed out a second time and two rows would edit as one.
    reserveDraftKeys([{ key: 'draft-9000' }, { key: 'draft-42' }, { key: 'group:12' }])

    expect(buildBlankDraft(1).key).toBe('draft-9001')
  })

  it('ignores keys that were never ours to count', () => {
    const before = Number(/^draft-(\d+)$/.exec(buildBlankDraft(1).key)?.[1])

    reserveDraftKeys([{ key: 'code:MAT101::A' }, { key: 'manual-2-1699999999' }])

    const after = Number(/^draft-(\d+)$/.exec(buildBlankDraft(1).key)?.[1])

    // Nothing there was a draft key, so the counter just carries on forward.
    expect(after).toBeGreaterThan(before)
  })
})

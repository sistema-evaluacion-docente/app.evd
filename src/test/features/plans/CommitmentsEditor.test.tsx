import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CommitmentsEditor } from '@/features/plans/components/CommitmentsEditor'
import { buildBlankDraft } from '@/features/plans/lib/planDraft'
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
  overrides: Partial<{ invalidFields: Map<string, string>; disabled: boolean }> = {},
) {
  const onEdit = vi.fn()
  const onRemove = vi.fn()

  render(
    <CommitmentsEditor
      items={items}
      aspects={ASPECTS}
      onEdit={onEdit}
      onRemove={onRemove}
      invalidFields={overrides.invalidFields ?? new Map()}
      disabled={overrides.disabled}
    />,
  )

  return { onEdit, onRemove }
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

  it('reads the commitments instead of offering them for editing', () => {
    renderEditor([item({ description: 'Metodología', commitment: 'Aplicar rúbricas' })])

    // The fields live in `CommitmentDialog` now: two places to write the same
    // commitment is exactly what the dialog was added to remove.
    expect(screen.getByText('Metodología')).toBeInTheDocument()
    expect(screen.getByText('Aplicar rúbricas')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('reopens the commitment it was asked to edit', async () => {
    const draft = item({ description: 'Metodología', commitment: 'Aplicar rúbricas' })
    const { onEdit } = renderEditor([draft])

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))

    expect(onEdit).toHaveBeenCalledWith(draft.key)
  })

  it('says nothing about a commitment still being filled in', () => {
    renderEditor([item({ description: 'Metodología', commitment: '' })])

    // The amber "Falta el compromiso" chip used to shout before the director
    // had had a chance to type anything.
    expect(screen.queryByText(/Falta el compromiso/)).not.toBeInTheDocument()
    expect(screen.queryByText('Completo')).not.toBeInTheDocument()
  })

  it('says in words what is missing, on the card the page will scroll to', () => {
    const draft = item({ description: 'Metodología', commitment: '' })

    renderEditor([draft], {
      invalidFields: new Map([[`commit-${draft.key}`, 'Falta el compromiso.']]),
    })

    // Nothing in the card is a control any more, so the anchor `focusField`
    // aims at has to be the text itself.
    expect(screen.getByRole('alert')).toHaveTextContent('Falta el compromiso.')
    expect(document.getElementById(`commit-${draft.key}`)).toHaveAttribute('tabindex', '-1')
  })

  it('shows the meta agreed on next to the score it starts from', () => {
    renderEditor([
      item({
        target_type: 'DIMENSION',
        target_ref: 'Desempeño Docente',
        target_value: 4,
        baseline_value: 3.2,
        commitment: 'Aplicar rúbricas',
      }),
    ])

    expect(screen.getByText('4.00')).toBeInTheDocument()
    expect(screen.getByText('3.20')).toBeInTheDocument()
  })

  it('takes the buttons away once the acta is signed', () => {
    renderEditor([item({ description: 'A', commitment: 'a' })], { disabled: true })

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Quitar compromiso/ })).not.toBeInTheDocument()
  })

  it('still groups the ones with no aspect apart, so they are not missed', () => {
    renderEditor([item({ aspect: null, description: 'Suelto', commitment: 'x' })])

    expect(screen.getByRole('heading', { name: 'Sin aspecto asignado' })).toBeInTheDocument()
  })
})

describe('claves de los compromisos en borrador', () => {
  it('no repite una clave', () => {
    // Dos filas con la misma clave se editan como una sola.
    const keys = new Set(Array.from({ length: 500 }, () => buildBlankDraft(1).key))

    expect(keys.size).toBe(500)
  })

  it('no choca con las que trae un borrador guardado', () => {
    // Recargar la página no puede volver a repartir una clave que un compromiso
    // restaurado ya tiene — incluidas las del contador que se usaba antes.
    const restored = ['draft-1', 'draft-42', 'draft-9000']
    const fresh = Array.from({ length: 200 }, () => buildBlankDraft(1).key)

    expect(fresh.some((key) => restored.includes(key))).toBe(false)
  })
})

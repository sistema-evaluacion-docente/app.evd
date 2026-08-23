import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CommitmentDialog } from '@/features/plans/components/CommitmentDialog'
import {
  buildBlankDraft,
  buildCommentDraft,
  buildIndicatorDraft,
} from '@/features/plans/lib/planDraft'
import type { DraftItem, PlanAspect } from '@/features/plans/types'
import type { SuggestedAction } from '@/features/suggested-actions/types'

const ASPECTS: PlanAspect[] = [
  { aspect: 1, label: 'Desarrollo de Conocimiento', dimension: 'Dimensión 1' },
  { aspect: 2, label: 'Desempeño Docente', dimension: 'Dimensión 2' },
]

/** What the picker hands over when a dimension is added. */
function indicatorDraft(overrides: Partial<DraftItem> = {}): DraftItem {
  return {
    ...buildIndicatorDraft(
      {
        target_type: 'DIMENSION',
        target_ref: 'Desempeño Docente',
        label: 'Desempeño Docente',
        average: 3.2,
        aspect: 2,
        suggestions: [],
      },
      null,
    ),
    ...overrides,
  }
}

function renderDialog(
  draft: DraftItem | null,
  overrides: Partial<{
    mode: 'create' | 'edit'
    defaultActions: SuggestedAction[]
  }> = {},
) {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  render(
    <CommitmentDialog
      draft={draft}
      mode={overrides.mode ?? 'create'}
      aspects={ASPECTS}
      defaultActions={overrides.defaultActions}
      onSave={onSave}
      onCancel={onCancel}
    />,
  )

  return { onSave, onCancel }
}

describe('CommitmentDialog', () => {
  it('stays out of the way while nothing is being written', () => {
    renderDialog(null)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('prints the indicator instead of letting it be rewritten', () => {
    renderDialog(indicatorDraft())

    // The description names what was measured, and the director agrees on what
    // to do about it — not on what the evaluation said.
    expect(screen.getByText('Desempeño Docente (3.20)')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Título del compromiso/)).not.toBeInTheDocument()
  })

  it('asks a commitment written from scratch for its own title', () => {
    renderDialog(buildBlankDraft(1))

    expect(screen.getByLabelText(/Título del compromiso/)).toBeInTheDocument()
  })

  it('hands back the finished commitment', async () => {
    const { onSave } = renderDialog(indicatorDraft())

    await userEvent.type(screen.getByLabelText(/Descripción del compromiso/), 'Aplicar rúbricas')
    await userEvent.type(screen.getByLabelText(/Meta esperada/), '4')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({
      commitment: 'Aplicar rúbricas',
      target_value: 4,
    })
  })

  it('refuses to save a commitment that is still missing something', async () => {
    const { onSave } = renderDialog(indicatorDraft())

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    // Nothing reaches the plan half-written: that is what let the old flow drop
    // empty cards into section 3 in the first place.
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Falta el compromiso.')).toBeInTheDocument()
    expect(screen.getByText('Falta la meta esperada.')).toBeInTheDocument()
  })

  it('says nothing in red before the director has had a chance to type', () => {
    renderDialog(indicatorDraft())

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('leaves the meta esperada out of a commitment with nothing to measure', () => {
    renderDialog(
      buildCommentDraft(
        {
          id: 7,
          original_text: 'Explica muy rápido',
          risk_level: { id: 3, name: 'Alto' },
        } as never,
        null,
      ),
    )

    expect(screen.queryByLabelText(/Meta esperada/)).not.toBeInTheDocument()
    expect(screen.getByText(/Explica muy rápido/)).toBeInTheDocument()
  })

  it('shows the score the meta is being set against', () => {
    renderDialog(indicatorDraft())

    // Deciding a meta without seeing what the teacher actually got means
    // scrolling back up the page to look it up.
    expect(screen.getByText(/Nota actual/)).toBeInTheDocument()
    expect(screen.getByText('3.20')).toBeInTheDocument()
  })

  it('says so when there is no score to compare against', () => {
    renderDialog(indicatorDraft({ baseline_value: null }))

    expect(screen.getByText(/Sin nota registrada/)).toBeInTheDocument()
  })

  it('refuses a meta off the institutional scale', async () => {
    const { onSave } = renderDialog(indicatorDraft())

    await userEvent.type(screen.getByLabelText(/Descripción del compromiso/), 'Aplicar rúbricas')
    await userEvent.type(screen.getByLabelText(/Meta esperada/), '7')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    // The `max` on the input is a hint, not a guard: the form is `noValidate`
    // and typing straight over the spinner goes past it.
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('La meta debe estar entre 0.0 y 5.0.')).toBeInTheDocument()
  })

  it('takes a meta at the top of the scale', async () => {
    const { onSave } = renderDialog(indicatorDraft())

    await userEvent.type(screen.getByLabelText(/Descripción del compromiso/), 'Algo')
    await userEvent.type(screen.getByLabelText(/Meta esperada/), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalled()
  })

  it('starts the meta esperada empty, so the director has to decide it', () => {
    renderDialog(indicatorDraft())

    expect(screen.getByLabelText(/Meta esperada/)).toHaveValue(null)
  })

  it('asks for an aspect when the pick came without one', () => {
    renderDialog(indicatorDraft({ aspect: null }))

    expect(screen.getByLabelText(/Aspecto del formato/)).toBeInTheDocument()
  })

  it('does not ask for an aspect the pick already knows', () => {
    renderDialog(indicatorDraft())

    expect(screen.queryByLabelText(/Aspecto del formato/)).not.toBeInTheDocument()
  })

  it('adds a suggested action to what is written instead of replacing it', async () => {
    const { onSave } = renderDialog(indicatorDraft({ target_value: 4 }), {
      defaultActions: [
        { id: 'a', aspect: 2, action: 'Socializar el plan de aula' },
        { id: 'b', aspect: 2, action: 'Publicar la rúbrica' },
      ] as SuggestedAction[],
    })

    const field = screen.getByLabelText(/Descripción del compromiso/)

    await userEvent.type(field, 'Aplicar rúbricas')
    await userEvent.click(screen.getByRole('button', { name: /Acciones sugeridas/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Socializar el plan de aula' }))
    await userEvent.click(screen.getByRole('button', { name: 'Publicar la rúbrica' }))

    expect(field).toHaveValue('Aplicar rúbricas, Socializar el plan de aula, Publicar la rúbrica')

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSave).toHaveBeenCalled()
  })

  it('only offers the actions written for this commitment’s aspect', async () => {
    renderDialog(indicatorDraft(), {
      defaultActions: [
        { id: 'a', aspect: 1, action: 'De otro aspecto' },
        { id: 'b', aspect: 2, action: 'De este aspecto' },
      ] as SuggestedAction[],
    })

    await userEvent.click(screen.getByRole('button', { name: /Acciones sugeridas/ }))

    expect(screen.getByRole('button', { name: 'De este aspecto' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'De otro aspecto' })).not.toBeInTheDocument()
  })

  it('gives up the draft without touching the plan', async () => {
    const { onSave, onCancel } = renderDialog(indicatorDraft())

    await userEvent.type(screen.getByLabelText(/Descripción del compromiso/), 'Algo')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('names itself after what it is doing', () => {
    renderDialog(indicatorDraft(), { mode: 'edit' })

    expect(screen.getByRole('heading', { name: 'Editar compromiso' })).toBeInTheDocument()
  })
})

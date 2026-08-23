import { describe, expect, it } from 'vitest'

import { appendSuggestedAction } from '@/features/plans/lib/commitmentText'

describe('appendSuggestedAction', () => {
  it('takes the action as-is when nothing is written yet', () => {
    expect(appendSuggestedAction('', 'Aplicar rúbricas')).toBe('Aplicar rúbricas')
    expect(appendSuggestedAction('   ', 'Aplicar rúbricas')).toBe('Aplicar rúbricas')
  })

  it('adds to what the director already wrote instead of replacing it', () => {
    // Picking a second action used to wipe the first one, silently.
    expect(appendSuggestedAction('Aplicar rúbricas', 'Socializar el plan de aula')).toBe(
      'Aplicar rúbricas, Socializar el plan de aula',
    )
  })

  it('does not leave the comma sitting behind a full stop', () => {
    expect(appendSuggestedAction('Aplicar rúbricas.', 'Socializar')).toBe(
      'Aplicar rúbricas, Socializar',
    )
    expect(appendSuggestedAction('Aplicar rúbricas; ', 'Socializar')).toBe(
      'Aplicar rúbricas, Socializar',
    )
  })

  it('accumulates as many as are picked', () => {
    const first = appendSuggestedAction('', 'Una')

    expect(appendSuggestedAction(appendSuggestedAction(first, 'Dos'), 'Tres')).toBe(
      'Una, Dos, Tres',
    )
  })

  it('ignores an action that is already in there', () => {
    // The list is collapsed by default, so clicking the same wording twice is a
    // slip and never an intention.
    const current = 'Aplicar rúbricas, Socializar'

    expect(appendSuggestedAction(current, 'Socializar')).toBe(current)
    expect(appendSuggestedAction(current, 'SOCIALIZAR')).toBe(current)
  })

  it('leaves the commitment alone when the action is blank', () => {
    expect(appendSuggestedAction('Aplicar rúbricas', '   ')).toBe('Aplicar rúbricas')
  })
})

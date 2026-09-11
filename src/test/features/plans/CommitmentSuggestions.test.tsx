import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CommitmentSuggestions } from '@/features/plans/components/CommitmentSuggestions'
import type { SuggestedAction } from '@/features/suggested-actions/types'

const ACTIONS = [
  { id: 'a', aspect: 2, action: 'Socializar el plan de aula' },
  { id: 'b', aspect: 2, action: 'Publicar la rúbrica' },
] as SuggestedAction[]

describe('CommitmentSuggestions', () => {
  // RF-6.6: un departamento que no ha configurado su catálogo simplemente no
  // ofrece nada — no un desplegable vacío ni un mensaje de "sin sugerencias".
  it('no muestra nada cuando el departamento no tiene acciones por defecto para este aspecto', () => {
    const { container } = render(
      <CommitmentSuggestions departmentActions={[]} onPick={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el disparador con el conteo de acciones disponibles', () => {
    render(<CommitmentSuggestions departmentActions={ACTIONS} onPick={vi.fn()} />)

    expect(screen.getByText(/Acciones sugeridas/)).toHaveTextContent('Acciones sugeridas (2)')
  })

  it('avisa con el texto elegido al hacer clic en una acción', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<CommitmentSuggestions departmentActions={ACTIONS} onPick={onPick} />)

    await user.click(screen.getByRole('button', { name: /Acciones sugeridas/ }))
    await user.click(screen.getByRole('button', { name: 'Publicar la rúbrica' }))

    expect(onPick).toHaveBeenCalledWith('Publicar la rúbrica')
  })

  it('deshabilita las acciones cuando se le pide', async () => {
    const user = userEvent.setup()
    render(<CommitmentSuggestions departmentActions={ACTIONS} onPick={vi.fn()} disabled />)

    await user.click(screen.getByRole('button', { name: /Acciones sugeridas/ }))

    expect(screen.getByRole('button', { name: 'Publicar la rúbrica' })).toBeDisabled()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { BackButton } from '@/components/common/BackButton'

/** `BackButton` navigates through wouter's `useNavigate` when given `href`. */
function renderAt(ui: ReactElement, path = '/docentes/1') {
  const { hook, history } = memoryLocation({ path, record: true })

  return { history, ...render(<Router hook={hook}>{ui}</Router>) }
}

describe('BackButton', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads "Ir atrás" by default', () => {
    renderAt(<BackButton />)

    expect(screen.getByRole('button', { name: 'Ir atrás' })).toBeInTheDocument()
  })

  it('uses a custom label', () => {
    renderAt(<BackButton label="Volver a docentes" />)

    expect(screen.getByRole('button', { name: 'Volver a docentes' })).toBeInTheDocument()
  })

  it('prefers children over the label', () => {
    renderAt(<BackButton label="Ir atrás">Regresar</BackButton>)

    expect(screen.getByRole('button', { name: 'Regresar' })).toBeInTheDocument()
  })

  it('navigates to the given href instead of stepping back in history', async () => {
    const user = userEvent.setup()

    const { history } = renderAt(<BackButton href="/docentes" />)

    await user.click(screen.getByRole('button'))

    expect(history.at(-1)).toBe('/docentes')
  })

  it('runs a custom onBack instead of the default navigation', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    renderAt(<BackButton href="/docentes" onBack={onBack} />)

    await user.click(screen.getByRole('button'))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('falls back to fallbackHref when there is no history to go back to', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1)
    const user = userEvent.setup()

    const { history } = renderAt(<BackButton fallbackHref="/docentes" />)

    await user.click(screen.getByRole('button'))

    expect(history.at(-1)).toBe('/docentes')
  })

  it('steps back in history when there is a previous page', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2)
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const user = userEvent.setup()

    renderAt(<BackButton fallbackHref="/docentes" />)

    await user.click(screen.getByRole('button'))

    expect(historyBack).toHaveBeenCalledTimes(1)
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Download } from 'lucide-react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { PageTitle } from '@/components/common/PageTitle'

/** `PageTitle` renders a `BackButton`, which navigates through wouter. */
function renderTitle(ui: ReactElement, path = '/evaluaciones') {
  const { hook, history } = memoryLocation({ path, record: true })

  return { history, ...render(<Router hook={hook}>{ui}</Router>) }
}

describe('PageTitle', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders its content as the page heading', () => {
    renderTitle(<PageTitle>Evaluaciones</PageTitle>)

    expect(screen.getByRole('heading', { level: 1, name: 'Evaluaciones' })).toBeInTheDocument()
  })

  it('offers a way back by default', () => {
    renderTitle(<PageTitle>Evaluaciones</PageTitle>)

    expect(screen.getByRole('button', { name: 'Ir atrás' })).toBeInTheDocument()
  })

  it('hides the back button when asked to', () => {
    renderTitle(<PageTitle backButton={false}>Evaluaciones</PageTitle>)

    expect(screen.queryByRole('button', { name: 'Ir atrás' })).not.toBeInTheDocument()
  })

  it('renders no action buttons when none are configured', () => {
    renderTitle(<PageTitle backButton={false}>Evaluaciones</PageTitle>)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('labels the primary action "Nuevo" by default', () => {
    renderTitle(<PageTitle onAction={vi.fn()}>Evaluaciones</PageTitle>)

    expect(screen.getByRole('button', { name: /Nuevo/ })).toBeInTheDocument()
  })

  it('runs the primary action when it is clicked', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()

    renderTitle(
      <PageTitle onAction={onAction} actionLabel="Cargar evaluación">
        Evaluaciones
      </PageTitle>,
    )

    await user.click(screen.getByRole('button', { name: /Cargar evaluación/ }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('runs the secondary action when it is clicked', async () => {
    const user = userEvent.setup()
    const onSecondaryAction = vi.fn()

    renderTitle(
      <PageTitle
        onSecondaryAction={onSecondaryAction}
        secondaryActionLabel="Exportar"
        secondaryActionIcon={Download}
      >
        Evaluaciones
      </PageTitle>,
    )

    await user.click(screen.getByRole('button', { name: /Exportar/ }))

    expect(onSecondaryAction).toHaveBeenCalledTimes(1)
  })

  it('renders both actions together', () => {
    renderTitle(
      <PageTitle
        onAction={vi.fn()}
        actionLabel="Cargar"
        onSecondaryAction={vi.fn()}
        secondaryActionLabel="Exportar"
      >
        Evaluaciones
      </PageTitle>,
    )

    expect(screen.getByRole('button', { name: /Cargar/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeInTheDocument()
  })

  it('prefers a custom primary action element over the default button', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onCustom = vi.fn()

    renderTitle(
      <PageTitle
        onAction={onAction}
        action={
          <button type="button" onClick={onCustom}>
            Acción propia
          </button>
        }
      >
        Evaluaciones
      </PageTitle>,
    )

    expect(screen.queryByRole('button', { name: /Nuevo/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Acción propia' }))

    expect(onCustom).toHaveBeenCalledTimes(1)
    expect(onAction).not.toHaveBeenCalled()
  })

  it('prefers a custom secondary action element over the default button', () => {
    renderTitle(
      <PageTitle
        onSecondaryAction={vi.fn()}
        secondaryActionLabel="Exportar"
        secondaryAction={<span>Secundaria propia</span>}
      >
        Evaluaciones
      </PageTitle>,
    )

    expect(screen.getByText('Secundaria propia')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Exportar/ })).not.toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { DismissibleNotice } from '@/components/common/DismissibleNotice'

function renderNotice(storageKey = 'test-notice') {
  return render(
    <DismissibleNotice storageKey={storageKey}>
      <p>Los comentarios los clasificó un modelo de IA.</p>
    </DismissibleNotice>,
  )
}

describe('DismissibleNotice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the notice the first time', () => {
    renderNotice()

    expect(screen.getByText('Los comentarios los clasificó un modelo de IA.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar el aviso' })).toBeInTheDocument()
  })

  it('takes the notice away when closed', async () => {
    const user = userEvent.setup()

    renderNotice()

    await user.click(screen.getByRole('button', { name: 'Cerrar el aviso' }))

    expect(
      screen.queryByText('Los comentarios los clasificó un modelo de IA.'),
    ).not.toBeInTheDocument()
  })

  it('remembers the dismissal for the next visit', async () => {
    // The whole point of the X: the disclaimer says the same thing every time,
    // so a button that only lasts until the next reload buys the reader
    // nothing.
    const user = userEvent.setup()

    const first = renderNotice()
    await user.click(screen.getByRole('button', { name: 'Cerrar el aviso' }))
    first.unmount()

    renderNotice()

    expect(
      screen.queryByText('Los comentarios los clasificó un modelo de IA.'),
    ).not.toBeInTheDocument()
  })

  it('keeps each notice on its own key', async () => {
    const user = userEvent.setup()

    const first = renderNotice('one')
    await user.click(screen.getByRole('button', { name: 'Cerrar el aviso' }))
    first.unmount()

    renderNotice('two')

    expect(screen.getByText('Los comentarios los clasificó un modelo de IA.')).toBeInTheDocument()
  })

  it('shows the notice when the stored value is unreadable', () => {
    // A hand-edited or half-written entry must not hide a notice for good.
    localStorage.setItem('notice:test-notice', 'not json')

    renderNotice()

    expect(screen.getByText('Los comentarios los clasificó un modelo de IA.')).toBeInTheDocument()
  })

  it('names the close button when the default is too vague', () => {
    render(
      <DismissibleNotice storageKey="scoped" closeLabel="Cerrar el aviso de la IA">
        <p>Aviso</p>
      </DismissibleNotice>,
    )

    expect(screen.getByRole('button', { name: 'Cerrar el aviso de la IA' })).toBeInTheDocument()
  })
})

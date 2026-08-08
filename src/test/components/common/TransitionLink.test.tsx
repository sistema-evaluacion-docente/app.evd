import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MouseEvent } from 'react'

import { TransitionLink } from '@/components/common/TransitionLink'

describe('TransitionLink', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('renders as a link to the given href', () => {
    render(<TransitionLink href="/docentes">Docentes</TransitionLink>)

    expect(screen.getByRole('link', { name: 'Docentes' })).toHaveAttribute('href', '/docentes')
  })

  it('navigates to the href on click', async () => {
    const user = userEvent.setup()

    render(<TransitionLink href="/docentes">Docentes</TransitionLink>)

    await user.click(screen.getByRole('link', { name: 'Docentes' }))

    expect(window.location.pathname).toBe('/docentes')
  })

  it('runs the custom onClick handler', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <TransitionLink href="/docentes" onClick={onClick}>
        Docentes
      </TransitionLink>,
    )

    await user.click(screen.getByRole('link', { name: 'Docentes' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('skips navigation when the custom onClick already prevented the default', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault())

    render(
      <TransitionLink href="/docentes" onClick={onClick}>
        Docentes
      </TransitionLink>,
    )

    await user.click(screen.getByRole('link', { name: 'Docentes' }))

    expect(window.location.pathname).toBe('/')
  })
})

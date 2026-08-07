import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ActiveBadge } from '@/components/common/ActiveBadge'

describe('ActiveBadge', () => {
  it('reads "Activo" when the entity is active', () => {
    render(<ActiveBadge active />)

    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('reads "Desactivado" when the entity is inactive', () => {
    render(<ActiveBadge active={false} />)

    expect(screen.getByText('Desactivado')).toBeInTheDocument()
  })

  it('uses the custom active label when one is given', () => {
    render(<ActiveBadge active activeLabel="Habilitado" inactiveLabel="Suspendido" />)

    expect(screen.getByText('Habilitado')).toBeInTheDocument()
    expect(screen.queryByText('Suspendido')).not.toBeInTheDocument()
  })

  it('uses the custom inactive label when one is given', () => {
    render(<ActiveBadge active={false} activeLabel="Habilitado" inactiveLabel="Suspendido" />)

    expect(screen.getByText('Suspendido')).toBeInTheDocument()
    expect(screen.queryByText('Habilitado')).not.toBeInTheDocument()
  })
})

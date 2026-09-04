import { describe, expect, it, vi } from 'vitest'

import { AuthInitializer } from '@/features/auth/components/AuthInitializer'
import { render, screen } from '@/test/render'

const unsubscribe = vi.fn()
const subscribeToAuth = vi.fn(() => unsubscribe)

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (s: { subscribeToAuth: typeof subscribeToAuth }) => unknown) =>
    selector({ subscribeToAuth }),
}))

describe('AuthInitializer', () => {
  it('subscribes to auth changes and renders its children', () => {
    render(
      <AuthInitializer>
        <p>Contenido</p>
      </AuthInitializer>,
    )

    expect(subscribeToAuth).toHaveBeenCalled()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = render(
      <AuthInitializer>
        <p>x</p>
      </AuthInitializer>,
    )

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})

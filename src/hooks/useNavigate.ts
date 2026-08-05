import { useCallback } from 'react'
import { useLocation } from 'wouter'

function startViewTransition(callback: () => void) {
  if (document.startViewTransition) {
    document.startViewTransition(callback)
  } else {
    callback()
  }
}

/**
 * Returns a navigation function that triggers a View Transition before
 * changing the route. Falls back to a regular navigation on browsers that
 * don't support the View Transitions API.
 *
 * @example
 * const navigate = useNavigate();
 * navigate('/docentes/1');
 */
export function useNavigate() {
  const [, setLocation] = useLocation()

  const navigate = useCallback(
    (to: string) => {
      startViewTransition(() => setLocation(to))
    },
    [setLocation],
  )

  return navigate
}

import { useCallback } from 'react'
import { useLocation } from 'wouter'

import { scrollToTop } from '@/lib/scrollToTop'

function startViewTransition(callback: () => void) {
  if (document.startViewTransition) {
    document.startViewTransition(callback)
  } else {
    callback()
  }
}

/**
 * Returns a navigation function that triggers a View Transition before
 * changing the route, and lands on the top of the destination. Falls back to a
 * regular navigation on browsers that don't support the View Transitions API.
 *
 * @example
 * const navigate = useNavigate();
 * navigate('/docentes/1');
 */
export function useNavigate() {
  const [, setLocation] = useLocation()

  const navigate = useCallback(
    (to: string) => {
      startViewTransition(() => {
        setLocation(to)
        // Inside the transition callback, so the scroll is part of the frame
        // the browser captures as the new state instead of a jump after it.
        scrollToTop()
      })
    },
    [setLocation],
  )

  return navigate
}

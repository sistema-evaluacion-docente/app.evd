import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'wouter'

import { scrollToTop } from '@/lib/scrollToTop'

interface TransitionLinkProps {
  href: string
  children?: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

/**
 * Pushes the route and lands on the top of it. Kept in one place so both the
 * transition and the fallback path scroll — inside the transition callback the
 * scroll belongs to the frame captured as the new state, instead of jumping
 * once the animation is over.
 */
function go(href: string) {
  window.history.pushState(null, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
  scrollToTop()
}

function handleClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void,
) {
  onClick?.(e)

  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return
  }

  e.preventDefault()

  if (document.startViewTransition) {
    document.startViewTransition(() => go(href))
  } else {
    go(href)
  }
}

/**
 * Drop-in replacement for wouter's `<Link>` that wraps navigation in a
 * View Transition and lands on the top of the destination. Falls back
 * gracefully on unsupported browsers.
 *
 * @example
 * <TransitionLink href="/docentes">Docentes</TransitionLink>
 */
export function TransitionLink({ href, children, className, onClick }: TransitionLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => handleClick(e, href, onClick)}
    >
      {children}
    </Link>
  )
}

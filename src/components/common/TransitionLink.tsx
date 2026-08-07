import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'wouter'

interface TransitionLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
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
    document.startViewTransition(() => {
      window.history.pushState(null, '', href)
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
  } else {
    window.history.pushState(null, '', href)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

/**
 * Drop-in replacement for wouter's `<Link>` that wraps navigation in a
 * View Transition. Falls back gracefully on unsupported browsers.
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

import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY)

  mql.addEventListener('change', onStoreChange)

  return () => mql.removeEventListener('change', onStoreChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches
}

/**
 * Whether the viewport is narrower than the mobile breakpoint.
 *
 * Read through `useSyncExternalStore` rather than an effect that calls
 * `setState`: the media query is external state, so subscribing to it directly
 * gives the right answer on the very first render — an effect had to paint a
 * desktop layout first and correct itself a frame later.
 */
export function useIsMobile(): boolean {
  // The server snapshot never runs in this SPA, but `useSyncExternalStore`
  // requires one wherever the tree could be rendered without a `window`.
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}

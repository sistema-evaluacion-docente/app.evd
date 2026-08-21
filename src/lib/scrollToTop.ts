/**
 * Sends the reader to the top of the page. The app's scrolling happens in the
 * layout's `<main>`, not the window, so both are reset — a route opened from
 * halfway down a long list would otherwise start halfway down too.
 *
 * @example
 * scrollToTop()
 */
export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0 })
  document.querySelector('main')?.scrollTo({ top: 0, left: 0 })
}

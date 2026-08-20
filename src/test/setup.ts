import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

/**
 * jsdom doesn't implement `window.matchMedia` — needed by anything built on
 * `useIsMobile` (the sidebar primitive, in particular). Stubbed as
 * "never matches" so components default to desktop layout under test.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

/**
 * jsdom doesn't implement `scrollIntoView`. The plan form calls it to carry the
 * director to the first field it is missing, and without this every test that
 * submits an incomplete form dies on a method that isn't there.
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

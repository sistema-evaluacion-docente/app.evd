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
 * jsdom has no layout, so `window.scrollTo` is a stub that logs "Not
 * implemented" for every navigation. Replaced with a real no-op to keep test
 * output about the tests.
 */
window.scrollTo = () => {}

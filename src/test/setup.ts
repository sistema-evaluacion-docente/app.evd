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

/**
 * jsdom has no layout, so `window.scrollTo` is a stub that logs "Not
 * implemented" for every navigation. Replaced with a real no-op to keep test
 * output about the tests.
 */
window.scrollTo = () => {}

/**
 * Same for the element version, which jsdom does not define at all. Every
 * navigation goes through `scrollToTop`, and that resets the layout's `<main>`
 * as well as the window — so without this any test that navigates dies on it.
 */
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {}
}

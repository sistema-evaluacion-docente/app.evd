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

/**
 * Node 26 ships its own `localStorage` global, left `undefined` unless the
 * process gets `--localstorage-file`. In vitest's jsdom environment `window`
 * *is* `globalThis`, so that own property shadows the working implementation
 * jsdom would otherwise install — and everything built on `planFormStorage`
 * dies on `localStorage.getItem` of undefined.
 *
 * Replaced with an in-memory `Storage`, which is what tests want anyway: no
 * file on disk, and `clear()` in a `beforeEach` really starts from nothing.
 */
if (!window.localStorage) {
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => store.get(String(k)) ?? null,
    setItem: (k, v) => void store.set(String(k), String(v)),
    removeItem: (k) => void store.delete(String(k)),
    clear: () => store.clear(),
  }
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
}

/**
 * jsdom implements neither half of the object-URL pair, and every protected
 * file in the app (plan forms, signed scans, evidences, evaluation PDFs) is
 * fetched as a blob and handed to the browser through one.
 */
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:evd/test'
  URL.revokeObjectURL = () => {}
}

import { isAuthorizedForPage } from '@/config/security'

/** Query parameter carrying where the user was headed before signing in. */
export const NEXT_PARAM = 'next'

/** Where someone lands when there is nothing better to send them to. */
export const DEFAULT_LANDING = '/home'

/**
 * Builds the `?next=` a sign-in link should carry.
 *
 * @example
 * nextParamFor('/mis-planes/42', 'docente=7') // → 'next=%2Fmis-planes%2F42%3Fdocente%3D7'
 */
export function nextParamFor(path: string, search = ''): string {
  const target = search ? `${path}?${search}` : path

  return `${NEXT_PARAM}=${encodeURIComponent(target)}`
}

/**
 * Where to send someone once they sign in.
 *
 * A teacher opening the link in the "you have a new improvement plan" email is
 * bounced to the login page first, and this is what brings them back to the
 * plan instead of dropping them on the dashboard.
 *
 * Anything it cannot vouch for falls back to the dashboard:
 *
 * - It has to be a path on this site. `//evil.com` and `/\evil.com` are read by
 *   browsers as another host, so a `next` taken at face value would turn the
 *   login page into an open redirect — a link that looks like ours and lands
 *   the user somewhere else, right after they typed their password.
 * - It cannot be the login page itself, which would loop.
 * - The role has to be allowed to open it, or the redirect only trades the
 *   login screen for the "acceso no autorizado" one.
 *
 * @example
 * resolveNextPath('/mis-planes/42', 'DOCENTE')  // → '/mis-planes/42'
 * resolveNextPath('/planes/42', 'DOCENTE')      // → '/home'  (ruta del director)
 * resolveNextPath('//evil.com', 'DOCENTE')      // → '/home'
 */
export function resolveNextPath(next: string | null | undefined, role: string | null): string {
  if (!next) return DEFAULT_LANDING

  // Same-site only: one leading slash, and the next character may not turn it
  // into an authority. Browsers normalise a backslash to a slash here.
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return DEFAULT_LANDING
  }

  const path = next.split(/[?#]/)[0]

  if (path === '/login') return DEFAULT_LANDING
  if (!isAuthorizedForPage(path, role)) return DEFAULT_LANDING

  return next
}

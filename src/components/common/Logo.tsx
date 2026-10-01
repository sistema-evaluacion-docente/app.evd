import { cn } from '@/lib/utils'
import { TransitionLink } from './TransitionLink'

const ALT = 'Universidad Francisco de Paula Santander — Programa de Ingeniería de Sistemas'

/**
 * Official horizontal logo of the Ingeniería de Sistemas program. The color
 * version has black lettering, so dark mode swaps in the all-white version.
 * `className` sizes both images (e.g. `h-10`); width follows the aspect ratio.
 */
export function LogoImage({ className }: { className?: string }) {
  return (
    <>
      <img
        src="/logo-ingsistemas-color.png"
        alt={ALT}
        className={cn('block h-10 w-auto dark:hidden', className)}
      />
      <img
        src="/logo-ingsistemas-blanco.png"
        alt={ALT}
        className={cn('hidden h-10 w-auto dark:block', className)}
      />
    </>
  )
}

/**
 * Logo component that displays the logo image and links to the home page.
 */
function Logo({ className }: { className?: string }) {
  return (
    <TransitionLink href="/">
      <LogoImage className={className} />
    </TransitionLink>
  )
}

export default Logo

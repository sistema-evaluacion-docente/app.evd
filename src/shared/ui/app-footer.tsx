import { cn } from '@/shared/lib/utils'

/** Centered muted footer line shown at the bottom of every screen. */
export function AppFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <footer className={cn('pb-2 pt-6 text-center text-[11px] text-ink-400', className)}>
      {children}
    </footer>
  )
}

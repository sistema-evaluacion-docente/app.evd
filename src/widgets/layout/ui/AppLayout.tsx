import { useState, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import type { AppRole } from '../model/nav'
import { AppHeader, type AppHeaderProps } from './AppHeader'
import { AppSidebar } from './AppSidebar'

export interface AppLayoutProps {
  role: AppRole
  children: ReactNode
  /** Utility classes for the `<main>` content wrapper (max-width, spacing). */
  mainClassName?: string
  header?: Omit<AppHeaderProps, 'onOpenMenu'>
}

/** Application shell: role-based sidebar + header + scrollable content. */
export function AppLayout({
  role,
  children,
  mainClassName = 'max-w-[1320px] space-y-5',
  header,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ink-50">
      <AppSidebar
        role={role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenMenu={() => setMobileOpen(true)} {...header} />
        <main
          className={cn(
            'mx-auto w-full flex-1 px-4 py-6 lg:px-8 lg:py-8',
            mainClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

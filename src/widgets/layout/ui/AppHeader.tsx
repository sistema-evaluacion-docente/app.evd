import { Input } from '@/components/ui/input'
import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'

import { ThemeSwitcher } from '@/components/common/ThemeSwitcher'
import Avatar from '@/features/auth/components/Avatar'

export interface AppHeaderProps {
  onOpenMenu: () => void
  showBreadcrumb?: boolean
  breadcrumb?: ReactNode
  userName?: string
  userRole?: string
  /** Right-side control: academic-period selector or a teacher search box. */
  rightMode?: 'periodo' | 'search'
}

/**
 * AppHeader component.
 *
 * @param {AppHeaderProps} props - The properties for the AppHeader component.
 * @returns {JSX.Element} The rendered AppHeader component.
 */
export function AppHeader({
  onOpenMenu,
  showBreadcrumb = false,
  breadcrumb,
  rightMode = 'periodo',
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b backdrop-blur-md bg-muted/30 h-17! flex items-center w-full">
      <div className="flex w-full h-full items-center gap-3 px-4 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="hover:bg-muted inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>

        {showBreadcrumb && breadcrumb && (
          <nav className="text-muted-foreground hidden min-w-0 items-center gap-1.5 sm:flex animate-fade-in">
            {breadcrumb}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {
            rightMode === 'search' ? (
              <div className="hidden w-65 md:block">
                <Input placeholder="Buscar docente..." />
              </div>
            ) : null
            // <div className="hidden items-center gap-2 md:flex">
            //   <Calendar size={14} className="text-muted-foreground" />

            //   <span className="text-[13px] whitespace-nowrap">Periodo Académico:</span>

            //   <PeriodsSelector />
            // </div>
          }

          {/* <button
            type="button"
            className="cursor-pointer relative inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-card"
            aria-label="Notificaciones"
          >
            <Bell size={16} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-600 ring-2" />
          </button> */}

          <Avatar />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}

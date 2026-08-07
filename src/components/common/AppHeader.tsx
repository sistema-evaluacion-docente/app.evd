import { Input } from '@/components/ui/input'
import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'

import { useSidebar } from '@/components/ui/sidebar'
import { Avatar } from '@/features/auth'
import { NotificationsBell } from '@/features/notifications'

export interface AppHeaderProps {
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
  showBreadcrumb = false,
  breadcrumb,
  rightMode = 'periodo',
}: AppHeaderProps) {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar()
  const sidebarOpen = isMobile ? openMobile : open

  return (
    <header className="bg-background sticky top-0 z-30 flex h-17! w-full items-center border-b backdrop-blur-md">
      <div className="flex h-full w-full items-center gap-3 px-4 lg:px-8">
        <button
          type="button"
          onClick={toggleSidebar}
          className="hover:bg-muted inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md"
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarOpen}
        >
          <Menu size={18} />
        </button>

        {showBreadcrumb && breadcrumb && (
          <nav className="text-muted-foreground animate-fade-in hidden min-w-0 items-center gap-1.5 sm:flex">
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

          <NotificationsBell />
          <Avatar />
        </div>
      </div>
    </header>
  )
}

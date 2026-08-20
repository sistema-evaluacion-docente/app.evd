import { ShieldAlert } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'

import AppLayoutSkeleton from '@/components/skeletons/AppLayoutSkeleton'
import { Button } from '@/components/ui/button'
import { SidebarProvider } from '@/components/ui/sidebar'
import { isAuthorizedForPage } from '@/config/security'
import { UserNotAuth } from '@/features/auth'
import useAuth from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { AppHeader, type AppHeaderProps } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { AutoBreadcrumb } from './AutoBreadcrumb'

export interface AppLayoutProps {
  children: ReactNode
  mainClassName?: string
  header?: AppHeaderProps
  title?: string
}

export function AppLayout({
  children,
  mainClassName = 'max-w-6xl space-y-5',
  header,
  title,
}: AppLayoutProps) {
  const [location] = useLocation()
  const { isLoading, selectedRole, loggedIn } = useAuth()

  if (isLoading) {
    return <AppLayoutSkeleton />
  }

  if (!isLoading && !loggedIn) {
    return <UserNotAuth />
  }

  const authorized = isAuthorizedForPage(location, selectedRole)

  return (
    <SidebarProvider>
      <AppLayoutContent
        authorized={authorized}
        mainClassName={mainClassName}
        header={header}
        title={title}
      >
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  )
}

interface AppLayoutContentProps {
  children: ReactNode
  authorized: boolean
  mainClassName?: string
  header?: AppHeaderProps
  title?: string
}

function AppLayoutContent({ children, authorized, mainClassName, header }: AppLayoutContentProps) {
  return (
    <>
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader showBreadcrumb={true} breadcrumb={<AutoBreadcrumb />} {...header} />

        <div className="dark:bg-background relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fafafa]">
          <main
            className={cn(
              'relative mx-auto w-full flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8',
              mainClassName,
            )}
          >
            {authorized ? (
              <>{children}</>
            ) : (
              <div className="flex h-[calc(100vh-220px)] flex-col items-center justify-center py-20 text-center">
                <div className="animate-rise border-brand-200 bg-brand-50 mb-6 flex size-20 items-center justify-center rounded-2xl border">
                  <ShieldAlert aria-hidden="true" className="text-brand-600 size-9" />
                </div>

                <h2 className="animate-rise text-2xl font-bold tracking-tight">
                  Acceso no autorizado
                </h2>

                <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
                  No tienes permisos para acceder a esta página.
                </p>

                <Link to="/">
                  <Button>Volver al inicio</Button>
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

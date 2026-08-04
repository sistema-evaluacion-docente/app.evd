import { Button } from '@/components/ui/button'
import { SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'

import AppLayoutSkeleton from '@/components/skeletons/AppLayoutSkeleton'
import securityConfig from '@/config/security'
import { UserNotAuth } from '@/features/auth'
import useAuth from '@/hooks/useAuth'
import { AppHeader, type AppHeaderProps } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { AutoBreadcrumb } from './AutoBreadcrumb'
import { PageTitle } from './PageTitle'

export interface AppLayoutProps {
  children: ReactNode
  mainClassName?: string
  header?: AppHeaderProps
  title?: string
}

function isAuthorizedForPage(path: string, role: string | null): boolean {
  const pageConfig = securityConfig.pages.find(
    (page) =>
      (path === page.path || path.startsWith(page.path + '/')) && page.roles?.includes(role ?? ''),
  )

  return !pageConfig || (role !== null && pageConfig.roles.includes(role))
}

export function AppLayout({
  children,
  mainClassName = 'max-w-[1320px] space-y-5',
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

function AppLayoutContent({
  children,
  authorized,
  mainClassName,
  header,
  title,
}: AppLayoutContentProps) {
  return (
    <>
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader showBreadcrumb={true} breadcrumb={<AutoBreadcrumb />} {...header} />

        <div className="bg-muted flex min-h-0 flex-1 flex-col overflow-hidden">
          <main className={cn('mx-auto w-full flex-1 px-4 py-6 lg:px-8 lg:py-8', mainClassName)}>
            {authorized ? (
              <>
                {title ? <PageTitle>{title}</PageTitle> : null}
                {children}
              </>
            ) : (
              <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100">
                  <span className="text-4xl text-red-500">!</span>
                </div>

                <h2 className="text-2xl font-semibold">Acceso no autorizado</h2>

                <p className="mt-2 mb-4">No tienes permisos para acceder a esta página.</p>

                <Link to="/dashboard">
                  <Button variant="link">Volver al inicio</Button>
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

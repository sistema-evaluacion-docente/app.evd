import { Building2, ShieldAlert } from 'lucide-react'
import { type ReactNode, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Link, Redirect, useLocation, useSearchParams } from 'wouter'
import AppLayoutSkeleton from '@/components/skeletons/AppLayoutSkeleton'
import { RouteError } from './RouteError'
import { RouteFallback } from './RouteFallback'
import { Button } from '@/components/ui/button'
import { SidebarProvider } from '@/components/ui/sidebar'
import { isAuthorizedForPage, pagesForPath } from '@/config/security'
import { UserNotAuth } from '@/features/auth'
import { nextParamFor } from '@/features/auth/lib/nextPath'
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

/**
 * Why a page will not open, or `null` when it will.
 *
 * `'role'` and `'department'` are two very different dead ends and must not
 * share a screen: a director who lands on the improvement plans has every right
 * to be there, they are simply not attached to a department yet, and telling
 * them "acceso no autorizado" sends them to argue about permissions instead of
 * to the administrator who can fix it.
 */
function pageBlockReason(
  location: string,
  role: string | null,
  hasDepartment: boolean,
): 'role' | 'department' | null {
  if (isAuthorizedForPage(location, role, { hasDepartment })) return null

  const allowedByRole = pagesForPath(location).some((page) => page.roles.includes(role ?? ''))

  return allowedByRole ? 'department' : 'role'
}

export function AppLayout({
  children,
  mainClassName = 'max-w-6xl space-y-5',
  header,
  title,
}: AppLayoutProps) {
  const [location] = useLocation()
  const [searchParams] = useSearchParams()
  const { isLoading, selectedRole, loggedIn, user } = useAuth()

  if (isLoading) {
    return <AppLayoutSkeleton />
  }

  if (!loggedIn) {
    if (!user) {
      return <Redirect to={`/login?${nextParamFor(location, searchParams.toString())}`} replace />
    }
    return <UserNotAuth />
  }

  const blocked = pageBlockReason(location, selectedRole, user?.department_id != null)

  return (
    <SidebarProvider>
      <AppLayoutContent
        blocked={blocked}
        location={location}
        role={selectedRole}
        hasDepartment={user?.department_id != null}
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
  blocked: 'role' | 'department' | null
  location: string
  role: string | null
  hasDepartment: boolean
  mainClassName?: string
  header?: AppHeaderProps
  title?: string
}

function AppLayoutContent({
  children,
  blocked,
  location,
  role,
  hasDepartment,
  mainClassName,
  header,
}: AppLayoutContentProps) {
  return (
    <>
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          showBreadcrumb={true}
          breadcrumb={<AutoBreadcrumb role={role} hasDepartment={hasDepartment} />}
          {...header}
        />

        <div className="dark:bg-background relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fafafa]">
          <main
            className={cn(
              'relative mx-auto w-full flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8',
              mainClassName,
            )}
          >
            {blocked === null ? (
              <ErrorBoundary FallbackComponent={RouteError} resetKeys={[location]}>
                <Suspense fallback={<RouteFallback />}>{children}</Suspense>
              </ErrorBoundary>
            ) : (
              <PageBlocked reason={blocked} />
            )}
          </main>
        </div>
      </div>
    </>
  )
}

/** The dead end, worded for whichever of the two reasons put the user here. */
function PageBlocked({ reason }: { reason: 'role' | 'department' }) {
  const isDepartment = reason === 'department'

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col items-center justify-center py-20 text-center">
      <div className="animate-rise border-brand-200 bg-brand-50 mb-6 flex size-20 items-center justify-center rounded-2xl border">
        {isDepartment ? (
          <Building2 aria-hidden="true" className="text-brand-600 size-9" />
        ) : (
          <ShieldAlert aria-hidden="true" className="text-brand-600 size-9" />
        )}
      </div>

      <h2 className="animate-rise text-2xl font-bold tracking-tight">
        {isDepartment ? 'Sin departamento asignado' : 'Acceso no autorizado'}
      </h2>

      <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
        {isDepartment
          ? 'Su usuario no está vinculado a un departamento. Contacte al administrador del sistema.'
          : 'No tienes permisos para acceder a esta página.'}
      </p>

      <Link to="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  )
}

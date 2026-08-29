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
import { ROLES_LABEL, UserNotAuth } from '@/features/auth'
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

/**
 * Another role of the same account that *would* open this page, if there is one.
 *
 * An account can hold both roles — a director who is also a teacher, which is
 * what a plan drawn up on oneself looks like — and the notice about that plan
 * links to `/mis-planes/:id`, a route only the DOCENTE role opens. Landing there
 * as a director is not a permission problem: the person may read it, they are
 * just wearing the other hat. Sending them to "acceso no autorizado" over that
 * is how the link dead-ends.
 */
function switchableRole(
  location: string,
  roles: string[],
  selectedRole: string | null,
  hasDepartment: boolean,
): string | null {
  return (
    roles.find(
      (role) => role !== selectedRole && isAuthorizedForPage(location, role, { hasDepartment }),
    ) ?? null
  )
}

export function AppLayout({
  children,
  mainClassName = 'max-w-6xl space-y-5',
  header,
  title,
}: AppLayoutProps) {
  const [location] = useLocation()
  const [searchParams] = useSearchParams()
  const { isLoading, selectedRole, loggedIn, user, setSelectedRole } = useAuth()

  if (isLoading) {
    return <AppLayoutSkeleton />
  }

  if (!loggedIn) {
    if (!user) {
      return <Redirect to={`/login?${nextParamFor(location, searchParams.toString())}`} replace />
    }
    return <UserNotAuth />
  }

  const hasDepartment = user?.department_id != null
  const blocked = pageBlockReason(location, selectedRole, hasDepartment)
  const otherRole =
    blocked === 'role'
      ? switchableRole(location, user?.roles ?? [], selectedRole, hasDepartment)
      : null

  return (
    <SidebarProvider>
      <AppLayoutContent
        blocked={blocked}
        otherRole={otherRole}
        onSwitchRole={setSelectedRole}
        location={location}
        role={selectedRole}
        hasDepartment={hasDepartment}
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
  /** Role of the same account that opens this page, when the block is by role. */
  otherRole: string | null
  onSwitchRole: (role: string) => void
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
  otherRole,
  onSwitchRole,
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
              <PageBlocked reason={blocked} otherRole={otherRole} onSwitchRole={onSwitchRole} />
            )}
          </main>
        </div>
      </div>
    </>
  )
}

/**
 * The dead end, worded for whichever of the two reasons put the user here — and
 * not a dead end at all when another role of the same account opens the page.
 */
function PageBlocked({
  reason,
  otherRole,
  onSwitchRole,
}: {
  reason: 'role' | 'department'
  otherRole: string | null
  onSwitchRole: (role: string) => void
}) {
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
        {isDepartment
          ? 'Sin departamento asignado'
          : otherRole
            ? 'Esta página es de otro de tus roles'
            : 'Acceso no autorizado'}
      </h2>

      <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
        {isDepartment
          ? 'Su usuario no está vinculado a un departamento. Contacte al administrador del sistema.'
          : otherRole
            ? `Tu cuenta puede abrirla como ${ROLES_LABEL[otherRole] ?? otherRole}. Cambia de rol para continuar.`
            : 'No tienes permisos para acceder a esta página.'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {otherRole && (
          <Button onClick={() => onSwitchRole(otherRole)}>
            Continuar como {ROLES_LABEL[otherRole] ?? otherRole}
          </Button>
        )}

        <Link to="/">
          <Button variant={otherRole ? 'outline' : 'default'}>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  )
}

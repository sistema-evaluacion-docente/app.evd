import { Home } from 'lucide-react'
import { Fragment, useMemo } from 'react'
import { useLocation } from 'wouter'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { isAuthorizedForPage } from '@/config/security'
import { useNavigate } from '@/hooks/useNavigate'

const SEGMENT_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  teachers: 'Docentes',
  upload: 'Cargar',
  matrix: 'Matriz',
  plans: 'Planes',
  subjects: 'Materias',
  evaluations: 'Evaluaciones',
  evaluation: 'Evaluación',
  dimensions: 'Dimensiones',
  groups: 'Grupos',
  comments: 'Comentarios',
  summary: 'Mi resumen',
  me: 'Mi cuenta',
  history: 'Historial',
  profile: 'Perfil',
  users: 'Usuarios',
  admin: 'Administración',
  directors: 'Directores',
  periods: 'Periodos',
  settings: 'Configuración',
  faculties: 'Facultades',
  departments: 'Departamentos',
  logs: 'Logs',
  pdf: 'Documento',
}

export interface AutoBreadcrumbProps {
  /**
   * Role the trail is rendered for. Crumbs this role can't open are printed as
   * plain text instead of links. Omit to link every crumb — the trail then
   * makes no claim about permissions.
   */
  role?: string | null
}

interface Crumb {
  label: string
  href: string
  isCurrent: boolean
}

function getLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

function isNumericId(segment: string): boolean {
  return /^\d+$/.test(segment)
}

/**
 * Automatically builds a breadcrumb trail from the current wouter route,
 * skipping numeric ids, with a home link that includes a house icon.
 *
 * @example
 * <AutoBreadcrumb />
 *
 * @example
 * // Only links the crumbs a teacher may actually open.
 * <AutoBreadcrumb role={selectedRole} />
 */
export function AutoBreadcrumb({ role }: AutoBreadcrumbProps = {}) {
  const [location] = useLocation()
  const navigate = useNavigate()

  const items = useMemo(() => {
    const segments = location.split('/').filter(Boolean)
    const result: Crumb[] = []

    let currentPath = ''

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      currentPath += `/${segment}`

      if (isNumericId(segment)) {
        continue
      }

      // "materias/:courseCode/:groupName" always resolves to the same
      // subject detail page — collapse the trio into one crumb instead of
      // three, since "materias" alone has no page of its own to link to.
      if (segment === 'materias' && segments[i + 1] && segments[i + 2]) {
        const courseCode = decodeURIComponent(segments[i + 1])
        const groupName = decodeURIComponent(segments[i + 2])
        currentPath += `/${segments[i + 1]}/${segments[i + 2]}`

        result.push({
          label: `${courseCode} · Grupo ${groupName}`,
          href: currentPath,
          isCurrent: true,
        })

        break
      }

      const isLast = i === segments.length - 1 || segments.slice(i + 1).every(isNumericId)
      const label = getLabel(segment)

      result.push({
        label,
        href: currentPath,
        isCurrent: isLast,
      })
    }

    return result
  }, [location])

  if (items.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => navigate('/home')}
            className="inline-flex cursor-pointer items-center gap-1.5"
          >
            <Home aria-hidden="true" className="size-3.5" />
            Inicio
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item) => (
          <Fragment key={item.href}>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              {item.isCurrent || (role != null && !isAuthorizedForPage(item.href, role)) ? (
                // A crumb the role can't open — e.g. "Evaluaciones" above the
                // teacher's own PDF — is plain text: linking it would only
                // lead to the "unauthorized" screen.

                <BreadcrumbPage
                  className={item.isCurrent ? 'text-foreground font-medium' : undefined}
                >
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink onClick={() => navigate(item.href)} className="cursor-pointer">
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

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
  summary: 'Mi Resumen',
  me: 'Mi Cuenta',
  history: 'Historial',
  profile: 'Perfil',
  users: 'Usuarios',
  admin: 'Administración',
  directors: 'Directores',
  periods: 'Períodos',
  settings: 'Configuración',
  faculties: 'Facultades',
  departments: 'Departamentos',
  logs: 'Logs',
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
 */
export function AutoBreadcrumb() {
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
            onClick={() => navigate('/')}
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
              {item.isCurrent ? (
                <BreadcrumbPage className="text-foreground font-medium">
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

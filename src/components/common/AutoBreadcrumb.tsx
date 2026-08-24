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

/**
 * Label per route segment. Keyed on the Spanish segments the router actually
 * uses (see `src/app/App.tsx`) — an English key here matches nothing and lets
 * the crumb fall through to the raw segment, which is how "Mis-planes" and
 * "Configuracion" used to reach the screen.
 */
const SEGMENT_LABELS: Record<string, string> = {
  notificaciones: 'Notificaciones',
  periodos: 'Periodos',
  materias: 'Materias',
  docentes: 'Docentes',
  cargar: 'Cargar',
  comparar: 'Comparar',
  alertas: 'Alertas',
  comentarios: 'Comentarios',
  'mis-planes': 'Mis planes',
  planes: 'Planes de mejoramiento',
  nuevo: 'Nuevo',
  editar: 'Editar',
  acciones: 'Acciones sugeridas',
  programas: 'Programas académicos',
  evaluaciones: 'Evaluaciones',
  dimensiones: 'Dimensiones',
  pdf: 'Documento',
  admin: 'Administración',
  logs: 'Historial',
  configuracion: 'Configuración',
  facultades: 'Facultades',
  departamentos: 'Departamentos',
  usuarios: 'Usuarios',
  directores: 'Directores',
}

export interface AutoBreadcrumbProps {
  /**
   * Role the trail is rendered for. Crumbs this role can't open are printed as
   * plain text instead of links. Omit to link every crumb — the trail then
   * makes no claim about permissions.
   */
  role?: string | null
  /**
   * Whether the user is attached to a department. Crumbs for pages that need
   * one are printed as plain text without it, the same way the role gate does.
   */
  hasDepartment?: boolean
}

interface Crumb {
  label: string
  href: string
  isCurrent: boolean
  /**
   * `false` for a crumb whose path is only a piece of a longer route and has no
   * page of its own — the subject code in `/materias/:code/docentes/:id`.
   * Linking it would land on the 404 screen.
   */
  linkable: boolean
}

function getLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

function isNumericId(segment: string): boolean {
  return /^\d+$/.test(segment)
}

/**
 * Builds the crumbs for a path, without deciding yet which one is current.
 *
 * Everything the trail has to special-case lives here: `/home` (the root crumb
 * already says "Inicio"), numeric ids, and the two shapes the word "materias"
 * takes — a teacher browsing their own periods, and a director opening a
 * subject from the department list.
 */
function buildCrumbs(location: string): Crumb[] {
  const segments = location.split('/').filter(Boolean)
  const crumbs: Crumb[] = []

  let currentPath = ''

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`

    // The root crumb is already "Inicio"; a second one only repeats it.
    if (segment === 'home') continue

    if (isNumericId(segment)) continue

    // "/periodos/:period/materias/:courseCode/:groupName" always resolves to
    // the same subject detail page — collapse the trio into one crumb instead
    // of three, since "materias" nested there has no page of its own.
    if (segment === 'materias' && i > 0 && segments[i + 1] && segments[i + 2]) {
      const courseCode = decodeURIComponent(segments[i + 1])
      const groupName = decodeURIComponent(segments[i + 2])
      currentPath += `/${segments[i + 1]}/${segments[i + 2]}`

      crumbs.push({
        label: `${courseCode} · Grupo ${groupName}`,
        href: currentPath,
        isCurrent: false,
        linkable: true,
      })

      break
    }

    // "/materias/:courseCode/…" at the root is the director's route: the list
    // page exists, the subject on its own does not. The segment after the code
    // ("docentes") is a connector before a teacher id, not a crumb.
    if (segment === 'materias' && i === 0 && segments[1]) {
      crumbs.push({ label: getLabel(segment), href: currentPath, isCurrent: false, linkable: true })

      currentPath += `/${segments[1]}`
      crumbs.push({
        label: decodeURIComponent(segments[1]),
        href: currentPath,
        isCurrent: false,
        linkable: false,
      })

      i += 1

      if (segments[i + 1] === 'docentes') {
        currentPath += `/${segments[i + 1]}`
        i += 1
      }

      continue
    }

    crumbs.push({ label: getLabel(segment), href: currentPath, isCurrent: false, linkable: true })
  }

  const last = crumbs.at(-1)
  if (last) last.isCurrent = true

  return crumbs
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
export function AutoBreadcrumb({ role, hasDepartment }: AutoBreadcrumbProps = {}) {
  const [location] = useLocation()
  const navigate = useNavigate()

  const items = useMemo(() => buildCrumbs(location), [location])

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
              {item.isCurrent ||
              !item.linkable ||
              (role != null && !isAuthorizedForPage(item.href, role, { hasDepartment })) ? (
                // A crumb the role can't open — e.g. "Evaluaciones" above the
                // teacher's own PDF — is plain text: linking it would only
                // lead to the "unauthorized" screen.

                <BreadcrumbPage
                  // Only the last crumb is the page you are on. The primitive
                  // hardcodes `aria-current`, and a trail that claims it twice
                  // tells a screen reader the wrong thing.
                  aria-current={item.isCurrent ? 'page' : undefined}
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

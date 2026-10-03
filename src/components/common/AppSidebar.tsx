import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Bell,
  Building2,
  ClipboardCheck,
  Clock,
  FileChartColumnIncreasing,
  FileText,
  GraduationCap,
  Layers,
  LayoutGrid,
  Library,
  Lightbulb,
  Logs,
  MessagesSquare,
  Settings,
  TriangleAlert,
  UserSearch,
  Users,
} from 'lucide-react'
import { useLocation } from 'wouter'

import { getMenus, type SecurityConfig } from '@/config/security'
import useAuth from '@/hooks/useAuth'
import { useNavigate } from '@/hooks/useNavigate'
import { DevelopedBy } from './DevelopedBy'
import { LogoImage } from './Logo'
import { TransitionLink } from './TransitionLink'

const DEFAULT_ICON = FileText

const MENU_ICON_BY_PATH: Record<string, typeof DEFAULT_ICON> = {
  '/home': FileChartColumnIncreasing,
  '/dashboard': LayoutGrid,
  '/notificaciones': Bell,
  '/periodos': Clock,
  '/periodos/materias': Layers,
  '/evaluaciones': ClipboardCheck,
  '/docentes': Users,
  '/materias': Layers,
  '/comentarios': MessagesSquare,
  '/alertas': TriangleAlert,
  '/acciones': Lightbulb,
  '/programas': GraduationCap,
  '/admin/facultades': Building2,
  '/admin/departamentos': Library,
  '/admin/periodos': Clock,
  '/admin/usuarios': Users,
  '/admin/directores': UserSearch,
  '/admin/documentos': FileText,
  '/admin/configuracion': Settings,
  '/admin/historial': Logs,
}

/**
 * Picks the single most specific menu item for the current location — the
 * longest path that either matches exactly or is a real parent segment of
 * it (`/periodos` matches `/periodos/1`, but not `/periodos-x`). Without
 * this, a naive "does it start with" check marks every ancestor route
 * active alongside the actual current page (e.g. both "Periodos" and
 * "Materias" light up while on `/periodos/materias`).
 */
function getActivePath(items: SecurityConfig['pages'], location: string): string | undefined {
  return items
    .map((item) => item.path)
    .filter(
      (path) =>
        path !== '#' && (path === location || (path !== '/' && location.startsWith(`${path}/`))),
    )
    .reduce<string | undefined>(
      (longest, path) => (longest === undefined || path.length > longest.length ? path : longest),
      undefined,
    )
}

export function AppSidebar() {
  const [location] = useLocation()
  const { setOpenMobile } = useSidebar()
  const { selectedRole, user } = useAuth()
  const navigate = useNavigate()

  if (!selectedRole) {
    return null
  }

  const items = getMenus(selectedRole, { hasDepartment: user?.department_id != null })
  const activePath = getActivePath(items, location)

  return (
    <Sidebar collapsible="offcanvas" side="left" variant="sidebar">
      {/* Identidad del producto arriba; el respaldo institucional va en el pie. */}
      <SidebarHeader className="p-4">
        <TransitionLink href="/" className="flex items-center gap-3 rounded-md">
        <img src="/logo-vertical.png" alt="Logo" className="h-10 w-auto" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">EVIDE</span>
            <span className="text-muted-foreground truncate text-xs">Evaluación docente</span>
          </span>
        </TransitionLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú principal</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = MENU_ICON_BY_PATH[item.path] ?? DEFAULT_ICON

                if (item.path === '/home' && selectedRole === 'ADMIN') return null

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={item.path === activePath}
                      className={'cursor-pointer'}
                      onClick={() => {
                        setOpenMobile(false)
                        navigate(item.path)
                      }}
                    >
                      <Icon />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="border-sidebar-border border-b pb-3 justify-around">
            <LogoImage className="h-13" />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <DevelopedBy />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

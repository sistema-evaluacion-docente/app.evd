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
  LogOut,
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
import Logo from './Logo'

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
  '/admin/logs': Logs,
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
  const { handleLogout, selectedRole, user } = useAuth()
  const navigate = useNavigate()

  if (!selectedRole) {
    return null
  }

  const items = getMenus(selectedRole, { hasDepartment: user?.department_id != null })
  const activePath = getActivePath(items, location)

  return (
    <Sidebar collapsible="offcanvas" side="left" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <Logo className="h-7! w-7!" />
          <span className="text-sm leading-tight font-semibold">Evaluación Docente</span>
        </div>
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
          <SidebarMenuItem>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

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
  Building2,
  ClipboardCheck,
  Clock,
  FileText,
  LayoutGrid,
  Library,
  LogOut,
  Logs,
  Settings,
  UserSearch,
  Users,
} from 'lucide-react'
import { useLocation } from 'wouter'

import { getMenus } from '@/config/security'
import useAuth from '@/hooks/useAuth'
import { useNavigate } from '@/hooks/useNavigate'
import Logo from './Logo'

const DEFAULT_ICON = FileText

const MENU_ICON_BY_PATH: Record<string, typeof DEFAULT_ICON> = {
  '/dashboard': LayoutGrid,
  '/periodos': Clock,
  '/evaluaciones': ClipboardCheck,
  '/docentes': Users,
  '/admin/faculties': Building2,
  '/admin/departments': Library,
  '/admin/periods': Clock,
  '/admin/users': Users,
  '/admin/directors': UserSearch,
  '/admin/documents': FileText,
  '/admin/settings': Settings,
  '/admin/logs': Logs,
}

export function AppSidebar() {
  const [location] = useLocation()
  const { setOpenMobile } = useSidebar()
  const { handleLogout, selectedRole } = useAuth()
  const navigate = useNavigate()

  if (!selectedRole) {
    return null
  }

  const items = getMenus(selectedRole)

  return (
    <Sidebar collapsible="offcanvas" side="left" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <Logo className="h-8! w-8!" />
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
                const active =
                  item.path !== '#' &&
                  (location === item.path || location.startsWith(`${item.path}/`))

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={active}
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

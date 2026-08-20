import { Bell, Building2, LogOut } from 'lucide-react'

import { AvatarFallback, AvatarImage, Avatar as AvatarPrimitive } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from '@/hooks/useNavigate'
import { useAuthStore } from '../store/useAuthStore'

export function Avatar() {
  const navigate = useNavigate()

  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const handleLogout = useAuthStore((s) => s.handleLogout)
  const selectedRole = useAuthStore((s) => s.selectedRole)
  const setSelectedRole = useAuthStore((s) => s.setSelectedRole)

  const userName = user?.name
  const userRoles = user?.roles ?? []
  const visibleRole = selectedRole ?? userRoles[0] ?? 'Sin rol'
  const department = user?.department_name

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="hidden text-right sm:block">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-1.5 h-2.5 w-16" />
        </div>

        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden text-right sm:block">
        <div className="max-w-40 truncate text-[13px] leading-tight font-medium">{userName}</div>

        <div className="text-muted-foreground mt-0.5 flex flex-col items-end justify-end gap-1 text-[11px] leading-tight">
          <span className="truncate tracking-wide uppercase">{visibleRole}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="ring-offset-background focus-visible:ring-ring cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
          <AvatarPrimitive size="lg" className="transition-shadow">
            <AvatarImage src={user?.avatar_url} alt={userName} />

            <AvatarFallback>
              <span className="text-foreground text-xs font-semibold">
                {userName?.slice(0, 2).toUpperCase()}
              </span>
            </AvatarFallback>
          </AvatarPrimitive>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-3">
              <AvatarPrimitive size="lg" className="shrink-0">
                <AvatarImage src={user?.avatar_url} alt={userName} />

                <AvatarFallback>
                  <span className="text-foreground text-xs font-semibold">
                    {userName?.slice(0, 2).toUpperCase()}
                  </span>
                </AvatarFallback>
              </AvatarPrimitive>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{userName}</div>

                <div className="text-muted-foreground mt-0.5 truncate text-xs">{visibleRole}</div>

                {department ? (
                  <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                    <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{department}</span>
                  </div>
                ) : null}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate('/notificaciones')}>
              <Bell className="size-4" aria-hidden="true" />
              Notificaciones
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>

              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={selectedRole ?? ''}
                  onValueChange={(value) => {
                    navigate('/home')
                    setSelectedRole(value)
                  }}
                >
                  {userRoles.map((role) => (
                    <DropdownMenuRadioItem key={role} value={role}>
                      {role}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

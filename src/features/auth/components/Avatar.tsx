import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarPrimitive,
} from "@/components/ui/avatar";
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
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import useAuth from "@/shared/hooks/useAuth";
import { useLocation } from "wouter";

function Avatar() {
  const [, setLocation] = useLocation();

  const { user, isLoading, handleLogout, selectedRole, setSelectedRole } =
    useAuth();

  const userName = user?.name;
  const userRoles = user?.roles ?? [];
  const visibleRole = selectedRole ?? userRoles[0] ?? "Sin rol";

  if (isLoading) {
    return (
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="ml-1 flex items-center gap-2.5 border-l pl-2 sm:pl-3">
      <div className="hidden text-right leading-tight sm:block">
        <div className="text-[13px] font-semibold">{userName}</div>
        <div className="text-[11px] text-muted-foreground">{visibleRole}</div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <div className="relative">
            <AvatarPrimitive>
              <AvatarImage src={user?.avatar_url} />

              <AvatarFallback>
                <span className="text-sm text-muted-foreground">
                  {userName?.slice(0, 2)}
                </span>
              </AvatarFallback>
            </AvatarPrimitive>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">
              {userName}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setLocation("/me/profile")}>
              Perfil
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>

              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={selectedRole ?? ""}
                  onValueChange={(value) => {
                    setLocation("/dashboard");
                    setSelectedRole(value);
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
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default Avatar;

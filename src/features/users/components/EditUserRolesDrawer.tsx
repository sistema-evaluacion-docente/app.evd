import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

import type { User } from "@/features/auth/types/User";
import { ALLOWED_USER_ROLES, type AllowedUserRole } from "./userRoles";
import { Save, Undo2 } from "lucide-react";

interface EditUserRolesDrawerProps {
  open: boolean;
  user: User | null;
  selectedRoles: AllowedUserRole[];
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleRole: (role: AllowedUserRole) => void;
  onSave: () => void;
}

function EditUserRolesDrawer({
  open,
  user,
  selectedRoles,
  isSaving = false,
  onOpenChange,
  onToggleRole,
  onSave,
}: EditUserRolesDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full max-w-md">
        <DrawerHeader>
          <DrawerTitle>Editar usuario</DrawerTitle>

          <DrawerDescription>
            Solo puedes editar roles. Los demás datos son informativos.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <Input value={user?.name ?? ""} disabled />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Usuario</label>
            <Input value={user?.username ?? ""} disabled />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Correo</label>
            <Input value={user?.email ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Roles permitidos</label>
            <p className="text-xs text-muted-foreground">
              Solo se permite asignar: DOCENTE, DIRECTOR y ADMIN.
            </p>

            <div className="space-y-2">
              {ALLOWED_USER_ROLES.map((role) => {
                const checked = selectedRoles.includes(role);

                return (
                  <label
                    key={role}
                    className="flex items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleRole(role)}
                      disabled={isSaving}
                    />
                    <span>{role}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            <Undo2 />
            Cancelar
          </Button>

          <Button type="button" onClick={onSave} disabled={isSaving}>
            <Save />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default EditUserRolesDrawer;

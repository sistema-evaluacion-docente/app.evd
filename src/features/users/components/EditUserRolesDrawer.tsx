import FormDrawer from "@/components/common/FormDrawer";
import { Input } from "@/components/ui/input";

import type { User } from "@/features/auth/types/User";
import { ALLOWED_USER_ROLES, type AllowedUserRole } from "./userRoles";

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
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave();
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Editar usuario"
      description="Solo puedes editar roles. Los demás datos son informativos."
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      contentClassName="h-full w-full max-w-md"
    >
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
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleRole(role)}
                  disabled={isSaving}
                />
                <span>{role}</span>
              </label>
            );
          })}
        </div>
      </div>
    </FormDrawer>
  );
}

export default EditUserRolesDrawer;

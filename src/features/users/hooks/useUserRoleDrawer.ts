import type { User } from "@/features/auth/types/User";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { ALLOWED_USER_ROLES, type AllowedUserRole } from "../components/userRoles";
import useUpdateUserRoles from "./useUpdateUserRoles";

export default function useUserRoleDrawer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AllowedUserRole[]>([]);
  const { mutateAsync: updateUserRoles, isPending: isSavingRoles } =
    useUpdateUserRoles();

  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    setSelectedRoles(
      user.roles.filter((role): role is AllowedUserRole =>
        ALLOWED_USER_ROLES.includes(role as AllowedUserRole),
      ),
    );
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback((open: boolean) => {
    setIsDrawerOpen(open);

    if (!open) {
      setEditingUser(null);
      setSelectedRoles([]);
    }
  }, []);

  const toggleRole = useCallback((role: AllowedUserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((item) => item !== role)
        : [...prev, role],
    );
  }, []);

  const handleSaveRoles = useCallback(async () => {
    if (!editingUser) return;

    if (selectedRoles.length === 0) {
      toast.error("Debes asignar al menos un rol: DOCENTE, DIRECTOR o ADMIN.");
      return;
    }

    try {
      await updateUserRoles({
        userId: editingUser.uid,
        roles: selectedRoles,
      });

      toast.success(`Roles actualizados para ${editingUser.name}.`);
      setIsDrawerOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible actualizar los roles del usuario.";

      toast.error(message);
    }
  }, [editingUser, selectedRoles, updateUserRoles]);

  return {
    isDrawerOpen,
    editingUser,
    selectedRoles,
    isSavingRoles,
    handleEditUser,
    handleCloseDrawer,
    toggleRole,
    handleSaveRoles,
  };
}

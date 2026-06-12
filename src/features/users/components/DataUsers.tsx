import { useMemo } from "react";

import DataTable, { type DataTableAction } from "@/components/common/DataTable";
import type { User } from "@/features/auth/types/User";
import useGetUsers from "../hooks/useGetUsers";
import useUserColumns from "../hooks/useUserColumns";
import useUserRoleDrawer from "../hooks/useUserRoleDrawer";
import useUserStatusActions from "../hooks/useUserStatusActions";
import EditUserRolesDrawer from "./EditUserRolesDrawer";

function DataUsers() {
  const columns = useUserColumns();

  const {
    isDrawerOpen,
    editingUser,
    selectedRoles,
    isSavingRoles,
    handleEditUser,
    handleCloseDrawer,
    toggleRole,
    handleSaveRoles,
  } = useUserRoleDrawer();

  const {
    isDisablingUser,
    isEnablingUser,
    handleDisableUser,
    handleEnableUser,
  } = useUserStatusActions();

  const rowActions = useMemo<DataTableAction<User>[]>(
    () => [
      {
        label: "Editar",
        onClick: (user) => handleEditUser(user),
      },
      {
        label: "Habilitar",
        visible: (user) => !user.active,
        className: "text-emerald-600 focus:text-emerald-700",
        onClick: (user) => handleEnableUser(user),
        disabled: () => isEnablingUser,
      },
      {
        label: "Deshabilitar",
        variant: "destructive",
        visible: (user) => user.active,
        disabled: () => isDisablingUser,
        onClick: (user) => handleDisableUser(user),
      },
    ],
    [
      handleDisableUser,
      handleEditUser,
      handleEnableUser,
      isDisablingUser,
      isEnablingUser,
    ],
  );

  return (
    <>
      <DataTable
        columns={columns}
        queryFn={useGetUsers}
        emptyMessage="No hay usuarios para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
      />

      <EditUserRolesDrawer
        open={isDrawerOpen}
        user={editingUser}
        selectedRoles={selectedRoles}
        isSaving={isSavingRoles}
        onOpenChange={handleCloseDrawer}
        onToggleRole={toggleRole}
        onSave={handleSaveRoles}
      />
    </>
  );
}

export default DataUsers;

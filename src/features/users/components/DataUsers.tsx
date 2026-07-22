import { useMemo, useState } from 'react'

import DataTable, { type DataTableAction } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import type { User } from '@/features/auth/types/User'
import { Plus } from 'lucide-react'
import useGetUsers from '../hooks/useGetUsers'
import useUserColumns from '../hooks/useUserColumns'
import useUserRoleDrawer from '../hooks/useUserRoleDrawer'
import useUserStatusActions from '../hooks/useUserStatusActions'
import CreateUserDrawer from './CreateUserDrawer'
import EditUserRolesDrawer from './EditUserRolesDrawer'

/**
 * DataUsers component displays a data table of users with actions to edit roles, enable, or disable users.
 * It also provides a button to open a drawer for creating new users.
 */
function DataUsers() {
  const columns = useUserColumns()
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)

  const {
    isDrawerOpen,
    editingUser,
    selectedRoles,
    isSavingRoles,
    handleEditUser,
    handleCloseDrawer,
    toggleRole,
    handleSaveRoles,
  } = useUserRoleDrawer()

  const { isDisablingUser, isEnablingUser, handleDisableUser, handleEnableUser } =
    useUserStatusActions()

  const rowActions = useMemo<DataTableAction<User>[]>(
    () => [
      {
        label: 'Editar',
        onClick: (user) => handleEditUser(user),
      },
      {
        label: 'Habilitar',
        visible: (user) => !user.active,
        className: 'text-emerald-600 focus:text-emerald-700',
        onClick: (user) => handleEnableUser(user),
        disabled: () => isEnablingUser,
      },
      {
        label: 'Deshabilitar',
        variant: 'destructive',
        visible: (user) => user.active,
        disabled: () => isDisablingUser,
        onClick: (user) => handleDisableUser(user),
      },
    ],
    [handleDisableUser, handleEditUser, handleEnableUser, isDisablingUser, isEnablingUser],
  )

  return (
    <>
      <DataTable
        columns={columns}
        queryFn={useGetUsers}
        emptyMessage="No hay usuarios para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        filters={
          <Button size="sm" type="button" onClick={() => setIsCreateDrawerOpen(true)}>
            <Plus className="size-4" />
            Nuevo
          </Button>
        }
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

      <CreateUserDrawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} />
    </>
  )
}

export default DataUsers

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { getFaculties } from '@/features/faculties'
import { PageHeader } from '@/shared/ui'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import DataTable, {
  type DataTableAction,
  type DataTableCreateConfig,
} from '@/components/common/DataTable'
import type { Department } from '@/features/departments'
import {
  getDepartments,
  useAssignDepartmentDirector,
  useCreateDepartment,
  useDepartmentColumns,
  useUnassignDepartmentDirector,
  useUpdateDepartment,
} from '@/features/departments'
import AssignDirectorDrawer from './AssignDirectorDrawer'
import EditDepartmentDialog from './EditDepartmentDialog'

function useGetAllDepartments({
  page,
  limit,
  search,
}: {
  page: number
  limit: number
  search: string
}) {
  return useQuery({
    queryKey: ['departments', page, limit, search],
    queryFn: () => getDepartments({ page, limit, search }),
  })
}

export function DepartmentsContent() {
  const columns = useDepartmentColumns()
  const createMutation = useCreateDepartment()

  const { mutateAsync: updateDepartment, isPending: isSavingDepartment } = useUpdateDepartment()
  const { mutateAsync: assignDirector, isPending: isAssigningDirector } =
    useAssignDepartmentDirector()
  const { mutateAsync: unassignDirector, isPending: isUnassigningDirector } =
    useUnassignDepartmentDirector()

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties({ page: 1, limit: 50 }), // Assuming we want to fetch all faculties
  })
  const faculties = facultiesData?.data ?? []

  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    faculty_id: '',
  })

  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [directorDepartment, setDirectorDepartment] = useState<Department | null>(null)
  const [isDirectorDrawerOpen, setIsDirectorDrawerOpen] = useState(false)

  const createConfig = useMemo<DataTableCreateConfig>(
    () => ({
      label: 'Nuevo departamento',
      dialogTitle: 'Crear departamento',
      dialogDescription: 'Complete los datos del nuevo departamento.',
      renderForm: ({ close }) => (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            createMutation.mutate(
              {
                name: createForm.name,
                code: createForm.code || undefined,
                faculty_id: createForm.faculty_id ? Number(createForm.faculty_id) : undefined,
              },
              {
                onSuccess: () => {
                  toast.success('Departamento creado exitosamente')
                  setCreateForm({ name: '', code: '', faculty_id: '' })
                  close()
                },
                onError: () => {
                  toast.error('Error al crear el departamento')
                },
              },
            )
          }}
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre</Label>

              <Input
                id="create-name"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del departamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-code">Código</Label>

              <Input
                id="create-code"
                required
                value={createForm.code}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="Código"
              />
            </div>

            <div className="space-y-2">
              <Label>Facultad</Label>

              <Select
                value={createForm.faculty_id}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    faculty_id: value ?? '',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <span>
                    {createForm.faculty_id
                      ? (faculties.find((f) => f.id === Number(createForm.faculty_id))?.name ?? '')
                      : 'Sin facultad'}
                  </span>
                </SelectTrigger>

                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>

            <Button type="submit" disabled={!createForm.name.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      ),
    }),
    [createMutation, createForm, faculties],
  )

  const rowActions = useMemo<DataTableAction<Department>[]>(
    () => [
      {
        label: 'Editar',
        onClick: (department) => {
          setEditingDepartment(department)
          setIsEditDialogOpen(true)
        },
      },
      {
        label: 'Asignar director',
        onClick: (department) => {
          setDirectorDepartment(department)
          setIsDirectorDrawerOpen(true)
        },
      },
      {
        label: 'Desasignar director',
        visible: (department) => !!department.director,
        disabled: () => isUnassigningDirector,
        onClick: (department) => {
          unassignDirector({ departmentId: department.id })
        },
      },
      {
        label: 'Activar',
        visible: (department) => !department.active,
        className: 'text-emerald-600 focus:text-emerald-700',
        onClick: (department) => updateDepartment({ id: department.id, active: true }),
        disabled: () => isSavingDepartment,
      },
      {
        label: 'Desactivar',
        variant: 'destructive',
        visible: (department) => department.active,
        onClick: (department) => updateDepartment({ id: department.id, active: false }),
        disabled: () => isSavingDepartment,
      },
    ],
    [updateDepartment, isSavingDepartment, unassignDirector, isUnassigningDirector],
  )

  const handleSaveDepartment = async (data: {
    id: number
    name: string
    code?: string
    faculty_id?: number
  }) => {
    try {
      await updateDepartment(data)
      setIsEditDialogOpen(false)
      setEditingDepartment(null)
    } catch {
      // error handled by toast in mutation
    }
  }

  return (
    <>
      <PageHeader title="Departamentos" description="Gestione los departamentos académicos." />

      <DataTable
        columns={columns}
        queryFn={useGetAllDepartments}
        emptyMessage="No hay departamentos para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        searchPlaceholder="Buscar departamento..."
        createConfig={createConfig}
      />

      {editingDepartment && (
        <EditDepartmentDialog
          open={isEditDialogOpen}
          department={editingDepartment}
          isSaving={isSavingDepartment}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setEditingDepartment(null)
          }}
          onSave={handleSaveDepartment}
        />
      )}

      <AssignDirectorDrawer
        open={isDirectorDrawerOpen}
        department={directorDepartment}
        isSaving={isAssigningDirector}
        onOpenChange={(open) => {
          setIsDirectorDrawerOpen(open)
          if (!open) setDirectorDepartment(null)
        }}
        onAssign={assignDirector}
      />
    </>
  )
}

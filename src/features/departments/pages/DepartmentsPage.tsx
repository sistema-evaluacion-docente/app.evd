import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { PageTitle } from '@/components/common/PageTitle'
import { useGetFaculties } from '@/features/faculties'
import useAuth from '@/hooks/useAuth'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateDepartment } from '../api'
import { DepartmentsList, DepartmentsOverviewList } from '../components'

/**
 * Admin page displaying the full list of departments with search and filters.
 *
 * @example
 * <Route path="/admin/departments" component={DepartmentsPage} />
 */
export function DepartmentsPage() {
  const { selectedRole } = useAuth()
  const canManage = selectedRole === 'ADMIN'
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const createDepartment = useCreateDepartment()

  // Fetch faculties for the dropdown
  const { data: facultiesData } = useGetFaculties({ limit: 100 })
  const faculties = facultiesData?.data ?? []

  const departmentFields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Nombre del departamento',
      required: true,
      placeholder: 'Ej: Departamento de Sistemas',
    },
    {
      name: 'code',
      label: 'Código',
      required: true,
      placeholder: 'Ej: 52',
    },
    {
      name: 'faculty_id',
      label: 'Facultad',
      type: 'select',
      required: true,
      options: faculties.map((f) => ({ label: f.name, value: String(f.id) })),
    },
  ]

  const handleSubmit = (values: Record<string, string>) => {
    createDepartment.mutate(
      {
        name: values.name,
        code: values.code,
        faculty_id: Number(values.faculty_id),
      },
      {
        onSuccess: () => {
          toast.success('Departamento creado exitosamente')
          setCreateDrawerOpen(false)
        },
      },
    )
  }

  return (
    <>
      <PageTitle
        action={
          canManage ? (
            <DynamicFormDrawer
              title="Crear departamento"
              description="Ingresa los datos del nuevo departamento"
              triggerLabel="Crear departamento"
              triggerIcon={Plus}
              triggerVariant="default"
              fields={departmentFields}
              onSubmit={handleSubmit}
              isSubmitting={createDepartment.isPending}
              submitLabel="Crear"
              submitSubmittingLabel="Creando..."
              open={createDrawerOpen}
              onOpenChange={setCreateDrawerOpen}
            />
          ) : undefined
        }
      >
        Departamentos
      </PageTitle>

      {canManage ? <DepartmentsList /> : <DepartmentsOverviewList />}
    </>
  )
}

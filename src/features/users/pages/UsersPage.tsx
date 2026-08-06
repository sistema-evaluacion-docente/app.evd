import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { PageTitle } from '@/components/common/PageTitle'
import { useGetDepartments } from '@/features/departments'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateUser } from '../api'
import { UsersList } from '../components'
import { CONTRACT_TYPES, ROLE_OPTIONS } from '../config'

/**
 * Admin page displaying the full list of users with a form to create a new one.
 *
 * @example
 * <Route path="/admin/usuarios" component={UsersPage} />
 */
export default function UsersPage() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const createUser = useCreateUser()

  const { data: departmentsData } = useGetDepartments({ limit: 100, active: true })
  const departments = departmentsData?.data ?? []

  const userFields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Nombre completo',
      required: true,
      placeholder: 'Ej: Juan Pérez García',
    },
    {
      name: 'email',
      label: 'Correo institucional',
      type: 'email',
      required: true,
      placeholder: 'usuario@ufps.edu.co',
    },
    {
      name: 'institutional_code',
      label: 'Código institucional',
      required: true,
      placeholder: 'Ej: 115',
    },
    {
      name: 'contract_type',
      label: 'Tipo de contrato',
      type: 'select',
      required: true,
      options: CONTRACT_TYPES,
    },
    {
      name: 'department_id',
      label: 'Departamento',
      type: 'select',
      required: true,
      options: departments.map((department) => ({
        label: department.name,
        value: String(department.id),
      })),
    },
    {
      name: 'roles',
      label: 'Roles',
      type: 'multiSelect',
      required: true,
      options: ROLE_OPTIONS,
    },
    {
      name: 'active',
      label: 'Activo',
      type: 'boolean',
      defaultValue: 'true',
    },
  ]

  const handleSubmit = (values: Record<string, string>) => {
    const roles = values.roles.split(',').filter(Boolean)
    const email = values.email.trim().toLowerCase()

    if (roles.length === 0) {
      toast.error('Debe seleccionar al menos un rol')
      return
    }

    if (!email.endsWith('@ufps.edu.co')) {
      toast.error('El correo debe terminar en @ufps.edu.co')
      return
    }

    createUser.mutate(
      {
        name: values.name,
        email,
        uid: values.uid,
        institutional_code: values.institutional_code,
        contract_type: values.contract_type,
        department_id: Number(values.department_id),
        roles,
        avatar_url: values.avatar_url,
        active: values.active === 'true',
      },
      {
        onSuccess: () => {
          toast.success('Usuario creado exitosamente')
          setCreateDrawerOpen(false)
        },
      },
    )
  }

  return (
    <>
      <PageTitle
        action={
          <DynamicFormDrawer
            title="Crear usuario"
            description="Ingresa los datos del nuevo usuario"
            triggerLabel="Crear usuario"
            triggerIcon={Plus}
            triggerVariant="default"
            fields={userFields}
            onSubmit={handleSubmit}
            isSubmitting={createUser.isPending}
            submitLabel="Crear"
            submitSubmittingLabel="Creando..."
            open={createDrawerOpen}
            onOpenChange={setCreateDrawerOpen}
          />
        }
      >
        Usuarios
      </PageTitle>

      <UsersList />
    </>
  )
}

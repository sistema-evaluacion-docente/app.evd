import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { PageTitle } from '@/components/common/PageTitle'
import { useAuthStore } from '@/features/auth'
import { useNavigate } from '@/hooks/useNavigate'
import { CloudUpload, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateTeacherWithUser } from '../api'
import { TeachersList } from '../components'

const CONTRACT_TYPES = [
  { label: 'Tiempo completo', value: 'Tiempo completo' },
  { label: 'Medio tiempo', value: 'Medio tiempo' },
  { label: 'Hora cátedra', value: 'Hora cátedra' },
  { label: 'Planta', value: 'Planta' },
]

const teacherFields: FieldConfig[] = [
  { name: 'name', label: 'Nombre completo', required: true, placeholder: 'Ej: Juan Pérez García' },
  {
    name: 'email',
    label: 'Correo institucional',
    type: 'email',
    required: true,
    placeholder: 'docente@universidad.edu',
  },
  {
    name: 'institutional_code',
    label: 'Código institucional',
    required: true,
    placeholder: 'Ej: DOC-001',
  },
  {
    name: 'contract_type',
    label: 'Tipo de contrato',
    type: 'select',
    required: true,
    options: CONTRACT_TYPES,
  },
]

/**
 * Full page listing the teachers of the authenticated director's department.
 */
export default function TeachersPage() {
  const nagivate = useNavigate()

  const departmentId = useAuthStore((state) => state.user?.department_id)
  const createTeacher = useCreateTeacherWithUser()

  const handleSubmit = (values: Record<string, string>) => {
    if (!departmentId) {
      toast.error('No se pudo obtener el departamento del usuario')
      return
    }

    createTeacher.mutate(
      {
        name: values.name,
        email: values.email,
        institutional_code: values.institutional_code,
        contract_type: values.contract_type,
        department_id: departmentId,
        active: true,
      },
      {
        onSuccess: () => {
          toast.success('Docente creado exitosamente')
        },
        onError: (error) => {
          toast.error(error.message || 'Error al crear el docente')
        },
      },
    )
  }

  return (
    <>
      <PageTitle
        action={
          <DynamicFormDrawer
            title="Crear docente"
            description="Ingresa los datos del nuevo docente"
            triggerLabel="Crear docente"
            triggerIcon={Plus}
            triggerVariant="default"
            fields={teacherFields}
            onSubmit={handleSubmit}
            isSubmitting={createTeacher.isPending}
            submitLabel="Crear"
            submitSubmittingLabel="Creando..."
          />
        }
        secondaryActionLabel="Subir docentes"
        secondaryActionIcon={CloudUpload}
        onSecondaryAction={() => nagivate('/docentes/cargar')}
      >
        Docentes
      </PageTitle>

      <TeachersList />
    </>
  )
}

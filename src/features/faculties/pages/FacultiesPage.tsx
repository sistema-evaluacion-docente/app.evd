import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { PageTitle } from '@/components/common/PageTitle'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateFaculty } from '../api'
import { FacultiesList } from '../components'

const facultyFields: FieldConfig[] = [
  {
    name: 'name',
    label: 'Nombre de la facultad',
    required: true,
    placeholder: 'Ej: Facultad de Ingeniería',
  },
  {
    name: 'code',
    label: 'Código',
    required: true,
    placeholder: 'Ej: ING',
  },
]

/**
 * Admin page displaying the full list of faculties with search and filters.
 *
 * @example
 * <Route path="/admin/faculties" component={FacultiesPage} />
 */
export function FacultiesPage() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const createFaculty = useCreateFaculty()

  const handleSubmit = (values: Record<string, string>) => {
    createFaculty.mutate(
      {
        name: values.name,
        code: values.code,
      },
      {
        onSuccess: () => {
          toast.success('Facultad creada exitosamente')
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
            title="Crear facultad"
            description="Ingresa los datos de la nueva facultad"
            triggerLabel="Crear facultad"
            triggerIcon={Plus}
            triggerVariant="default"
            fields={facultyFields}
            onSubmit={handleSubmit}
            isSubmitting={createFaculty.isPending}
            submitLabel="Crear"
            submitSubmittingLabel="Creando..."
            open={createDrawerOpen}
            onOpenChange={setCreateDrawerOpen}
          />
        }
      >
        Facultades
      </PageTitle>

      <FacultiesList />
    </>
  )
}

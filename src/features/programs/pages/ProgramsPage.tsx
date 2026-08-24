import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { PageTitle } from '@/components/common/PageTitle'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateProgram } from '../api'
import { ProgramsList } from '../components'

const programFields: FieldConfig[] = [
  {
    name: 'name',
    label: 'Nombre del programa',
    required: true,
    placeholder: 'Ej: Ingeniería de Sistemas',
  },
  {
    name: 'code',
    label: 'Código',
    required: true,
    placeholder: 'Ej: IS',
  },
]

/**
 * Page displaying the full list of academic programs with search and filters.
 *
 * @example
 * <Route path="/programas" component={ProgramsPage} />
 */
export function ProgramsPage() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const createProgram = useCreateProgram()

  const handleSubmit = (values: Record<string, string>) => {
    createProgram.mutate(
      {
        name: values.name,
        code: values.code,
      },
      {
        onSuccess: () => {
          toast.success('Programa creado exitosamente')
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
            title="Crear programa"
            description="Ingresa los datos del nuevo programa académico"
            triggerLabel="Crear programa"
            triggerIcon={Plus}
            triggerVariant="default"
            fields={programFields}
            onSubmit={handleSubmit}
            isSubmitting={createProgram.isPending}
            submitLabel="Crear"
            submitSubmittingLabel="Creando..."
            open={createDrawerOpen}
            onOpenChange={setCreateDrawerOpen}
          />
        }
      >
        Programas académicos
      </PageTitle>

      <ProgramsList />
    </>
  )
}

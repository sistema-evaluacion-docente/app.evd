import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { PageTitle } from '@/components/common/PageTitle'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateAcademicPeriod } from '../api'
import { PeriodsList } from '../components/admin'

const periodFields: FieldConfig[] = [
  {
    name: 'name',
    label: 'Nombre del periodo',
    required: true,
    placeholder: 'Ej: 2024-1',
  },
  {
    name: 'start_date',
    label: 'Fecha de inicio',
    required: false,
    placeholder: 'YYYY-MM-DD',
  },
  {
    name: 'end_date',
    label: 'Fecha de fin',
    required: false,
    placeholder: 'YYYY-MM-DD',
  },
]

/**
 * Admin page displaying the full list of academic periods with search and filters.
 *
 * @example
 * <Route path="/admin/periods" component={AdminPeriodsPage} />
 */
export function AdminPeriodsPage() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const createPeriod = useCreateAcademicPeriod()

  const handleSubmit = (values: Record<string, string>) => {
    createPeriod.mutate(
      {
        name: values.name,
        start_date: values.start_date,
        end_date: values.end_date,
      },
      {
        onSuccess: () => {
          toast.success('Periodo académico creado exitosamente')
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
            title="Crear periodo académico"
            description="Ingresa los datos del nuevo periodo académico"
            triggerLabel="Crear periodo"
            triggerIcon={Plus}
            triggerVariant="default"
            fields={periodFields}
            onSubmit={handleSubmit}
            isSubmitting={createPeriod.isPending}
            submitLabel="Crear"
            submitSubmittingLabel="Creando..."
            open={createDrawerOpen}
            onOpenChange={setCreateDrawerOpen}
          />
        }
      >
        Periodos Académicos
      </PageTitle>

      <PeriodsList />
    </>
  )
}

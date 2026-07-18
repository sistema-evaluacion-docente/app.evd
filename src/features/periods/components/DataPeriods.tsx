import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import DataTable, {
  type DataTableAction,
  type DataTableCreateConfig,
} from '@/components/common/DataTable'
import useCreatePeriod from '../hooks/useCreatePeriod'
import useGetPeriods from '../hooks/useGetPeriods'
import usePeriodColumns from '../hooks/usePeriodColumns'
import usePeriodStatusActions from '../hooks/usePeriodStatusActions'
import useUpdatePeriod from '../hooks/useUpdatePeriod'
import type { Period } from '../types/Period'
import EditPeriodDialog from './EditPeriodDialog'

const PERIOD_NAME_PATTERN = /^\d{4}-[12]$/

/**
 * Component that displays a list of academic periods in a data table.
 *
 * It provides functionality to create, edit, activate, and deactivate periods.
 * The component uses custom hooks to fetch data, manage state, and handle actions.
 *
 * @returns {JSX.Element} The rendered DataPeriods component.
 */
function DataPeriods() {
  const columns = usePeriodColumns()
  const { mutateAsync: updatePeriod, isPending: isSavingPeriod } = useUpdatePeriod()

  const createPeriodMutation = useCreatePeriod()

  const [createForm, setCreateForm] = useState({
    name: '',
  })
  const [createTouched, setCreateTouched] = useState(false)

  const isCreateNameValid = PERIOD_NAME_PATTERN.test(createForm.name)
  const showCreateError = createTouched && createForm.name.length > 0 && !isCreateNameValid

  const createConfig = useMemo<DataTableCreateConfig>(
    () => ({
      label: 'Nuevo periodo',
      dialogTitle: 'Crear periodo académico',
      dialogDescription: 'Complete los datos del nuevo periodo académico.',
      renderForm: ({ close }) => (
        <form
          onSubmit={(event) => {
            event.preventDefault()

            createPeriodMutation.mutate(
              {
                name: createForm.name,
              },
              {
                onSuccess: () => {
                  toast.success('Periodo creado exitosamente')

                  setCreateForm({
                    name: '',
                  })
                  setCreateTouched(false)

                  close()
                },
                onError: () => {
                  toast.error('Error al crear el periodo')
                },
              },
            )
          }}
        >
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre</Label>

              <Input
                id="create-name"
                className="text-sm"
                placeholder="2024-1"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => setCreateTouched(true)}
                aria-invalid={showCreateError}
              />

              {showCreateError ? (
                <p className="text-destructive text-xs">
                  Formato inválido. Debe ser AÑO-1 o AÑO-2 (ej: "2024-1" o "2024-2").
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Debe ser un nombre único para el periodo académico, por ejemplo: "2024-1" o
                  "2024-2".
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>

            <Button type="submit" disabled={createPeriodMutation.isPending || !isCreateNameValid}>
              <Save />
              {createPeriodMutation.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      ),
    }),
    [createPeriodMutation, createForm, isCreateNameValid, showCreateError],
  )

  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { isTogglingStatus, handleDeactivatePeriod, handleActivatePeriod } =
    usePeriodStatusActions()

  const rowActions = useMemo<DataTableAction<Period>[]>(
    () => [
      {
        label: 'Editar',
        onClick: (period) => {
          setEditingPeriod(period)
          setIsDialogOpen(true)
        },
      },
      {
        label: 'Activar',
        visible: (period) => !period.active,
        className: 'text-emerald-600 focus:text-emerald-700',
        onClick: (period) => handleActivatePeriod(period),
        disabled: () => isTogglingStatus,
      },
      {
        label: 'Desactivar',
        variant: 'destructive',
        visible: (period) => period.active,
        onClick: (period) => handleDeactivatePeriod(period),
        disabled: () => isTogglingStatus,
      },
    ],
    [handleActivatePeriod, handleDeactivatePeriod, isTogglingStatus],
  )

  const handleSavePeriod = async (data: {
    id: string
    name: string
    start_date: string
    end_date: string
    evaluation_end_date: string
    final_evaluation_date: string
  }) => {
    try {
      await updatePeriod({
        id: data.id,
        codigo: '',
        nombre: data.name,
        start: data.start_date,
        end: data.end_date,
        evalStart: data.evaluation_end_date,
        evalEnd: data.final_evaluation_date,
      })
      setIsDialogOpen(false)
      setEditingPeriod(null)
    } catch (error) {
      console.error('Failed to update period:', error)
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        queryFn={useGetPeriods}
        emptyMessage="No hay periodos académicos para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        searchPlaceholder="Buscar periodo..."
        createConfig={createConfig}
      />

      <EditPeriodDialog
        open={isDialogOpen}
        period={editingPeriod}
        isSaving={isSavingPeriod}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingPeriod(null)
        }}
        onSave={handleSavePeriod}
      />
    </>
  )
}

export default DataPeriods

import type { PaginationState, SortingState } from '@tanstack/react-table'
import { History, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { useDeleteSetting, useGetSettings, useUpdateSetting } from '../api'
import type { Setting } from '../types'
import { SettingHistoryDialog } from './SettingHistoryDialog'
import { settingsColumns } from './settingsColumns'

/**
 * Displays the paginated list of system settings with server-side search,
 * powered by the shared `DataTable`.
 *
 * @example
 * <SettingsList />
 */
export function SettingsList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [editTarget, setEditTarget] = useState<Setting | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Setting | null>(null)
  const [historyTarget, setHistoryTarget] = useState<Setting | null>(null)

  const { data, isPending, isFetching } = useGetSettings({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch,
  })
  const { mutate: updateSetting, isPending: isUpdating } = useUpdateSetting()
  const { mutate: deleteSetting, isPending: isDeleting } = useDeleteSetting()

  const settings = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const editFields: FieldConfig[] = editTarget
    ? [
        {
          name: 'value',
          label: 'Valor',
          type: 'textarea',
          required: true,
          defaultValue: editTarget.value,
        },
        {
          name: 'change_reason',
          label: 'Motivo del cambio',
          type: 'textarea',
          required: true,
          placeholder: 'Explica por qué cambias este valor',
        },
      ]
    : []

  const handleUpdateSubmit = (values: Record<string, string>) => {
    if (!editTarget) return

    updateSetting(
      {
        settingId: editTarget.id,
        payload: {
          value: values.value,
          change_reason: values.change_reason,
        },
      },
      {
        onSuccess: () => {
          toast.success('Configuración actualizada exitosamente')
          setEditTarget(null)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    deleteSetting(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Configuración eliminada exitosamente')
        setDeleteTarget(null)
      },
    })
  }

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const rowActions: DataTableAction<Setting>[] = [
    {
      label: 'Historial',
      icon: <History className="size-4" />,
      onClick: (row) => setHistoryTarget(row),
    },
    {
      label: 'Editar',
      icon: <Pencil className="size-4" />,
      onClick: (row) => setEditTarget(row),
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="size-4" />,
      onClick: (row) => setDeleteTarget(row),
      variant: 'destructive',
    },
  ]

  return (
    <>
      <DataTable
        columns={settingsColumns}
        data={settings}
        pageCount={pageCount}
        isLoading={isPending}
        isFetching={isFetching}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          resetPage()
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        searchPlaceholder="Buscar por clave o descripción..."
        emptyMessage="No hay configuraciones que coincidan."
        rowActions={rowActions}
      />

      <SettingHistoryDialog
        key={historyTarget?.id ?? 'none'}
        settingId={historyTarget?.id ?? null}
        settingKey={historyTarget?.key ?? ''}
        open={historyTarget !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryTarget(null)
        }}
      />

      {editTarget && (
        <DynamicFormDrawer
          key={editTarget.id}
          title={`Editar configuración: ${editTarget.key}`}
          description="Actualiza el valor y registra el motivo del cambio"
          hideTrigger
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null)
          }}
          fields={editFields}
          onSubmit={handleUpdateSubmit}
          isSubmitting={isUpdating}
          submitLabel="Guardar"
          submitSubmittingLabel="Guardando..."
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar configuración"
        description={
          deleteTarget ? (
            <>
              ¿Estás seguro de que deseas eliminar la configuración{' '}
              <strong>{deleteTarget.key}</strong>?
              <br />
              Esta acción no se puede deshacer.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        pendingLabel="Eliminando..."
        isPending={isDeleting}
        confirmIcon={<Trash2 />}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}

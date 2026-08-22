import type { PaginationState, SortingState } from '@tanstack/react-table'
import { History, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { isDepartmentOwnedSetting, SettingHistoryDialog, useDeleteSetting } from '@/features/admin'
import { useGetPlanIndicators } from '@/features/plans'
import { ApiError } from '@/lib/apiError'
import { useGetSuggestedActions, useSaveSuggestedActions } from '../api'
import { newSuggestedActionId, SUGGESTED_ACTIONS_KEY } from '../lib/suggestedActions'
import type { SuggestedAction } from '../types'
import { suggestedActionsColumns } from './suggestedActionsColumns'
import { SuggestedActionsScopeNotice } from './SuggestedActionsScopeNotice'

/** Keeps a change reason readable in the history dialog, which truncates hard. */
function excerpt(text: string, max = 60): string {
  const trimmed = text.trim()

  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

/**
 * The department's default improvement actions: a table over the JSON array
 * stored in the `improvement_plan.suggested_actions` setting, with a drawer to
 * add or edit one and a confirm dialog to remove one.
 *
 * Every one of those edits rewrites the whole array, since the list lives in a
 * single settings row — so searching and paging are done here over the array
 * in memory rather than by the server.
 *
 * @example
 * <SuggestedActionsList />
 */
export function SuggestedActionsList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [editTarget, setEditTarget] = useState<SuggestedAction | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SuggestedAction | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)

  const { actions, setting, departmentId, isPending, isFetching, error } = useGetSuggestedActions()
  const { data: indicators, isPending: isLoadingAspects } = useGetPlanIndicators()
  const { mutate: save, isPending: isSaving } = useSaveSuggestedActions()
  const { mutate: deleteSetting, isPending: isResetting } = useDeleteSetting()

  const aspects = useMemo(() => indicators?.data?.aspects ?? [], [indicators])

  const columns = useMemo(() => suggestedActionsColumns(aspects), [aspects])

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()

    if (!term) return actions

    return actions.filter((action) => action.action.toLowerCase().includes(term))
  }, [actions, debouncedSearch])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)
  const rows = filtered.slice(
    pageIndex * pagination.pageSize,
    (pageIndex + 1) * pagination.pageSize,
  )

  /** Writes the list back and reports the outcome; `reason` feeds the history. */
  const persist = (next: SuggestedAction[], reason: string, onDone: () => void) => {
    save(
      { actions: next, baseSetting: setting, changeReason: reason },
      {
        onSuccess: () => {
          toast.success('Acciones sugeridas actualizadas')
          onDone()
        },
        onError: (mutationError) => {
          // A conflict is raised here rather than by the API, so the shared
          // axios interceptor never gets to toast it.
          if (mutationError instanceof ApiError && !mutationError.status) {
            toast.error(mutationError.message)
          }
        },
      },
    )
  }

  const formFields = (target: SuggestedAction | null): FieldConfig[] => [
    {
      name: 'aspect',
      label: 'Aspecto del formato',
      type: 'select',
      required: true,
      defaultValue: String(target?.aspect ?? aspects[0]?.aspect ?? ''),
      options: aspects.map((aspect) => ({
        label: `${aspect.aspect}. ${aspect.label}`,
        value: String(aspect.aspect),
      })),
    },
    {
      name: 'action',
      label: 'Acción',
      type: 'textarea',
      required: true,
      placeholder: 'Qué se compromete a hacer el docente',
      defaultValue: target?.action ?? '',
    },
  ]

  const handleSubmit = (values: Record<string, string>) => {
    const aspect = Number(values.aspect)

    const draft: SuggestedAction = {
      id: editTarget?.id ?? newSuggestedActionId(),
      aspect: Number.isFinite(aspect) ? aspect : 0,
      action: values.action.trim(),
    }

    if (!draft.action) {
      toast.error('La acción no puede quedar vacía')
      return
    }

    const next = editTarget
      ? actions.map((item) => (item.id === editTarget.id ? draft : item))
      : [...actions, draft]

    const reason = editTarget
      ? `Se editó la acción sugerida «${excerpt(draft.action)}»`
      : `Se agregó la acción sugerida «${excerpt(draft.action)}»`

    persist(next, reason, () => {
      setEditTarget(null)
      setIsCreating(false)
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    persist(
      actions.filter((item) => item.id !== deleteTarget.id),
      `Se eliminó la acción sugerida «${excerpt(deleteTarget.action)}»`,
      () => setDeleteTarget(null),
    )
  }

  const handleReset = () => {
    if (!setting) return

    deleteSetting(setting.id, {
      onSuccess: () => {
        toast.success('Se restauraron las acciones institucionales')
        setIsResetOpen(false)
      },
    })
  }

  // Without a department there is no scope to write to, and the backend would
  // file the list as institutional instead of rejecting it — so this is caught
  // here rather than left to fail on save.
  if (departmentId == null) {
    return (
      <Alert variant="destructive">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>No se pudo abrir la configuración</AlertTitle>

        <AlertDescription>
          Tu cuenta no tiene un departamento asignado, y estas acciones se definen para un
          departamento. Pide que te asignen uno para poder configurarlas.
        </AlertDescription>
      </Alert>
    )
  }

  if (error) {
    const message =
      error instanceof ApiError && error.status === 403
        ? 'No tienes permiso para ver la configuración de este departamento.'
        : 'No se pudieron cargar las acciones sugeridas. Intenta de nuevo más tarde.'

    return (
      <Alert variant="destructive">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>No se pudo abrir la configuración</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    )
  }

  const openDrawer = editTarget !== null || isCreating

  const rowActions: DataTableAction<SuggestedAction>[] = [
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
      {!isPending && (
        <SuggestedActionsScopeNotice
          setting={setting}
          onReset={() => setIsResetOpen(true)}
          isResetting={isResetting}
        />
      )}

      <DataTable
        columns={columns}
        data={rows}
        pageCount={pageCount}
        isLoading={isPending || isLoadingAspects}
        isFetching={isFetching || isSaving}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={{ ...pagination, pageIndex }}
        onPaginationChange={setPagination}
        searchPlaceholder="Buscar por acción..."
        toolbarActions={
          <>
            {setting && isDepartmentOwnedSetting(setting) && (
              <Button type="button" variant="outline" onClick={() => setIsHistoryOpen(true)}>
                <History aria-hidden="true" className="size-4" />
                Historial
              </Button>
            )}

            <Button
              type="button"
              onClick={() => setIsCreating(true)}
              disabled={isPending || isLoadingAspects}
            >
              <Plus aria-hidden="true" className="size-4" />
              Nueva acción
            </Button>
          </>
        }
        emptyMessage={
          debouncedSearch
            ? 'Ninguna acción coincide con la búsqueda.'
            : 'Aún no hay acciones sugeridas. Agrega la primera.'
        }
        rowActions={rowActions}
      />

      {openDrawer && (
        <DynamicFormDrawer
          key={editTarget?.id ?? 'new'}
          title={editTarget ? 'Editar acción sugerida' : 'Nueva acción sugerida'}
          description="Aparecerá como sugerencia al redactar los planes de mejoramiento del departamento."
          hideTrigger
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditTarget(null)
              setIsCreating(false)
            }
          }}
          fields={formFields(editTarget)}
          onSubmit={handleSubmit}
          isSubmitting={isSaving}
          submitLabel="Guardar"
          submitSubmittingLabel="Guardando..."
        />
      )}

      <SettingHistoryDialog
        key={setting?.id ?? 'none'}
        settingId={isHistoryOpen ? (setting?.id ?? null) : null}
        settingKey={SUGGESTED_ACTIONS_KEY}
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar acción sugerida"
        description={
          deleteTarget ? (
            <>
              ¿Eliminar la acción <strong>«{excerpt(deleteTarget.action, 90)}»</strong> de la lista
              del departamento?
              <br />
              Los planes ya redactados no cambian.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        pendingLabel="Eliminando..."
        isPending={isSaving}
        confirmIcon={<Trash2 />}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={isResetOpen}
        title="Volver a las acciones institucionales"
        description={
          <>
            Se eliminará la lista propia de tu departamento y volverán a aplicar las acciones
            institucionales.
            <br />
            Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Restaurar"
        pendingLabel="Restaurando..."
        isPending={isResetting}
        confirmIcon={<Trash2 />}
        onOpenChange={setIsResetOpen}
        onConfirm={handleReset}
      />
    </>
  )
}

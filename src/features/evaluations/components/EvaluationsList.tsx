import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Eye, Power, PowerOff, Sparkles, Trash, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useLocation } from 'wouter'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import {
  evaluationsKeys,
  useAnalyzeEvaluation,
  useDeleteEvaluation,
  useGetEvaluations,
  useUpdateEvaluationStatus,
} from '../api'
import { useEvaluationLogs } from '../hooks'
import type { EvaluationRecord } from '../types'
import { evaluationColumns } from './columns'

/**
 * Displays the paginated list of evaluations of the authenticated director's
 * department with server-side search, filters (period, active, sort by
 * average), and row actions (detail, toggle active, delete).
 *
 * @example
 * <EvaluationsList />
 */
export function EvaluationsList() {
  const [, navigate] = useLocation()
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [deleteTarget, setDeleteTarget] = useState<EvaluationRecord | null>(null)

  const sortBy =
    sorting.length > 0 ? `${sorting[0].id}_${sorting[0].desc ? 'desc' : 'asc'}` : undefined

  const { data, isPending, isFetching } = useGetEvaluations({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch,
    sort_by: sortBy,
  })

  const evaluations = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const { mutate: toggleStatus, isPending: isTogglingStatus } = useUpdateEvaluationStatus()
  const { mutate: removeEvaluation, isPending: isDeleting } = useDeleteEvaluation()
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeEvaluation()
  const { connect: connectLogs } = useEvaluationLogs()

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }))

  const rowActions: DataTableAction<EvaluationRecord>[] = [
    {
      label: 'Ver Detalle',
      icon: <Eye className="size-4" />,
      onClick: (row) => {
        navigate(`/evaluaciones/${row.id}`)
      },
    },
    {
      label: 'Activar',
      icon: <Power className="size-4" />,
      className: 'text-emerald-600 focus:text-emerald-700',
      visible: (row) => !row.active,
      onClick: (row) => toggleStatus({ evaluationId: row.id, active: true }),
      disabled: () => isTogglingStatus,
    },
    {
      label: 'Desactivar',
      icon: <PowerOff className="size-4" />,
      variant: 'destructive',
      visible: (row) => row.active,
      onClick: (row) => toggleStatus({ evaluationId: row.id, active: false }),
      disabled: () => isTogglingStatus,
    },
    {
      label: 'Analizar con IA',
      icon: <Sparkles className="size-4" />,
      onClick: (row) => {
        connectLogs({
          evaluationId: row.id,
          queryKeysToInvalidate: [evaluationsKeys.lists()],
          detailsUrl: `/evaluaciones/${row.id}`,
        })
        analyze(row.id)
      },
      disabled: (row) => isAnalyzing || row.status !== 'COMPLETED',
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="size-4" />,
      variant: 'destructive',
      onClick: (row) => setDeleteTarget(row),
      disabled: (row) => isAnalyzing || row.status === 'PROCESSING',
    },
  ]

  return (
    <>
      <DataTable
        columns={evaluationColumns}
        data={evaluations}
        pageCount={pageCount}
        isLoading={isPending}
        isFetching={isFetching}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          resetPage()
        }}
        onRowClick={(row) => {
          navigate(`/evaluaciones/${row.id}`)
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        searchPlaceholder="Buscar evaluación..."
        emptyMessage="No hay evaluaciones para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        isRowDisabled={(row) => !row.active}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar evaluación"
        description="Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a esta evaluación."
        isPending={isDeleting}
        confirmIcon={<Trash />}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (deleteTarget) {
            removeEvaluation(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })
          }
        }}
      />
    </>
  )
}

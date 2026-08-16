import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Eye, FileText, Power, PowerOff, Sparkles, Trash, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { useAuthStore } from '@/features/auth'
import { useNavigate } from '@/hooks/useNavigate'
import { useTableFilters } from '@/hooks/useTableFilters'
import {
  evaluationsKeys,
  useAnalyzeEvaluation,
  useDeleteEvaluation,
  useGetEvaluations,
  useUpdateEvaluationStatus,
} from '../api'
import { AI_STATUS_OPTIONS, EVALUATION_STATUS_OPTIONS } from '../config'
import { useEvaluationLogs } from '../hooks'
import type { EvaluationRecord } from '../types'
import { evaluationColumns } from './columns'

const filterConfig: FilterConfig[] = [
  {
    type: 'select',
    name: 'status',
    label: 'Estado',
    options: EVALUATION_STATUS_OPTIONS,
    clearable: true,
  },
  {
    type: 'select',
    name: 'aiStatus',
    label: 'Análisis IA',
    options: AI_STATUS_OPTIONS,
    clearable: true,
  },
  {
    type: 'boolean',
    name: 'active',
    label: 'Activo',
    trueLabel: 'Sí',
    falseLabel: 'No',
  },
  {
    type: 'sort',
    name: 'sortBy',
    fields: [
      { value: 'average', label: 'Promedio' },
      { value: 'period_name', label: 'Periodo' },
    ],
    clearable: true,
  },
]

/**
 * Displays the paginated list of evaluations of the authenticated director's
 * department with server-side search, filters (status, AI status, active, sort
 * by average), and row actions (detail, toggle active, delete).
 *
 * @example
 * <EvaluationsList />
 */
export function EvaluationsList() {
  const navigate = useNavigate()
  const departmentId = useAuthStore((state) => state.user?.department_id)

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [deleteTarget, setDeleteTarget] = useState<EvaluationRecord | null>(null)

  const { filters, setFilters } = useTableFilters('evaluations', {
    status: undefined as string | undefined,
    aiStatus: undefined as string | undefined,
    active: undefined as boolean | undefined,
    sortBy: 'period_name_desc',
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data, isPending, isFetching } = useGetEvaluations({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch,
    status: debouncedFilters.status as string | undefined,
    ai_status: debouncedFilters.aiStatus as string | undefined,
    active: debouncedFilters.active as boolean | undefined,
    sort_by: (debouncedFilters.sortBy as string | undefined) || undefined,
  })

  const evaluations = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const { mutate: toggleStatus, isPending: isTogglingStatus } = useUpdateEvaluationStatus()
  const { mutate: removeEvaluation, isPending: isDeleting } = useDeleteEvaluation()
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeEvaluation()
  const { connect: connectLogs } = useEvaluationLogs()

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  if (!departmentId) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        Su usuario no está vinculado a un departamento. Contacte al administrador del sistema.
      </div>
    )
  }

  const rowActions: DataTableAction<EvaluationRecord>[] = [
    {
      label: 'Ver Detalle',
      icon: <Eye className="size-4" />,
      onClick: (row) => {
        navigate(`/evaluaciones/${row.id}`)
      },
    },
    {
      label: 'Ver PDF',
      icon: <FileText className="size-4" />,
      onClick: (row) => {
        navigate(`/evaluaciones/${row.id}/pdf`)
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
      disabled: (row) => isAnalyzing || row.status !== 'COMPLETED' || row.ai_status === 'ANALYZING',
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="size-4" />,
      variant: 'destructive',
      onClick: (row) => setDeleteTarget(row),
      disabled: (row) =>
        isAnalyzing || row.status === 'PROCESSING' || row.ai_status === 'ANALYZING',
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
        toolbar={
          <DataTableFilters
            filters={filterConfig}
            values={filters}
            onChange={handleFiltersChange}
          />
        }
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

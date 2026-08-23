import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { ClipboardCheck } from 'lucide-react'

import { DataTable } from '@/components/common/DataTable'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import formatDate from '@/lib/formatDate'
import { useGetMyPlans } from '../api'
import { ActaStatusBadge, PlanStatusBadge } from '../components/PlanStatusBadge'
import { PLAN_STATUS_LABEL, planProgress } from '../lib/planStatus'
import type { Plan, PlanStatus } from '../types'

const PAGE_SIZE = 10

/** `''` es "todos": el valor que el select deja cuando no hay filtro. */
type StatusFilter = PlanStatus | ''

/**
 * History of the teacher's own improvement plans — the director's follow-up
 * table, narrowed to what is theirs and without the "Docente" column, which
 * would say the same name on every row.
 *
 * `GET /improvement-plans/my` answers with the whole list and no pagination,
 * so the search, the filters and the paging are resolved here rather than on
 * the API. Los dos filtros son los mismos que tiene el director en `/planes`
 * (periodo y estado); los periodos salen de los propios planes y no de
 * `useGetPlanPeriods`, que devuelve los del departamento y no los del docente.
 *
 * Route: `/mis-planes`
 */
export default function MyPlansPage() {
  const [, navigate] = useLocation()
  const { data, isPending, isFetching } = useGetMyPlans()

  const [search, setSearch] = useState('')
  const [periodCode, setPeriodCode] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE })

  const plans = useMemo(() => data?.data ?? [], [data])

  /** Los periodos que este docente tiene de verdad, del más reciente al más viejo. */
  const periodCodes = useMemo(
    () =>
      [...new Set(plans.map((plan) => plan.origin_period_code).filter(Boolean))].sort((a, b) =>
        String(b).localeCompare(String(a)),
      ) as string[],
    [plans],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return plans.filter((plan) => {
      if (periodCode && plan.origin_period_code !== periodCode) return false
      if (status && plan.status !== status) return false
      if (query.length === 0) return true

      return Boolean(
        plan.title?.toLowerCase().includes(query) ||
        plan.origin_period_code?.toLowerCase().includes(query),
      )
    })
  }, [plans, search, periodCode, status])

  /** Cualquier filtro estrecha la lista, y la página que se miraba puede sobrar. */
  const resetPage = () => setPagination((current) => ({ ...current, pageIndex: 0 }))

  const page = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize

    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pagination])

  const columns = useMemo<ColumnDef<Plan>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Plan',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.original.title}</p>
            {row.original.acta_date && (
              <p className="text-muted-foreground truncate text-xs">
                Acta del {formatDate(row.original.acta_date, 'D [de] MMMM [de] YYYY')}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'origin_period_code',
        header: 'Periodo',
        cell: ({ row }) => <span className="num text-sm">{row.original.origin_period_code}</span>,
      },
      {
        accessorKey: 'progress',
        header: 'Avance',
        cell: ({ row }) => (
          <ScoreProgress
            value={planProgress(row.original)}
            max={100}
            decimals={0}
            tone="primary"
            interactive={false}
            className="w-28"
            label="Avance del plan"
          />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <PlanStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'acta_status',
        header: 'Acta',
        cell: ({ row }) => <ActaStatusBadge status={row.original.acta_status} />,
      },
    ],
    [],
  )

  // The empty state is worth more than an empty table here: most teachers never
  // get a plan at all, and the table alone would read like something failed.
  if (!isPending && plans.length === 0) {
    return (
      <>
        <PageTitle>Mis planes de mejoramiento</PageTitle>
        <div className="border-border text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed py-16 text-center">
          <ClipboardCheck className="size-8" aria-hidden="true" />
          <p className="font-medium">No tienes un plan de mejoramiento asignado.</p>
          <p className="text-sm">
            Si tu director del departamento crea uno, aparecerá aquí con los compromisos acordados.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageTitle>Mis planes de mejoramiento</PageTitle>

      <DataTable
        columns={columns}
        data={page}
        isLoading={isPending}
        isFetching={isFetching}
        pageCount={Math.max(1, Math.ceil(filtered.length / pagination.pageSize))}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination((current) => (typeof updater === 'function' ? updater(current) : updater))
        }
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          resetPage()
        }}
        searchPlaceholder="Buscar por título o periodo..."
        emptyMessage="No hay planes que coincidan."
        onRowClick={(row) => navigate(`/mis-planes/${row.id}`)}
        toolbar={
          <>
            <Select
              value={periodCode}
              onValueChange={(value) => {
                setPeriodCode(value as string | null)
                resetPage()
              }}
              disabled={periodCodes.length === 0}
            >
              <SelectTrigger aria-label="Periodo" className="w-56">
                <SelectValue placeholder="Todos los periodos">
                  {periodCode ?? 'Todos los periodos'}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={null}>Todos los periodos</SelectItem>
                {periodCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as StatusFilter)
                resetPage()
              }}
            >
              <SelectTrigger aria-label="Estado del plan" className="w-52">
                <SelectValue>
                  {status ? PLAN_STATUS_LABEL[status] : 'Todos los estados'}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                {(Object.entries(PLAN_STATUS_LABEL) as [PlanStatus, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </>
        }
      />
    </>
  )
}

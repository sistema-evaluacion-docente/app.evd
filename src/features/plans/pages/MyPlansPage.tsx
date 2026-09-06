import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useDebounce } from 'use-debounce'
import { ClipboardCheck } from 'lucide-react'

import { DataTable } from '@/components/common/DataTable'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import {
  SelectLoadingLabel,
  selectLoadingTriggerClass,
} from '@/components/common/SelectLoadingLabel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import formatDate from '@/lib/formatDate'
import { useGetMyPlans, useGetPlanPeriods } from '../api'
import { ActaStatusBadge, PlanStatusBadge } from '../components/PlanStatusBadge'
import { usePlansFilters } from '../hooks/usePlansFilters'
import { PLAN_STATUS_LABEL, planProgress } from '../lib/planStatus'
import type { Plan, PlanStatus } from '../types'

/**
 * History of the teacher's own improvement plans — the director's follow-up
 * table, narrowed to what is theirs and without the "Docente" column, which
 * would say the same name on every row.
 *
 * `GET /improvement-plans/my` paginates and filters on the server, like the
 * director's directory, so the search, the period, the estado and the page all
 * travel to the API instead of being resolved over a list held in memory. The
 * filters live in the query string (`usePlansFilters`, shared with `/planes`),
 * so the view survives a reload and can be shared.
 *
 * Unlike `/planes` this one leads with **every** period rather than the newest:
 * the page is a history, and a teacher who opens it wants to see the plans they
 * have had, not only this semester's.
 *
 * Route: `/mis-planes`
 */
export default function MyPlansPage() {
  const [, navigate] = useLocation()

  const {
    search,
    status,
    periodCode,
    pageIndex,
    pageSize,
    setSearch,
    setStatus,
    setPeriodCode,
    setPagination,
  } = usePlansFilters()

  const [sorting, setSorting] = useState<SortingState>([])

  // The box stays responsive while the list waits for the teacher to stop
  // typing, instead of firing a request per keystroke.
  const [debouncedSearch] = useDebounce(search, 400)

  // Scoped to the teacher's own department by the API, whatever it is asked.
  const { data: periodsResponse, isLoading: periodsLoading } = useGetPlanPeriods()
  const periods = useMemo(() => periodsResponse?.data ?? [], [periodsResponse])

  // `undefined` (nothing chosen) and `null` ("todos los periodos") both mean no
  // period reaches the API — the difference only matters on `/planes`, where
  // nothing chosen leads with the newest semester.
  const periodId = useMemo(() => {
    if (!periodCode) return undefined

    return periods.find((entry) => entry.code === periodCode)?.id
  }, [periodCode, periods])

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize])

  const { data, isPending, isFetching } = useGetMyPlans({
    page: pageIndex + 1,
    limit: pageSize,
    search: debouncedSearch,
    status,
    periodId,
    // Waits for the periods so a page opened on `?periodo=2025-1` already comes
    // filtered, instead of painting every plan and swapping it a moment later.
    enabled: !periodsLoading,
  })

  const plans = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 0

  /** Nothing narrowing the list, so an empty answer means there is nothing. */
  const unfiltered = !debouncedSearch && !status && !periodId

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
  // get a plan at all, and the table alone would read like something failed. It
  // only stands in for the real thing when no filter is narrowing the list —
  // otherwise it would claim the teacher has no plans when they just filtered
  // them all out.
  if (!isPending && unfiltered && plans.length === 0) {
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
        data={plans}
        isLoading={isPending}
        isFetching={isFetching}
        pageCount={pageCount}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination(typeof updater === 'function' ? updater(pagination) : updater)
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por título..."
        emptyMessage="No hay planes que coincidan."
        onRowClick={(row) => navigate(`/mis-planes/${row.id}`)}
        toolbar={
          <>
            <Select
              value={periodId ?? null}
              onValueChange={(value) =>
                setPeriodCode(periods.find((entry) => entry.id === value)?.code ?? null)
              }
              disabled={periodsLoading}
            >
              <SelectTrigger
                aria-label="Periodo"
                className={cn('w-56', periodsLoading && selectLoadingTriggerClass)}
              >
                {periodsLoading ? (
                  <SelectLoadingLabel>Cargando periodos…</SelectLoadingLabel>
                ) : (
                  <SelectValue placeholder="Todos los periodos">
                    {periodCode ?? 'Todos los periodos'}
                  </SelectValue>
                )}
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={null}>Todos los periodos</SelectItem>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => setStatus(value as PlanStatus | '')}>
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

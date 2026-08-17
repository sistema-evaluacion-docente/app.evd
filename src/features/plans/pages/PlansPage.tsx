import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

import { DataTable } from '@/components/common/DataTable'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import {
  SelectLoadingLabel,
  selectLoadingTriggerClass,
} from '@/components/common/SelectLoadingLabel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useGetPlans, useGetPlanPeriods } from '../api'
import { PLAN_STATUS_LABEL } from '../lib/planStatus'
import type { Plan, PlanStatus } from '../types'
import { ActaStatusBadge, PlanStatusBadge } from '../components/PlanStatusBadge'

/**
 * Directory of improvement plans of the department.
 * Route: `/planes`
 */
export default function PlansPage() {
  const [, navigate] = useLocation()
  const [search, setSearch] = useState('')
  /** `''` means every status. */
  const [status, setStatus] = useState<PlanStatus | ''>('')
  /**
   * `undefined` while the director hasn't touched the filter — the most recent
   * semester leads then; `null` is the explicit "todos los periodos".
   */
  const [periodOverride, setPeriodOverride] = useState<number | null | undefined>(undefined)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // The API returns the periods newest first, so the first one is the semester
  // the director is most likely working on.
  const { data: periodsResponse, isLoading: periodsLoading } = useGetPlanPeriods()
  const periods = useMemo(() => periodsResponse?.data ?? [], [periodsResponse])

  const periodId = periodOverride === undefined ? periods[0]?.id : (periodOverride ?? undefined)
  const period = periods.find((entry) => entry.id === periodId)

  // Waits for the periods so the first list already comes filtered, instead of
  // painting every plan and swapping it a moment later.
  const { data, isPending, isFetching } = useGetPlans({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search,
    status,
    periodId,
    enabled: !periodsLoading,
  })

  const plans = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 0

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }))

  const columns = useMemo<ColumnDef<Plan>[]>(
    () => [
      {
        accessorKey: 'teacher_name',
        header: 'Docente',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={row.original.teacher_avatar_url ?? undefined} />
              <AvatarFallback>{row.original.teacher_name?.slice(0, 2) ?? '??'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.original.teacher_name}</p>
              <p className="text-muted-foreground truncate text-xs">{row.original.title}</p>
            </div>
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
            value={row.original.progress}
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

  return (
    <>
      <div className="mb-0 flex flex-wrap items-center justify-between">
        <PageTitle>Planes de mejoramiento</PageTitle>
        <Button onClick={() => navigate('/planes/nuevo')}>
          <Plus className="size-4" aria-hidden="true" />
          Nuevo plan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={plans}
        isLoading={isPending}
        isFetching={isFetching}
        pageCount={pageCount}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          resetPage()
        }}
        searchPlaceholder="Buscar por docente o título..."
        emptyMessage="No hay planes de mejoramiento que coincidan."
        onRowClick={(row) => navigate(`/planes/${row.id}`)}
        toolbar={
          <>
            <Select
              value={periodId ?? null}
              onValueChange={(value) => {
                setPeriodOverride(value as number | null)
                resetPage()
              }}
              disabled={periodsLoading || periods.length === 0}
            >
              <SelectTrigger
                aria-label="Periodo"
                aria-busy={periodsLoading}
                className={cn('w-44', periodsLoading && selectLoadingTriggerClass)}
              >
                {periodsLoading ? (
                  <SelectLoadingLabel>Cargando periodos…</SelectLoadingLabel>
                ) : (
                  <SelectValue placeholder="Todos los periodos">
                    {period?.code ?? 'Todos los periodos'}
                  </SelectValue>
                )}
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={null}>Todos los periodos</SelectItem>
                {periods.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as PlanStatus | '')
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

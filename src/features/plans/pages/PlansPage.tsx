import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useDebounce } from 'use-debounce'
import { History, Plus, Trash2, X } from 'lucide-react'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'
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
import { useAuthStore } from '@/features/auth'
import { useGetPlans, useGetPlanPeriods } from '../api'
import { DeletePlanDialog } from '../components/DeletePlanDialog'
import { usePlansFilters } from '../hooks/usePlansFilters'
import { PLAN_STATUS_LABEL, planProgress } from '../lib/planStatus'
import type { Plan, PlanStatus } from '../types'
import { ActaStatusBadge, PlanStatusBadge } from '../components/PlanStatusBadge'

/**
 * Directory of improvement plans of the department.
 *
 * Every filter lives in the query string (`usePlansFilters`), so the list is
 * shareable and a teacher's profile can link straight to his whole history:
 * `/planes?docente=42&nombre=Ana%20Ruiz&periodo=todos`.
 *
 * Route: `/planes`
 */
export default function PlansPage() {
  const [, navigate] = useLocation()

  // Deleting a plan undoes an agreement with a teacher, so it belongs to the
  // director who made it — the API turns anyone else away regardless.
  const roles = useAuthStore((state) => state.user?.roles) ?? []
  const canDelete = roles.includes('DIRECTOR DE DEPARTAMENTO')

  /** The plan waiting for its deletion to be confirmed, if any. */
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)
  const {
    search,
    status,
    periodCode,
    teacherId,
    teacherName,
    pageIndex,
    pageSize,
    setSearch,
    setStatus,
    setPeriodCode,
    setPagination,
    clearTeacher,
  } = usePlansFilters()

  const [sorting, setSorting] = useState<SortingState>([])

  // The box stays responsive while the list waits for the director to stop
  // typing, instead of firing a request per keystroke.
  const [debouncedSearch] = useDebounce(search, 400)

  // The API returns the periods newest first, so the first one is the semester
  // the director is most likely working on.
  const { data: periodsResponse, isLoading: periodsLoading } = useGetPlanPeriods()
  const periods = useMemo(() => periodsResponse?.data ?? [], [periodsResponse])

  const periodId = useMemo(() => {
    // `null` is "todos los periodos": no period reaches the API at all.
    if (periodCode === null) return undefined

    // Nothing chosen — or a code that no longer has plans — leads with the
    // most recent semester.
    if (periodCode === undefined) return periods[0]?.id

    return periods.find((entry) => entry.code === periodCode)?.id ?? periods[0]?.id
  }, [periodCode, periods])

  const period = periods.find((entry) => entry.id === periodId)

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize])

  // Waits for the periods so the first list already comes filtered, instead of
  // painting every plan and swapping it a moment later.
  const { data, isPending, isFetching } = useGetPlans({
    page: pageIndex + 1,
    limit: pageSize,
    // A pinned teacher is filtered by id: the box only *shows* his name, so a
    // name spelled differently by the API can't empty his history.
    search: teacherId ? '' : debouncedSearch,
    status,
    periodId,
    teacherId,
    enabled: !periodsLoading,
  })

  const plans = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 0

  // Straight from the link; falling back to the list for a URL typed by hand.
  const pinnedTeacher = teacherName ?? plans[0]?.teacher_name

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

  const rowActions: DataTableAction<Plan>[] = canDelete
    ? [
        {
          label: 'Eliminar',
          icon: <Trash2 className="size-4" />,
          onClick: (row) => setDeleteTarget(row),
          variant: 'destructive',
        },
      ]
    : []

  return (
    <>
      <div className="mb-0 flex flex-wrap items-center justify-between">
        <PageTitle>Planes de mejoramiento</PageTitle>
        <Button onClick={() => navigate('/planes/nuevo')}>
          <Plus className="size-4" aria-hidden="true" />
          Nuevo plan
        </Button>
      </div>

      {teacherId && (
        <div className="border-border bg-muted/30 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3">
          <p className="flex items-center gap-2 text-sm">
            <History className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            Historial de planes de{' '}
            <span className="font-medium">{pinnedTeacher ?? 'un docente'}</span>
            {periodCode === null && ' en todos los periodos'}
          </p>

          <Button variant="outline" size="sm" onClick={clearTeacher}>
            <X className="size-4" aria-hidden="true" />
            Quitar filtro
          </Button>
        </div>
      )}

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
        searchPlaceholder="Buscar por docente o título..."
        emptyMessage="No hay planes de mejoramiento que coincidan."
        onRowClick={(row) => navigate(`/planes/${row.id}`)}
        rowActions={rowActions}
        toolbar={
          <>
            <Select
              value={periodId ?? null}
              onValueChange={(value) => {
                const id = value as number | null

                setPeriodCode(
                  id === null ? null : (periods.find((entry) => entry.id === id)?.code ?? null),
                )
              }}
              disabled={periodsLoading || periods.length === 0}
            >
              <SelectTrigger
                aria-label="Periodo"
                aria-busy={periodsLoading}
                // Wide enough for "Cargando periodos…" too, so the filter
                // doesn't resize the toolbar the moment the periods land.
                className={cn('w-56', periodsLoading && selectLoadingTriggerClass)}
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

      <DeletePlanDialog plan={deleteTarget} onOpenChange={() => setDeleteTarget(null)} />
    </>
  )
}

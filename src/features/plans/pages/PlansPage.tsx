import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

import { DataTable } from '@/components/common/DataTable'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetPlans } from '../api'
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
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isPending, isFetching } = useGetPlans({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search,
    status,
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
      <div className="flex flex-wrap items-center justify-between mb-0">
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
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as PlanStatus | '')
              resetPage()
            }}
          >
            <SelectTrigger aria-label="Estado del plan" className="w-52">
              <SelectValue>{status ? PLAN_STATUS_LABEL[status] : 'Todos los estados'}</SelectValue>
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
        }
      />
    </>
  )
}

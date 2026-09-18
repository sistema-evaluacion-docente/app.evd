import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import { BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { ActiveBadge } from '@/components/common/ActiveBadge'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useGetFaculties } from '@/features/faculties'
import { useGetAcademicPeriods } from '@/features/periods'
import useAuth from '@/hooks/useAuth'
import { useNavigate } from '@/hooks/useNavigate'
import { useTableFilters } from '@/hooks/useTableFilters'
import { STATUS_TONE_CLASS } from '@/lib/statusTone'
import { useGetDepartmentCases, useGetDepartments, useGetDepartmentUploads } from '../api'
import type { Department, DepartmentCases, DepartmentUploadStatus } from '../types'

const PAGE_SIZE_DEFAULT = 10

/** A department plus what it uploaded in the selected period. */
interface DepartmentOverviewRow extends Department {
  upload: DepartmentUploadStatus | undefined
  cases: DepartmentCases | undefined
}

/** Where a department stands in the selected period, from most to least advanced. */
function uploadState(upload: DepartmentUploadStatus | undefined) {
  if (!upload?.has_uploaded) return { label: 'Sin subir', tone: 'neutral' } as const
  if (upload.ai_status === 'ANALYZED' || upload.global_average != null) {
    return { label: 'Analizada', tone: 'success' } as const
  }
  if (upload.status === 'FAILED' || upload.ai_status === 'FAILED') {
    return { label: 'Con error', tone: 'danger' } as const
  }

  return { label: 'Subida, sin analizar', tone: 'warning' } as const
}

const overviewColumns: ColumnDef<DepartmentOverviewRow>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="text-foreground font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'code',
    header: 'Código',
    enableSorting: false,
    cell: ({ getValue }) => (
      <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
        {getValue<string>()}
      </code>
    ),
  },
  {
    id: 'director',
    header: 'Director',
    enableSorting: false,
    cell: ({ row }) => {
      const director = row.original.director

      if (!director) return <span className="text-muted-foreground text-sm">Sin asignar</span>

      return (
        <div className="flex items-center gap-2">
          <Avatar className="border-border/70 size-7 border">
            <AvatarImage src={director.avatar_url ?? undefined} alt={director.name} />
            <AvatarFallback>
              <span className="text-xs font-semibold">
                {director.name.slice(0, 2).toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground text-sm">{director.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'teacher_count',
    header: 'Docentes',
    enableSorting: false,
    cell: ({ getValue }) => {
      const count = getValue<number>()

      return (
        <div className="flex items-center gap-1.5">
          <span className="text-foreground font-medium tabular-nums">{count}</span>
          <span className="text-muted-foreground text-xs">
            {count === 1 ? 'docente' : 'docentes'}
          </span>
        </div>
      )
    },
  },
  {
    id: 'upload',
    header: 'Evaluaciones',
    enableSorting: false,
    cell: ({ row }) => {
      const upload = row.original.upload
      const state = uploadState(upload)

      return (
        <div className="flex items-center gap-2">
          <Badge className={STATUS_TONE_CLASS[state.tone]}>{state.label}</Badge>

          {upload?.has_uploaded && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {upload.evaluation_count}
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: 'highRisk',
    header: 'Riesgo alto',
    enableSorting: false,
    cell: ({ row }) => {
      const { cases, upload } = row.original

      // Risk comments only exist once the evaluation is analysed, so a zero
      // before that would read as "no problems" — show a dash instead.
      if (!cases || upload?.global_average == null) {
        return <span className="text-muted-foreground text-sm">—</span>
      }

      return (
        <span
          className={
            cases.high_risk_comments > 0
              ? 'font-semibold text-red-600 tabular-nums dark:text-red-400'
              : 'text-foreground tabular-nums'
          }
        >
          {cases.high_risk_comments}
        </span>
      )
    },
  },
  {
    id: 'plans',
    header: 'Planes',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-foreground tabular-nums">{row.original.cases?.plans_total ?? '—'}</span>
    ),
  },
  {
    id: 'average',
    header: 'Promedio',
    enableSorting: false,
    cell: ({ row }) => (
      <ScoreBadge value={row.original.upload?.global_average ?? undefined} tone="auto" />
    ),
  },
  {
    accessorKey: 'active',
    header: 'Estado',
    enableSorting: false,
    cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
  },
]

interface DepartmentsOverviewListProps {
  /** Pins the table to one faculty and drops the faculty filter — used on a faculty's own page. */
  facultyId?: number
}

/**
 * Read-only departments table for DECANO and VICERRECTOR ACADEMICO: for a
 * chosen academic period it shows which departments uploaded evaluations
 * (and whether they were analysed yet), ordered by their average from
 * highest to lowest, with departments that have no average last. Clicking a
 * row opens that department's general summary. The backend scopes a DECANO
 * to their own faculty. Departments are loaded in one go (up to 100) and
 * merged with `GET /stats/departments/uploads` here, so ordering and paging
 * happen in the browser.
 *
 * @example
 * <DepartmentsOverviewList />
 */
export function DepartmentsOverviewList({ facultyId }: DepartmentsOverviewListProps = {}) {
  const { selectedRole } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE_DEFAULT,
  })
  const [periodId, setPeriodId] = useState<number | undefined>(undefined)
  const { filters, setFilters } = useTableFilters('departments-overview', {
    active: true,
    facultyId: undefined as number | undefined,
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data: facultiesData } = useGetFaculties({ limit: 100 })
  const faculties = facultiesData?.data ?? []

  const { data: periodsData, isPending: isPeriodsPending } = useGetAcademicPeriods()
  const latestPeriod = [...(periodsData?.data ?? [])].sort((a, b) =>
    b.code.localeCompare(a.code),
  )[0]
  const effectivePeriodId = periodId ?? latestPeriod?.id

  const {
    data: departmentsData,
    isPending: isDepartmentsPending,
    isFetching: isDepartmentsFetching,
  } = useGetDepartments({
    limit: 100,
    active: debouncedFilters.active as boolean | undefined,
    facultyId: facultyId ?? (debouncedFilters.facultyId as number | undefined),
    search: debouncedSearch,
  })
  const { data: uploadsData, isFetching: isUploadsFetching } =
    useGetDepartmentUploads(effectivePeriodId)

  const { data: casesData, isFetching: isCasesFetching } = useGetDepartmentCases(effectivePeriodId)

  const uploadsByDepartment = new Map(
    (uploadsData?.data ?? []).map((upload) => [upload.department_id, upload]),
  )
  const casesByDepartment = new Map((casesData?.data ?? []).map((row) => [row.department_id, row]))

  const rows: DepartmentOverviewRow[] = (departmentsData?.data ?? [])
    .map((department) => ({
      ...department,
      upload: uploadsByDepartment.get(department.id),
      cases: casesByDepartment.get(department.id),
    }))
    .sort((a, b) => {
      const aAverage = a.upload?.global_average
      const bAverage = b.upload?.global_average

      if (aAverage == null && bAverage == null) return a.name.localeCompare(b.name)
      if (aAverage == null) return 1
      if (bAverage == null) return -1

      return bAverage - aAverage
    })

  const pageCount = Math.max(1, Math.ceil(rows.length / pagination.pageSize))
  const pageRows = rows.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize,
  )

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  const activeFilter: FilterConfig = {
    type: 'boolean',
    name: 'active',
    label: 'Activo',
    trueLabel: 'Sí',
    falseLabel: 'No',
  }

  // Un Decano solo ve su propia facultad (el backend ya lo acota) — el filtro
  // por facultad sería redundante para ese rol.
  const filterConfig: FilterConfig[] =
    selectedRole === 'DECANO' || facultyId != null
      ? [activeFilter]
      : [
          activeFilter,
          {
            type: 'select',
            name: 'facultyId',
            label: 'Facultad',
            options: faculties.map((f) => ({ label: f.name, value: f.id })),
            clearable: true,
          },
        ]

  const rowActions: DataTableAction<DepartmentOverviewRow>[] = [
    {
      label: 'Ver resumen general',
      icon: <BarChart3 className="size-4" />,
      onClick: (row) => navigate(`/departamentos/${row.id}`),
    },
  ]

  return (
    <DataTable
      columns={overviewColumns}
      data={pageRows}
      pageCount={pageCount}
      isLoading={isDepartmentsPending || isPeriodsPending}
      isFetching={isDepartmentsFetching || isUploadsFetching || isCasesFetching}
      search={search}
      onSearchChange={(value) => {
        setSearch(value)
        resetPage()
      }}
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={pagination}
      onPaginationChange={setPagination}
      searchPlaceholder="Buscar por nombre o código..."
      emptyMessage="No hay departamentos que coincidan."
      rowActions={rowActions}
      onRowClick={(row) => navigate(`/departamentos/${row.id}`)}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelect
            value={effectivePeriodId}
            onValueChange={(id) => {
              setPeriodId(id)
              resetPage()
            }}
            ariaLabel="Periodo académico"
          />

          <DataTableFilters
            filters={filterConfig}
            values={filters}
            onChange={handleFiltersChange}
          />
        </div>
      }
    />
  )
}

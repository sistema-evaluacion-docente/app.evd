import { ChevronRight, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTableFilters, type SortField } from '@/components/common/DataTableFilters'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { TeacherSelect } from '@/features/teachers'
import { cn } from '@/lib/utils'
import { useGetDepartmentPeriodRangeSubjects } from '../api'
import type { DepartmentSubjectAverage, DepartmentSubjectGroup } from '../types'

const SORT_FIELDS: SortField[] = [
  { value: 'course_name', label: 'Nombre' },
  { value: 'overall_average', label: 'Promedio' },
  { value: 'total_respondents', label: 'Encuestados' },
]

export interface DepartmentSubjectsTableProps {
  /** Start of the selected range, as a period code (e.g. "2020-1"). */
  startPeriod: string | undefined
  /** End of the selected range, as a period code (e.g. "2022-1"). */
  endPeriod: string | undefined
  /** Rows per page. Defaults to 10. */
  pageSize?: number
  emptyMessage?: string
  /** Optional heading rendered above the list. Omit to render just the list. */
  title?: ReactNode
  className?: string
}

/**
 * Paginated, flat, hairline-separated list of a department's courses across
 * a period range, with their teacher/group counts, respondents and overall
 * average (`GET /stats/departments/period-range/subjects`). Clicking a course
 * expands it in place to reveal its individual groups (teacher/period/group)
 * — same interaction as `TeacherCourseResults`. Self-contained: it owns its
 * own pagination, driven by the `startPeriod`/`endPeriod` codes selected by
 * the caller.
 *
 * @example
 * <DepartmentSubjectsTable startPeriod="2020-1" endPeriod="2022-1" />
 */
export function DepartmentSubjectsTable({
  startPeriod,
  endPeriod,
  pageSize = 10,
  emptyMessage = 'No hay asignaturas con promedio para este rango de periodos.',
  title,
  className,
}: DepartmentSubjectsTableProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [teacherName, setTeacherName] = useState<string | undefined>(undefined)

  const resetPage = useDebouncedCallback(() => setPage(1), 400)

  const { data, isPending, isFetching } = useGetDepartmentPeriodRangeSubjects({
    startPeriod,
    endPeriod,
    page,
    limit: pageSize,
    search: debouncedSearch,
    sortBy,
    teacherName,
  })

  const subjects = data?.data ?? []
  const totalPages = data?.pagination?.pages ?? 1

  return (
    <section className={className}>
      {title && (
        <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          {title}
        </h2>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />

          <Input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              resetPage()
            }}
            placeholder="Buscar asignatura..."
            aria-label="Buscar asignatura"
            className="bg-background h-9 w-56 pl-9 shadow-none"
          />
        </div>

        <TeacherSelect
          value={teacherName}
          onValueChange={(name) => {
            setTeacherName(name)
            resetPage()
          }}
          placeholder="Docente"
          size="sm"
        />

        <DataTableFilters
          filters={[{ type: 'sort', name: 'sortBy', fields: SORT_FIELDS, clearable: true }]}
          values={{ sortBy }}
          onChange={(values) => {
            setSortBy(values.sortBy as string | undefined)
            resetPage()
          }}
        />

        {isFetching && <Spinner className="text-muted-foreground size-4" />}
      </div>

      <div className="border-border bg-background rounded-md border">
        {isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : subjects.length === 0 ? (
          <p className="text-muted-foreground px-6 py-10 text-center text-sm">{emptyMessage}</p>
        ) : (
          <div
            className={cn(
              'divide-border divide-y transition-opacity',
              isFetching && 'pointer-events-none opacity-60',
            )}
          >
            {subjects.map((subject) => (
              <SubjectRow key={subject.course_name} subject={subject} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="text-muted-foreground mt-3 flex items-center justify-between text-sm">
          <span>
            Página {page} de {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            >
              Anterior
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function SubjectRow({ subject }: { subject: DepartmentSubjectAverage }) {
  const groups = subject.groups ?? []

  return (
    <Collapsible className="group/row">
      <CollapsibleTrigger className="hover:bg-muted/40 group flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors">
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{subject.course_name}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <ScoreBadge size="lg" value={subject.overall_average} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="divide-border divide-y px-6 pb-2">
          {groups.length === 0 ? (
            <p className="text-muted-foreground py-3 text-sm">
              Sin grupos registrados en el rango seleccionado.
            </p>
          ) : (
            groups
              ?.sort((a, b) => Number(a.course_code) - Number(b.course_code))
              .map((group) => <GroupRow key={group.academic_group_id} group={group} />)
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function GroupRow({ group }: { group: DepartmentSubjectGroup }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-start gap-2">
        <Avatar size="lg">
          <AvatarFallback className="uppercase">{group.teacher_name.at(0) ?? '?'}</AvatarFallback>
          <AvatarImage src={group.teacher_avatar_url} alt={group.teacher_name} />
        </Avatar>

        <div>
          <p className="truncate text-xs">{group.teacher_name}</p>

          <p className="text-muted-foreground truncate text-sm">
            {group.course_code} - {group.group_name}{' '}
            <Badge variant="outline">{group.academic_period_code}</Badge>
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <ScoreBadge value={group.overall_average} />
      </div>
    </div>
  )
}

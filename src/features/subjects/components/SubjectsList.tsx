import { ChevronRight, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'wouter'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTableFilters, type SortField } from '@/components/common/DataTableFilters'
import { InlineError } from '@/components/common/InlineError'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useGetAcademicPeriods } from '@/features/periods'
import { useGetDepartmentPeriodRangeSubjects } from '@/features/stats'
import type { DepartmentSubjectAverage, DepartmentSubjectGroup } from '@/features/stats'
import { courseTeacherHref } from '@/features/teachers'
import { cn } from '@/lib/utils'

const SORT_FIELDS: SortField[] = [
  { value: 'overall_average', label: 'Promedio' },
  { value: 'course_name', label: 'Nombre' },
  { value: 'teacher_count', label: 'Docentes' },
]

/**
 * Paginated list of the director's own department's subjects ("materias")
 * for a single selected academic period, with the teachers who taught each
 * one. A subject taught by one teacher links straight to that teacher's
 * materia report; one taught by several expands in place to show each
 * teacher individually — "Comparar" (side-by-side comparison) is shown but
 * disabled until that flow is built.
 *
 * @example
 * <SubjectsList />
 */
export function SubjectsList({ className }: { className?: string }) {
  const { data: periodsData, isPending: isPeriodsPending } = useGetAcademicPeriods()
  const periods = periodsData?.data ?? []

  const [periodId, setPeriodId] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)

  const resetPage = useDebouncedCallback(() => setPage(1), 400)

  const selectedPeriod = periods.find((period) => period.id === periodId)
  const periodCode = selectedPeriod?.code

  const { data, isPending, isFetching, error } = useGetDepartmentPeriodRangeSubjects({
    startPeriod: periodCode,
    endPeriod: periodCode,
    page,
    limit: 10,
    search: debouncedSearch,
    sortBy,
  })

  const subjects = data?.data ?? []
  const totalPages = data?.pagination?.pages ?? 1

  if (!isPeriodsPending && periods.length === 0) {
    return (
      <p className={cn('text-muted-foreground py-10 text-center text-sm', className)}>
        No existen periodos académicos para mostrar.
      </p>
    )
  }

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <PeriodSelect
          value={periodId}
          onValueChange={(id) => {
            setPeriodId(id)
            resetPage()
          }}
          searchParam="period"
          ariaLabel="Periodo"
        />

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
            placeholder="Buscar materia..."
            aria-label="Buscar materia"
            className="bg-background h-9 w-56 pl-9 shadow-none"
          />
        </div>

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

      {error && <InlineError message={error.message} />}

      <div className="border-border bg-background rounded-md border">
        {isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : subjects.length === 0 ? (
          <p className="text-muted-foreground px-6 py-10 text-center text-sm">
            No hay materias con promedio para este periodo.
          </p>
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
    </div>
  )
}

function SubjectRow({ subject }: { subject: DepartmentSubjectAverage }) {
  const groups = subject.groups ?? []
  const soleGroup = subject.teacher_count === 1 ? groups[0] : undefined

  if (soleGroup) {
    return (
      <Link
        href={courseTeacherHref(
          soleGroup.course_code,
          soleGroup.teacher_id,
          soleGroup.academic_period_code,
          soleGroup.group_name,
        )}
        className="hover:bg-muted/40 flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors"
      >
        <p className="min-w-0 truncate text-sm font-medium">{subject.course_name}</p>

        <div className="flex shrink-0 items-center gap-4">
          <ScoreBadge size="lg" value={subject.overall_average} />
          <span className="text-muted-foreground text-xs">Ver detalle</span>
        </div>
      </Link>
    )
  }

  return (
    <Collapsible className="group/row">
      <CollapsibleTrigger className="hover:bg-muted/40 group flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left transition-colors">
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{subject.course_name}</p>
            <p className="text-muted-foreground text-xs">{subject.teacher_count} docentes</p>
          </div>
        </div>

        <ScoreBadge size="lg" value={subject.overall_average} />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-6 pb-4">
          <div className="mb-2 flex justify-end">
            <TooltipProvider delay={150}>
              <Tooltip>
                <TooltipTrigger render={<span tabIndex={0} className="inline-flex" />}>
                  <Button type="button" variant="outline" size="sm" disabled>
                    <Users className="size-4" aria-hidden="true" />
                    Comparar
                  </Button>
                </TooltipTrigger>

                <TooltipContent>
                  La comparación entre docentes estará disponible próximamente.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="divide-border divide-y">
            {groups.map((group) => (
              <TeacherGroupRow key={group.academic_group_id} group={group} />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TeacherGroupRow({ group }: { group: DepartmentSubjectGroup }) {
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
            {group.course_code} - {group.group_name}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ScoreBadge value={group.overall_average} />

        <Button
          type="button"
          variant="outline"
          size="sm"
          render={
            <Link
              href={courseTeacherHref(
                group.course_code,
                group.teacher_id,
                group.academic_period_code,
                group.group_name,
              )}
            />
          }
        >
          Ver detalle
        </Button>
      </div>
    </div>
  )
}

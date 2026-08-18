import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, ChevronRight, Pencil, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTableFilters, type SortField } from '@/components/common/DataTableFilters'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { InlineError } from '@/components/common/InlineError'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreLegend } from '@/components/common/ScoreLegend'
import { TransitionLink } from '@/components/common/TransitionLink'
import { useUpdateCourse } from '@/features/courses'
import { useGetAcademicPeriods } from '@/features/periods'
import type { DepartmentSubjectAverage, DepartmentSubjectGroup } from '@/features/stats'
import { statsKeys, useGetDepartmentPeriodRangeSubjects } from '@/features/stats'
import { courseTeacherHref } from '@/features/teachers'
import { subjectComparisonHref } from '../config'

/** The materia currently open in the rename drawer. */
interface EditCourseTarget {
  id: number
  name: string
}

const SORT_FIELDS: SortField[] = [
  { value: 'overall_average', label: 'Promedio' },
  { value: 'course_name', label: 'Nombre' },
  { value: 'teacher_count', label: 'Docentes' },
]

/**
 * Paginated list of the director's own department's subjects ("materias")
 * for a single selected academic period. Rows are grouped by materia name —
 * free text extracted from the uploaded PDF, so it can't be trusted as a
 * single identity (two different materias can end up sharing a truncated
 * name). Expanding a name reveals the real course codes underneath it, and
 * only within one code — its teachers are genuinely comparable — does
 * "Ver detalle" (one teacher) or "Comparar" (two or more) show up. A materia
 * with a single teacher overall skips straight to their materia report.
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
  const [editTarget, setEditTarget] = useState<EditCourseTarget | null>(null)

  const resetPage = useDebouncedCallback(() => setPage(1), 400)

  const queryClient = useQueryClient()
  const { mutate: updateCourse, isPending: isUpdating } = useUpdateCourse()

  const editFields: FieldConfig[] = editTarget
    ? [
        {
          name: 'name',
          label: 'Nombre de la materia',
          required: true,
          defaultValue: editTarget.name,
        },
      ]
    : []

  const handleUpdateSubmit = (values: Record<string, string>) => {
    if (!editTarget) return

    updateCourse(
      { courseId: editTarget.id, payload: { name: values.name } },
      {
        onSuccess: () => {
          toast.success('Materia actualizada exitosamente')
          queryClient.invalidateQueries({ queryKey: statsKeys.all })
          setEditTarget(null)
        },
      },
    )
  }

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

        <ScoreLegend className="ml-auto" />
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
              <SubjectRow key={subject.course_name} subject={subject} onEdit={setEditTarget} />
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

      {editTarget && (
        <DynamicFormDrawer
          key={editTarget.id}
          title={`Editar materia: ${editTarget.name}`}
          hideTrigger
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null)
          }}
          fields={editFields}
          onSubmit={handleUpdateSubmit}
          isSubmitting={isUpdating}
          submitLabel="Guardar"
        />
      )}
    </div>
  )
}

/** Groups within a materia name, partitioned by their real course code. */
interface CourseCodeGroup {
  code: string
  groups: DepartmentSubjectGroup[]
}

/**
 * Splits a materia name's groups by `course_code` — the name comes from
 * free-text extracted from the uploaded PDF (prone to truncation/typos, so
 * two genuinely different materias can share a name), but `course_code` is
 * a structured field, so it's the identity that's actually safe to compare
 * or link by. Never trust "the groups under one name" as one materia.
 */
function groupByCourseCode(groups: DepartmentSubjectGroup[]): CourseCodeGroup[] {
  const byCode = new Map<string, DepartmentSubjectGroup[]>()

  for (const group of groups) {
    const list = byCode.get(group.course_code) ?? []
    list.push(group)
    byCode.set(group.course_code, list)
  }

  return [...byCode.entries()].map(([code, codeGroups]) => ({ code, groups: codeGroups }))
}

function SubjectRow({
  subject,
  onEdit,
}: {
  subject: DepartmentSubjectAverage
  onEdit: (target: EditCourseTarget) => void
}) {
  const groups = subject.groups ?? []

  // Always drill down through the real course code — even when there's a
  // single teacher/code overall, jumping straight to their materia report
  // would skip the level that actually disambiguates this materia name.
  const codeGroups = groupByCourseCode(groups)

  // A materia name only maps to one real course_id when it rolls up a
  // single course code — with several codes underneath, editing "the" name
  // here would be ambiguous, so the button only shows in the safe case.
  const soleCourseId = codeGroups.length === 1 ? codeGroups[0].groups[0]?.course_id : undefined

  return (
    <Collapsible className="group/row">
      <div className="hover:bg-muted/40 muted group flex w-full items-center justify-between gap-4 px-6 transition-colors">
        <CollapsibleTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-4 text-left">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{subject.course_name}</p>
          </div>
        </CollapsibleTrigger>

        {soleCourseId != null && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit({ id: soleCourseId, name: subject.course_name })}
            aria-label={`Editar materia ${subject.course_name}`}
          >
            <Pencil className="text-muted-foreground size-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <CollapsibleContent>
        <div className="divide-border divide-y pb-1">
          {codeGroups.map(({ code, groups: groupsForCode }) => (
            <CourseCodeRow
              key={code}
              code={code}
              groups={groupsForCode}
              courseName={subject.course_name}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function CourseCodeRow({
  code,
  groups,
  courseName,
}: {
  code: string
  groups: DepartmentSubjectGroup[]
  courseName: string
}) {
  const soleGroup = groups.length === 1 ? groups[0] : undefined

  if (soleGroup) {
    return (
      <TransitionLink
        href={courseTeacherHref(
          soleGroup.course_code,
          soleGroup.teacher_id,
          soleGroup.academic_period_code,
          soleGroup.group_name,
        )}
        className="hover:bg-muted/40 group flex w-full items-center justify-between gap-4 py-3 pr-6 pl-12 text-left transition-colors"
      >
        <div className="min-w-0">
          <p className="group-hover:text-primary truncate text-sm font-medium transition-colors">
            {code} - {soleGroup.group_name}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <ScoreBadge value={soleGroup.overall_average} />

          <span className="text-muted-foreground group-hover:text-primary flex items-center gap-1 text-xs transition-colors">
            Ver detalle
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </span>
        </div>
      </TransitionLink>
    )
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className="hover:bg-muted/40 group flex w-full cursor-pointer items-center justify-between gap-4 py-3 pr-6 pl-12 text-left transition-colors">
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-3.5 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{code}</p>
            {/* <p className="text-muted-foreground text-xs">{groups.length} docentes</p> */}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pb-3 pl-12">
          <div className="mb-2 flex justify-end pr-6">
            <Button
              type="button"
              variant="outline"
              size="xs"
              nativeButton={false}
              render={
                <TransitionLink
                  href={subjectComparisonHref(code, groups[0].academic_period_code, courseName)}
                />
              }
            >
              <Users aria-hidden="true" />
              Comparar
            </Button>
          </div>

          <div className="divide-border divide-y pr-6">
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

        <TransitionLink
          href={courseTeacherHref(
            group.course_code,
            group.teacher_id,
            group.academic_period_code,
            group.group_name,
          )}
        >
          <span className="text-muted-foreground group-hover:text-primary flex items-center gap-1 text-xs transition-colors">
            Ver detalle
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </span>
        </TransitionLink>
      </div>
    </div>
  )
}

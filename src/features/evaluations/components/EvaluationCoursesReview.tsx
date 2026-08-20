import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { InlineEditText } from '@/components/common/InlineEditText'
import { InlineError } from '@/components/common/InlineError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useUpdateCourse } from '@/features/courses'
import type { DepartmentSubjectAverage } from '@/features/stats'
import { statsKeys, useGetDepartmentPeriodRangeSubjects } from '@/features/stats'
import { cn } from '@/lib/utils'

/** Page size of the underlying subjects report — its maximum. */
const PAGE_SIZE = 100

/** One renameable materia extracted from the evaluation's PDF. */
interface ExtractedCourse {
  /** Real course id — the only safe rename target (`PUT /courses/{id}`). */
  id: number
  code: string
  name: string
  groupCount: number
  teacherCount: number
}

/**
 * Flattens the report's name-grouped rows down to one entry per real
 * `course_id`. The report groups by `course_name`, which is free text pulled
 * out of the PDF — two genuinely different materias can share a truncated
 * name, so renaming "a row" there would be ambiguous. `course_id` is the
 * structured identity the rename endpoint accepts, so that is what a row here
 * stands for.
 */
function toExtractedCourses(subjects: DepartmentSubjectAverage[]): ExtractedCourse[] {
  const byCourseId = new Map<number, ExtractedCourse & { teacherIds: Set<number> }>()

  for (const subject of subjects) {
    for (const group of subject.groups ?? []) {
      const existing = byCourseId.get(group.course_id)

      if (existing) {
        existing.groupCount += 1
        existing.teacherIds.add(group.teacher_id)
        continue
      }

      byCourseId.set(group.course_id, {
        id: group.course_id,
        code: group.course_code,
        name: subject.course_name,
        groupCount: 1,
        teacherCount: 0,
        teacherIds: new Set([group.teacher_id]),
      })
    }
  }

  return [...byCourseId.values()]
    .map(({ teacherIds, ...course }) => ({ ...course, teacherCount: teacherIds.size }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export interface EvaluationCoursesReviewProps {
  /** Academic period the evaluation belongs to (e.g. `2024-1`). */
  periodCode?: string
  className?: string
}

/**
 * Lists the materias extracted from an evaluation's PDF and lets the director
 * correct their names in place. Names come from the PDF, which routinely cuts
 * long ones off, so every row's name is editable — the course code beside it
 * is the structured field that stays trustworthy.
 *
 * @example
 * <EvaluationCoursesReview periodCode={evaluation.academic_period_code} />
 */
export function EvaluationCoursesReview({ periodCode, className }: EvaluationCoursesReviewProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [renamedIds, setRenamedIds] = useState<number[]>([])

  const resetPage = useDebouncedCallback(() => setPage(1), 400)

  const queryClient = useQueryClient()
  const { mutateAsync: updateCourse } = useUpdateCourse()

  const { data, isPending, isFetching, error } = useGetDepartmentPeriodRangeSubjects({
    startPeriod: periodCode,
    endPeriod: periodCode,
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
  })

  const subjects = data?.data
  const courses = useMemo(() => toExtractedCourses(subjects ?? []), [subjects])
  const totalPages = data?.pagination?.pages ?? 1

  const handleRename = async (course: ExtractedCourse, name: string) => {
    await updateCourse({ courseId: course.id, payload: { name: name.toUpperCase() } })

    toast.success('Materia actualizada exitosamente')
    setRenamedIds((previous) => [...previous, course.id])
    await queryClient.invalidateQueries({ queryKey: statsKeys.all })
  }

  return (
    <div className={className}>
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
            placeholder="Buscar materia..."
            aria-label="Buscar materia"
            className="bg-background h-9 w-56 pl-9 shadow-none"
          />
        </div>

        {isFetching && <Spinner className="text-muted-foreground size-4" />}

        {(!isPending || !periodCode) && (
          <p className="text-muted-foreground ml-auto text-sm">
            {courses.length} materia{courses.length === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {error && <InlineError message={error.message} />}

      <div className="border-border bg-background rounded-md border">
        {isPending && periodCode ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground px-6 py-10 text-center text-sm">
            No se encontraron materias para este periodo.
          </p>
        ) : (
          <div
            className={cn(
              'divide-border divide-y transition-opacity',
              isFetching && 'pointer-events-none opacity-60',
            )}
          >
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <BookOpen className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />

                  <div className="min-w-0 flex-1">
                    <InlineEditText
                      value={course.name}
                      ariaLabel={`Editar nombre de la materia ${course.code}`}
                      placeholder="Nombre completo de la materia"
                      onSave={(name) => handleRename(course, name)}
                    >
                      <p className="truncate text-sm font-medium">{course.name}</p>
                    </InlineEditText>

                    <p className="text-muted-foreground text-xs">
                      {course.code} · {course.teacherCount} docente
                      {course.teacherCount === 1 ? '' : 's'} · {course.groupCount} grupo
                      {course.groupCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {renamedIds.includes(course.id) && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Actualizada
                  </span>
                )}
              </div>
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

import { LayoutGrid } from 'lucide-react'

import { InlineError } from '@/components/common/InlineError'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetDepartments } from '@/features/departments'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'
import { useGetDepartmentAverages } from '../api'

export interface FacultyDepartmentsOverviewProps {
  facultyId: number
  className?: string
}

/**
 * DECANO's own-faculty department ranking: every department of their
 * faculty, each with its most recent evaluated period's average, sorted
 * best-first — plus a headcount line (departments/teachers). Built purely
 * from department-level aggregates (`GET /departments/`,
 * `GET /stats/departments/averages`, the latter auto-scoped to the caller's
 * own faculty when no `department_id` is given) — never a single teacher or
 * comment, staying inside the same least-privilege boundary as the rest of
 * the DECANO's read-only access. Clicking a row opens that department's own
 * general summary at `/departamentos/{id}`.
 *
 * @example
 * <FacultyDepartmentsOverview facultyId={user.faculty_id} />
 */
export function FacultyDepartmentsOverview({
  facultyId,
  className,
}: FacultyDepartmentsOverviewProps) {
  const navigate = useNavigate()

  const {
    data: departmentsData,
    isPending: isDepartmentsPending,
    error: departmentsError,
  } = useGetDepartments({ facultyId, limit: 100 })
  const departments = departmentsData?.data ?? []

  const { data: averagesData, isPending: isAveragesPending, error: averagesError } =
    useGetDepartmentAverages()
  const averages = averagesData?.data ?? []

  // One row per department, keeping only its most recent evaluated period —
  // the endpoint returns one row per (department, period) combination.
  const latestByDepartment = new Map<number, (typeof averages)[number]>()
  for (const average of averages) {
    const current = latestByDepartment.get(average.department_id)
    if (!current || average.academic_period_code > current.academic_period_code) {
      latestByDepartment.set(average.department_id, average)
    }
  }

  const rows = departments
    .map((department) => ({ department, latest: latestByDepartment.get(department.id) }))
    .sort((a, b) => (b.latest?.global_average ?? -1) - (a.latest?.global_average ?? -1))

  const isPending = isDepartmentsPending || isAveragesPending
  const error = departmentsError || averagesError
  const totalTeachers = departments.reduce((sum, department) => sum + department.teacher_count, 0)

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <h2 className="text-foreground text-base font-semibold">Departamentos de mi facultad</h2>

        {!isDepartmentsPending && !departmentsError && (
          <p className="text-muted-foreground text-xs">
            {departments.length} {departments.length === 1 ? 'departamento' : 'departamentos'}
            {' · '}
            {totalTeachers} {totalTeachers === 1 ? 'docente' : 'docentes'}
          </p>
        )}
      </div>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      )}

      {!isPending && !error && rows.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No hay departamentos para mostrar.
        </p>
      )}

      {!isPending && !error && rows.length > 0 && (
        <div className="border-border divide-border divide-y overflow-hidden rounded-md border">
          {rows.map(({ department, latest }) => (
            <button
              key={department.id}
              type="button"
              onClick={() => navigate(`/departamentos/${department.id}`)}
              className="hover:bg-muted/40 flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 text-left transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                  <LayoutGrid className="text-muted-foreground size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-foreground truncate font-medium">{department.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {latest
                      ? `Periodo ${latest.academic_period_name || latest.academic_period_code}`
                      : 'Sin evaluaciones cargadas'}
                  </p>
                </div>
              </div>

              {latest && (
                <ScoreBadge value={latest.global_average ?? undefined} tone="auto" size="lg" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

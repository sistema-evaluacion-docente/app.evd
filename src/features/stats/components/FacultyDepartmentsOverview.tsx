import { LayoutGrid } from 'lucide-react'

import { InlineError } from '@/components/common/InlineError'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetDepartmentCases, useGetDepartments } from '@/features/departments'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'
import { useGetDepartmentAverages } from '../api'
import { OverviewRow } from './OverviewRow'

export interface FacultyDepartmentsOverviewProps {
  facultyId: number
  /** Academic period the averages are read for. */
  periodId: number
  className?: string
}

/**
 * DECANO's own-faculty department ranking: every active department of their
 * faculty, each with its average in the chosen period, sorted
 * best-first — plus a headcount line (departments/teachers). Built purely
 * from department-level aggregates (`GET /departments/`,
 * `GET /stats/departments/averages`, the latter auto-scoped to the caller's
 * own faculty when no `department_id` is given) — never a single teacher or
 * comment, staying inside the same least-privilege boundary as the rest of
 * the DECANO's read-only access. Clicking a row opens that department's own
 * general summary at `/departamentos/{id}`.
 *
 * @example
 * <FacultyDepartmentsOverview facultyId={user.faculty_id} periodId={12} />
 */
export function FacultyDepartmentsOverview({
  facultyId,
  periodId,
  className,
}: FacultyDepartmentsOverviewProps) {
  const navigate = useNavigate()

  const {
    data: departmentsData,
    isPending: isDepartmentsPending,
    error: departmentsError,
  } = useGetDepartments({ facultyId, active: true, limit: 100 })
  const departments = departmentsData?.data ?? []

  const { data: averagesData, isPending: isAveragesPending, error: averagesError } =
    useGetDepartmentAverages()
  const averages = averagesData?.data ?? []

  // The endpoint returns one row per (department, period) combination.
  const latestByDepartment = new Map<number, (typeof averages)[number]>()
  for (const average of averages) {
    if (average.academic_period_id === periodId) {
      latestByDepartment.set(average.department_id, average)
    }
  }

  const rows = departments
    .map((department) => ({ department, latest: latestByDepartment.get(department.id) }))
    .sort((a, b) => (b.latest?.global_average ?? -1) - (a.latest?.global_average ?? -1))

  const { data: casesData } = useGetDepartmentCases(periodId)
  const casesByDepartment = new Map((casesData?.data ?? []).map((row) => [row.department_id, row]))
  const casesLabel = (departmentId: number) => {
    const cases = casesByDepartment.get(departmentId)

    if (!cases) return ''

    return ` · ${cases.high_risk_comments} riesgo alto · ${cases.plans_total} ${cases.plans_total === 1 ? 'plan' : 'planes'}`
  }

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
        <div className="border-border bg-background divide-border divide-y overflow-hidden rounded-md border shadow-xs">
          {rows.map(({ department, latest }, index) => (
            <OverviewRow
              key={department.id}
              icon={<LayoutGrid aria-hidden="true" />}
              title={department.name}
              subtitle={
                latest
                  ? `Periodo ${latest.academic_period_name || latest.academic_period_code}${casesLabel(department.id)}`
                  : 'Sin evaluaciones en este periodo'
              }
              rank={latest ? index + 1 : undefined}
              score={latest?.global_average}
              onClick={() => navigate(`/departamentos/${department.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { RankedBarChart } from '@/components/common/RankedBarChart'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetDepartments } from '@/features/departments'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'
import { useGetDepartmentAverages } from '../api'

export interface FacultyDepartmentsComparisonProps {
  facultyId: number
  /** Academic period the departments are compared in. */
  periodId: number
  /** The faculty's own average in that period, drawn as a marker across the bars. */
  facultyAverage?: number
  className?: string
}

/**
 * Bar comparison of every active department of one faculty in one academic
 * period, best first. Faculties can have dozens of departments, so
 * `RankedBarChart` shows the top ten and lets the reader expand the rest;
 * departments with no analysed evaluation in the period are counted apart
 * instead of drawn as empty bars. Bars open the department's general summary.
 * Built from `GET /departments/` and `GET /stats/departments/averages`
 * (auto-scoped to the DECANO's faculty by the backend).
 *
 * @example
 * <FacultyDepartmentsComparison facultyId={1} periodId={12} facultyAverage={4.1} />
 */
export function FacultyDepartmentsComparison({
  facultyId,
  periodId,
  facultyAverage,
  className,
}: FacultyDepartmentsComparisonProps) {
  const navigate = useNavigate()
  const { data: departmentsData, isPending: isDepartmentsPending } = useGetDepartments({
    facultyId,
    active: true,
    limit: 100,
  })
  const { data: averagesData, isPending: isAveragesPending } = useGetDepartmentAverages()

  const averageByDepartment = new Map(
    (averagesData?.data ?? [])
      .filter((row) => row.academic_period_id === periodId)
      .map((row) => [row.department_id, row.global_average]),
  )

  const items = (departmentsData?.data ?? []).map((department) => ({
    key: String(department.id),
    label: department.name,
    value: averageByDepartment.get(department.id),
  }))

  return (
    <section className={cn('border-border bg-background rounded-md border', className)}>
      <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
        Comparación de departamentos
      </h2>

      <div className="px-3 py-4 sm:px-6">
        {isDepartmentsPending || isAveragesPending ? (
          <Skeleton className="h-48 w-full rounded-md" />
        ) : (
          <RankedBarChart
            items={items}
            referenceValue={facultyAverage}
            referenceLabel="Promedio de la facultad"
            itemsLabel="departamentos"
            emptyMessage="Ningún departamento tiene evaluaciones analizadas en este periodo."
            onItemClick={(key) => navigate(`/departamentos/${key}`)}
          />
        )}
      </div>
    </section>
  )
}

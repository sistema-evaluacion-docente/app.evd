import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useGetDepartmentAverages } from '../api'
import { DepartmentGeneralHero } from './DepartmentGeneralHero'

export interface DepartmentGeneralSummaryProps {
  departmentId: number
  className?: string
}

/**
 * Read-only, general-only summary of a single department — the latest
 * evaluated period as the headline figure, and every period it has data for
 * as a trend (`GET /stats/departments/averages?department_id=`). This is the
 * VICERRECTOR ACADEMICO/DECANO view of a department they don't manage: no
 * comments, no pedagogical dimensions, no per-subject or per-teacher
 * breakdown — see `DepartmentPeriodRangeSummary` for the director's own,
 * full view. The backend scopes a DECANO to their own faculty's departments
 * on its own (403 otherwise), so no extra access check is needed here.
 *
 * @example
 * <DepartmentGeneralSummary departmentId={department.id} />
 */
export function DepartmentGeneralSummary({ departmentId, className }: DepartmentGeneralSummaryProps) {
  const { data, isPending, error } = useGetDepartmentAverages(departmentId)
  // The backend orders this endpoint newest-period-first — reverse it to the
  // oldest-first convention `useGetFacultyAverages` already established.
  const averages = [...(data?.data ?? [])].reverse()
  const latest = averages[averages.length - 1]
  const previous = averages[averages.length - 2]

  return (
    <div className={cn('space-y-6', className)}>
      <PageTitle>Resumen del departamento</PageTitle>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-72 w-full rounded-md" />
        </div>
      )}

      {!isPending && !error && latest && (
        <div className="space-y-6">
          <DepartmentGeneralHero
            latest={latest}
            previousValue={previous?.global_average ?? undefined}
          />

          {averages.length > 1 && (
            <section className="border-border bg-background rounded-md border">
              <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
                Evolución del promedio por periodo
              </h2>

              <div className="px-6 py-4">
                <AverageTrendChart
                  series={[
                    {
                      id: 'department',
                      label: 'Promedio del departamento',
                      data: averages.map((period) => ({
                        x: period.academic_period_name || period.academic_period_code,
                        value: period.global_average,
                      })),
                    },
                  ]}
                  referenceValue={latest.global_average ?? undefined}
                  referenceLabel="Periodo más reciente"
                />
              </div>
            </section>
          )}
        </div>
      )}

      {!isPending && !error && !latest && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Este departamento todavía no tiene evaluaciones cargadas.
        </p>
      )}
    </div>
  )
}

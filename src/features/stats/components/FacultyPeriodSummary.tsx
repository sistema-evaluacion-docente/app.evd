import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useGetFacultyAverages } from '../api'
import { FacultyStatsHero } from './FacultyStatsHero'

export interface FacultyPeriodSummaryProps {
  facultyId: number
  className?: string
}

/**
 * Full self-contained widget with a DECANO's own faculty averages — the
 * latest evaluated period as the headline figure, and every period it has
 * data for as a trend (`GET /stats/faculties/{faculty_id}/average`).
 *
 * @example
 * <FacultyPeriodSummary facultyId={user.faculty_id} />
 */
export function FacultyPeriodSummary({ facultyId, className }: FacultyPeriodSummaryProps) {
  const { data, isPending, error } = useGetFacultyAverages(facultyId)
  const averages = data?.data ?? []
  // The backend returns every period the faculty has data for — oldest
  // first, same convention as `DepartmentPeriodRangeStats.period_averages`.
  const latest = averages[averages.length - 1]
  const previous = averages[averages.length - 2]

  return (
    <div className={cn('space-y-6', className)}>
      <PageTitle>Resumen de la facultad</PageTitle>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-72 w-full rounded-md" />
        </div>
      )}

      {!isPending && !error && latest && (
        <div className="space-y-6">
          <FacultyStatsHero latest={latest} previousValue={previous?.global_average ?? undefined} />

          {averages.length > 1 && (
            <section className="border-border bg-background rounded-md border">
              <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
                Evolución del promedio por periodo
              </h2>

              <div className="px-6 py-4">
                <AverageTrendChart
                  series={[
                    {
                      id: 'faculty',
                      label: 'Promedio de la facultad',
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
          Tu facultad todavía no tiene evaluaciones cargadas.
        </p>
      )}
    </div>
  )
}

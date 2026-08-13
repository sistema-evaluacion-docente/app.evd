import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { InlineError } from '@/components/common/InlineError'
import { Skeleton } from '@/components/ui/skeleton'
import type { AcademicPeriod } from '@/features/periods'
import { cn } from '@/lib/utils'
import type { DepartmentPeriodRangeStats } from '../types'
import { DepartmentCommentCategoriesChart } from './DepartmentCommentCategoriesChart'
import { DepartmentCommentRiskChart } from './DepartmentCommentRiskChart'
import { DepartmentDimensionsChart } from './DepartmentDimensionsChart'
import { DepartmentStatsHero } from './DepartmentStatsHero'

export interface DepartmentPeriodRangeSummaryLayoutProps {
  stats: DepartmentPeriodRangeStats | undefined
  isPending: boolean
  isFetching: boolean
  error: Error | null
  startPeriod: AcademicPeriod | undefined
  endPeriod: AcademicPeriod | undefined
  className?: string
}

/**
 * Pure layout for `DepartmentPeriodRangeSummary`: renders the error, skeleton,
 * loaded-content and empty states for a department's period-range report.
 * Owns no state or data fetching — takes the query result as props so it can
 * be reused/previewed independently of the period-selector container.
 *
 * @example
 * <DepartmentPeriodRangeSummaryLayout
 *   stats={stats}
 *   isPending={isPending}
 *   isFetching={isFetching}
 *   error={error}
 *   startPeriod={startPeriod}
 *   endPeriod={endPeriod}
 * />
 */
export function DepartmentPeriodRangeSummaryLayout({
  stats,
  isPending,
  isFetching,
  error,
  startPeriod,
  endPeriod,
  className,
}: DepartmentPeriodRangeSummaryLayoutProps) {
  return (
    <div className={className}>
      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-6">
          <div className="divide-border border-border bg-background divide-y overflow-hidden rounded-md border">
            <div className="flex items-center justify-between gap-3 px-6 py-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-32" />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6 p-6">
              <div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-8 w-48" />
              </div>

              <div>
                <Skeleton className="ml-auto h-3 w-28" />
                <Skeleton className="mt-2 ml-auto h-12 w-24" />
              </div>
            </div>

            <div className="divide-border grid grid-cols-3 divide-x">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <Skeleton className="h-3 w-full max-w-28" />
                  <Skeleton className="mt-2 h-8 w-12" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-border bg-background rounded-md border">
            <div className="border-border border-b px-6 py-4">
              <Skeleton className="h-4 w-56" />
            </div>

            <div className="px-6 py-4">
              <Skeleton className="h-56 w-full rounded-md" />
            </div>
          </div>

          <div className="border-border bg-background rounded-md border">
            <div className="border-border border-b px-6 py-4">
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="px-6 py-4">
              <Skeleton className="h-48 w-full rounded-md" />
            </div>
          </div>

          <div className="border-border bg-background rounded-md border">
            <div className="border-border border-b px-6 py-4">
              <Skeleton className="mb-2 h-4 w-52" />
              <Skeleton className="h-3 w-80" />
            </div>
            <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="px-6 py-4">
                <Skeleton className="mb-3 h-3 w-24" />
                <Skeleton className="h-40 w-full rounded-md" />
              </div>
              <div className="px-6 py-4">
                <Skeleton className="mb-3 h-3 w-32" />
                <Skeleton className="h-40 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isPending && stats && (
        <div
          className={cn(
            'space-y-6 transition-opacity',
            isFetching && 'pointer-events-none opacity-60',
          )}
        >
          <DepartmentStatsHero
            stats={stats}
            commentsHref={
              endPeriod ? `/comentarios?period=${encodeURIComponent(endPeriod.name)}` : undefined
            }
          />

          {startPeriod !== endPeriod && (
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
                      data: stats.period_averages.map((period) => ({
                        x: period.academic_period_name || period.academic_period_code,
                        value: period.overall_average,
                      })),
                    },
                  ]}
                  referenceValue={stats.overall_average}
                  referenceLabel="Promedio del rango"
                />
              </div>
            </section>
          )}

          <section className="border-border bg-background rounded-md border">
            <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
              Promedios por dimensión pedagógica
            </h2>

            <div className="px-6 py-4">
              <DepartmentDimensionsChart
                dimensions={stats.dimensions}
                referenceValue={stats.overall_average}
                referenceLabel="Promedio general"
              />
            </div>
          </section>

          {(stats.comments_risk_counts || stats.comments_pedagogical_category_counts) && (
            <section className="border-border bg-background rounded-md border">
              <div className="border-border border-b px-6 py-4">
                <h2 className="text-sm font-medium">Comentarios de la heteroevaluación</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Clasificación de los comentarios que los estudiantes dejaron en las evaluaciones
                  del departamento durante el rango seleccionado.
                </p>
              </div>

              <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {stats.comments_risk_counts && (
                  <div className="px-6 py-4">
                    <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                      Por nivel de riesgo
                    </h3>

                    <DepartmentCommentRiskChart counts={stats.comments_risk_counts} />
                  </div>
                )}

                {stats.comments_pedagogical_category_counts && (
                  <div className="px-6 py-4">
                    <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                      Por categoría pedagógica
                    </h3>

                    <DepartmentCommentCategoriesChart
                      counts={stats.comments_pedagogical_category_counts}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* <DepartmentSubjectsTable
            startPeriod={startPeriod?.code}
            endPeriod={endPeriod?.code}
            title="Promedios por asignatura"
          /> */}
        </div>
      )}

      {!isPending && !stats && !error && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No hay datos para el rango de periodos seleccionado.
        </p>
      )}
    </div>
  )
}

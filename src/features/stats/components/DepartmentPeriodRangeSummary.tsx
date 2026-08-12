import { useState } from 'react'

import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { InlineError } from '@/components/common/InlineError'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useGetAcademicPeriods } from '@/features/periods'
import { cn } from '@/lib/utils'
import { useGetDepartmentPeriodRangeStats } from '../api'
import { DepartmentCommentCategoriesChart } from './DepartmentCommentCategoriesChart'
import { DepartmentCommentRiskChart } from './DepartmentCommentRiskChart'
import { DepartmentDimensionsChart } from './DepartmentDimensionsChart'
import { DepartmentStatsHero } from './DepartmentStatsHero'

export interface DepartmentPeriodRangeSummaryProps {
  /** How many trailing periods to preselect once periods load. Defaults to 1 (just the latest period). */
  defaultRangeSize?: number
  className?: string
}

/**
 * Full self-contained widget with the director's own department averages —
 * overall, per-dimension, per-period trend and per-subject — across a
 * selectable range of academic periods
 * (`GET /stats/departments/period-range`). Owns its own start/end period
 * selectors and query, so it can be dropped straight into the dashboard.
 * Defaults to showing just the latest period until the user widens the range.
 *
 * @example
 * <DepartmentPeriodRangeSummary />
 *
 * @example
 * <DepartmentPeriodRangeSummary defaultRangeSize={4} />
 */
export function DepartmentPeriodRangeSummary({
  defaultRangeSize = 1,
  className,
}: DepartmentPeriodRangeSummaryProps) {
  const { data: periodsData, isPending: isPeriodsPending } = useGetAcademicPeriods()
  const periods = periodsData?.data ?? []
  const sortedPeriods = [...periods].sort((a, b) => a.code.localeCompare(b.code))

  // Until the user picks explicitly, default to the last `defaultRangeSize`
  // periods — derived from the loaded list rather than synced via an effect.
  const defaultEnd = sortedPeriods[sortedPeriods.length - 1]
  const defaultStart = sortedPeriods[Math.max(0, sortedPeriods.length - defaultRangeSize)]

  const [startPeriodId, setStartPeriodId] = useState<number | undefined>(undefined)
  const [endPeriodId, setEndPeriodId] = useState<number | undefined>(undefined)

  const effectiveStartId = startPeriodId ?? defaultStart?.id
  const effectiveEndId = endPeriodId ?? defaultEnd?.id

  const startPeriod = periods.find((period) => period.id === effectiveStartId)
  const endPeriod = periods.find((period) => period.id === effectiveEndId)

  const handleStartChange = (id: number) => {
    setStartPeriodId(id)

    const period = periods.find((p) => p.id === id)
    if (period && endPeriod && period.code > endPeriod.code) setEndPeriodId(id)
  }

  const handleEndChange = (id: number) => {
    setEndPeriodId(id)

    const period = periods.find((p) => p.id === id)
    if (period && startPeriod && period.code < startPeriod.code) setStartPeriodId(id)
  }

  const { data, isPending, isFetching, error } = useGetDepartmentPeriodRangeStats({
    startPeriod: startPeriod?.code,
    endPeriod: endPeriod?.code,
  })

  const stats = data?.data

  if (!isPeriodsPending && sortedPeriods.length === 0) {
    return (
      <p className={cn('text-muted-foreground py-10 text-center text-sm', className)}>
        No existen periodos académicos para mostrar.
      </p>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <PeriodSelect
          value={effectiveStartId}
          onValueChange={handleStartChange}
          placeholder="Periodo inicial"
          ariaLabel="Periodo inicial"
        />

        <span className="text-muted-foreground text-sm">hasta</span>

        <PeriodSelect
          value={effectiveEndId}
          onValueChange={handleEndChange}
          placeholder="Periodo final"
          ariaLabel="Periodo final"
        />

        {isFetching && <Spinner className="text-muted-foreground size-4" />}
      </div>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
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

import { useId, useState } from 'react'

import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { useGetAcademicPeriods } from '@/features/periods'
import { cn } from '@/lib/utils'
import { useGetDepartmentPeriodRangeStats } from '../api'
import { InlineError } from '@/components/common/InlineError'
import { DepartmentStatsHero } from './DepartmentStatsHero'
import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { DepartmentDimensionsChart } from './DepartmentDimensionsChart'
import { DepartmentCommentRiskChart } from './DepartmentCommentRiskChart'
import { DepartmentCommentCategoriesChart } from './DepartmentCommentCategoriesChart'

export interface DepartmentPeriodRangeSummaryProps {
  /** How many trailing periods to preselect once "comparar un rango" is turned on. Defaults to 2. */
  defaultRangeSize?: number
  className?: string
}

/**
 * Full self-contained widget with the director's own department averages —
 * overall, per-dimension, per-period trend and comment breakdowns
 * (`GET /stats/departments/period-range`). Defaults to the single most
 * recent period, the common case; comparing a range of periods is an
 * explicit opt-in via a toggle, not the default view.
 *
 * @example
 * <DepartmentPeriodRangeSummary />
 *
 * @example
 * <DepartmentPeriodRangeSummary defaultRangeSize={4} />
 */
export function DepartmentPeriodRangeSummary({
  defaultRangeSize = 2,
  className,
}: DepartmentPeriodRangeSummaryProps) {
  const compareRangeId = useId()
  const { data: periodsData, isPending: isPeriodsPending } = useGetAcademicPeriods()
  const periods = periodsData?.data ?? []
  const sortedPeriods = [...periods].sort((a, b) => a.code.localeCompare(b.code))

  // Until the user picks explicitly, default to the last `defaultRangeSize`
  // periods — derived from the loaded list rather than synced via an effect.
  const defaultEnd = sortedPeriods[sortedPeriods.length - 1]
  const defaultStart = sortedPeriods[Math.max(0, sortedPeriods.length - defaultRangeSize)]

  const [compareRange, setCompareRange] = useState(false)
  const [startPeriodId, setStartPeriodId] = useState<number | undefined>(undefined)
  const [endPeriodId, setEndPeriodId] = useState<number | undefined>(undefined)

  const effectiveEndId = endPeriodId ?? defaultEnd?.id
  // Outside "comparar un rango" mode, start always tracks end — there's only
  // ever one period selector on screen, so nothing can drift out of sync.
  const effectiveStartId = compareRange ? (startPeriodId ?? defaultStart?.id) : effectiveEndId

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
    if (period && compareRange && startPeriod && period.code < startPeriod.code) {
      setStartPeriodId(id)
    }
  }

  const { data, isPending, isFetching, error } = useGetDepartmentPeriodRangeStats({
    startPeriod: startPeriod?.code,
    endPeriod: endPeriod?.code,
  })

  if (!isPeriodsPending && sortedPeriods.length === 0) {
    return (
      <p className={cn('text-muted-foreground py-10 text-center text-sm', className)}>
        No existen periodos académicos para mostrar.
      </p>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {compareRange ? (
            <>
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
            </>
          ) : (
            <PeriodSelect
              value={effectiveEndId}
              onValueChange={handleEndChange}
              placeholder="Periodo"
              ariaLabel="Periodo"
            />
          )}

          {isFetching && <Spinner className="text-muted-foreground size-4" />}
        </div>

        <div className="flex items-center gap-2">
          <Switch id={compareRangeId} checked={compareRange} onCheckedChange={setCompareRange} />
          <Label htmlFor={compareRangeId} className="text-muted-foreground text-sm font-normal">
            Comparar un rango de periodos
          </Label>
        </div>
      </div>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      )}

      {!isPending && data?.data && (
        <div
          className={cn(
            'space-y-6 transition-opacity',
            isFetching && 'pointer-events-none opacity-60',
          )}
        >
          <DepartmentStatsHero
            stats={data?.data}
            commentsHref={
              endPeriod ? `/comentarios?period=${encodeURIComponent(endPeriod.name)}` : undefined
            }
          />

          {compareRange && startPeriod !== endPeriod && (
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
                      data: data?.data.period_averages.map((period) => ({
                        x: period.academic_period_name || period.academic_period_code,
                        value: period.overall_average,
                      })),
                    },
                  ]}
                  referenceValue={data?.data?.overall_average}
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
                dimensions={data?.data?.dimensions}
                referenceValue={data?.data?.overall_average}
                referenceLabel="Promedio general"
              />
            </div>
          </section>

          {(data?.data?.comments_risk_counts ||
            data?.data?.comments_pedagogical_category_counts) && (
            <section className="border-border bg-background rounded-md border">
              <div className="border-border border-b px-6 py-4">
                <h2 className="text-sm font-medium">Comentarios de la heteroevaluación</h2>

                <p className="text-muted-foreground mt-0.5 text-xs">
                  Clasificación de los comentarios que los estudiantes dejaron en las evaluaciones
                  del departamento durante el rango seleccionado.
                </p>
              </div>

              <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {data?.data?.comments_risk_counts && (
                  <div className="px-6 py-4">
                    <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                      Por nivel de riesgo
                    </h3>

                    <DepartmentCommentRiskChart counts={data?.data?.comments_risk_counts} />
                  </div>
                )}

                {data?.data?.comments_pedagogical_category_counts && (
                  <div className="px-6 py-4">
                    <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                      Por categoría pedagógica
                    </h3>

                    <DepartmentCommentCategoriesChart
                      counts={data?.data?.comments_pedagogical_category_counts}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Subjects table intentionally not shown here — belongs to the
              dedicated Materias flow, not the general summary. */}
        </div>
      )}

      {!isPending && !data?.data && !error && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No hay datos para el rango de periodos seleccionado.
        </p>
      )}
    </div>
  )
}

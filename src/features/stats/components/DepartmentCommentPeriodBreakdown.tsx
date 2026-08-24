import { useState } from 'react'

import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { CATEGORIES, categoryColor, categoryLabel, UNCATEGORIZED } from '@/lib/categoryLabel'
import { RISK_LEVELS, type RiskLevelKey } from '@/lib/riskLevel'
import { cn } from '@/lib/utils'
import { useGetDepartmentPeriodBreakdowns } from '../api'
import type { StatsPeriodRef } from '../types'

const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

export interface DepartmentCommentPeriodBreakdownProps {
  /** Every period in the compared range, oldest first. */
  periods: StatsPeriodRef[]
  className?: string
}

/** `Math.max(1, ...)` (no NaN from an empty range) rounded up to the nearest ten, with a floor of 10 so a handful of comments doesn't dwarf the axis. */
function axisMax(values: (number | undefined)[]): number {
  const rawMax = Math.max(1, ...values.map((value) => value ?? 0))

  return Math.max(10, Math.ceil(rawMax / 10) * 10)
}

/**
 * Comment counts across a range of periods — one bar per period, for a
 * single risk level or pedagogical category picked with a chip selector.
 * `GET /stats/departments/period-range` only ever answers with one
 * aggregate for whatever range it's asked about, so a genuine per-period
 * read means fetching each period on its own
 * (`useGetDepartmentPeriodBreakdowns`) rather than the range as a whole.
 *
 * Stands in for `DepartmentCommentsSummary` when comparing a range: showing
 * every risk level and every category at once, for one period, doesn't
 * scale to several periods (it becomes an unlabeled wall of bars — no way to
 * tell which bar belongs to which semester). One indicator across every
 * period, with a switch to change which indicator, does.
 *
 * @example
 * <DepartmentCommentPeriodBreakdown periods={stats.periods} />
 */
export function DepartmentCommentPeriodBreakdown({
  periods,
  className,
}: DepartmentCommentPeriodBreakdownProps) {
  const [riskKey, setRiskKey] = useState<RiskLevelKey>('ALTO')
  const [categoryCode, setCategoryCode] = useState(ANALYZABLE_CATEGORIES[0].code)

  const results = useGetDepartmentPeriodBreakdowns(
    periods.map((period) => period.academic_period_code),
  )
  const isPending = results.some((result) => result.isPending)

  const dimensions = periods.map((period) => ({
    key: period.academic_period_code,
    label: period.academic_period_name,
  }))

  const selectedRisk = RISK_LEVELS.find((level) => level.key === riskKey)
  const selectedCategory = ANALYZABLE_CATEGORIES.find((category) => category.code === categoryCode)

  const riskValues = periods.map(
    (_period, index) => results[index]?.data?.data?.comments_risk_counts?.[riskKey],
  )
  const categoryValues = periods.map(
    (_period, index) =>
      results[index]?.data?.data?.comments_pedagogical_category_counts?.[categoryCode],
  )

  return (
    <section className={cn('border-border bg-background rounded-md border', className)}>
      <div className="border-border border-b px-6 py-4">
        <h2 className="text-sm font-medium">Comentarios de la heteroevaluación</h2>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Un indicador a la vez, un periodo por barra — elige cuál ver.
        </p>
      </div>

      <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="px-6 py-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Por nivel de riesgo
          </h3>

          <ChipSelect
            options={RISK_LEVELS.map((level) => ({
              value: level.key,
              label: level.name,
              color: level.color,
            }))}
            value={riskKey}
            onChange={(value) => setRiskKey(value as RiskLevelKey)}
          />

          <DimensionComparisonChart
            series={[
              {
                id: 'risk',
                label: selectedRisk?.name ?? riskKey,
                color: selectedRisk?.color,
                scores: periods.map((period, index) => ({
                  dimension: period.academic_period_code,
                  value: riskValues[index],
                })),
              },
            ]}
            dimensions={dimensions}
            orientation="vertical"
            colorByDimension={false}
            showLegend={false}
            customizable={false}
            decimals={0}
            min={0}
            max={axisMax(riskValues)}
            isLoading={isPending}
            emptyMessage="No hay comentarios clasificados por nivel de riesgo en este rango de periodos."
            chartClassName="mt-4 h-56"
          />
        </div>

        <div className="px-6 py-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Por categoría pedagógica
          </h3>

          <ChipSelect
            options={ANALYZABLE_CATEGORIES.map((category) => ({
              value: category.code,
              label: categoryLabel(category.code),
              color: categoryColor(category.code),
            }))}
            value={categoryCode}
            onChange={setCategoryCode}
          />

          <DimensionComparisonChart
            series={[
              {
                id: 'category',
                label: selectedCategory?.label ?? categoryCode,
                color: selectedCategory?.color,
                scores: periods.map((period, index) => ({
                  dimension: period.academic_period_code,
                  value: categoryValues[index],
                })),
              },
            ]}
            dimensions={dimensions}
            orientation="vertical"
            colorByDimension={false}
            showLegend={false}
            customizable={false}
            decimals={0}
            min={0}
            max={axisMax(categoryValues)}
            isLoading={isPending}
            emptyMessage="No hay comentarios clasificados por categoría en este rango de periodos."
            chartClassName="mt-4 h-56"
          />
        </div>
      </div>
    </section>
  )
}

/** Single-select pill group — same look as the filter chips in `CommentsPanel`, but always exactly one option selected (a risk level/category to plot, not an optional filter to toggle off). */
function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; color: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Indicador a mostrar">
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide uppercase transition-all duration-200',
              isSelected ? 'shadow-card' : 'text-muted-foreground hover:text-foreground',
            )}
            style={
              isSelected
                ? {
                    color: option.color,
                    backgroundColor: `color-mix(in srgb, ${option.color} 12%, transparent)`,
                  }
                : undefined
            }
          >
            <span
              aria-hidden="true"
              className={cn('size-1.5 shrink-0 rounded-full transition-opacity', {
                'opacity-40': !isSelected,
              })}
              style={{ backgroundColor: option.color }}
            />

            {option.label}
          </button>
        )
      })}
    </div>
  )
}

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import { InlineError } from '@/components/common/InlineError'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** One dimension of the axis, in the order it should be drawn. */
export interface DimensionAxis {
  /** Stable identity of the dimension (its name or code). */
  key: string
  /** Text shown on the axis; defaults to `key`. */
  label?: string
  /** Color used when a single series is colored per dimension. */
  color?: string
}

/** Score of one entity on one dimension. */
export interface DimensionScore {
  /** Must match a `DimensionAxis.key`. */
  dimension: string
  value: number | null
}

/** One entity being compared: a teacher, a department, a period, a target… */
export interface DimensionSeries {
  /** Stable identity — the color follows this, never the array position. */
  id: string
  label: string
  color?: string
  scores: DimensionScore[]
}

export interface DimensionComparisonChartProps {
  series: DimensionSeries[]
  /** Axis order and labels; derived from the series when omitted. */
  dimensions?: DimensionAxis[]
  /** `bars` reads values precisely, `radar` reads the shape of a profile. */
  variant?: 'bars' | 'radar'
  /** Bars only: `horizontal` puts dimensions on the left (best for long labels). */
  orientation?: 'horizontal' | 'vertical'
  min?: number
  max?: number
  decimals?: number
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  /** Dashed marker, e.g. the institutional target or the overall average. */
  referenceValue?: number
  referenceLabel?: string
  /** Legend. Defaults to `true` with 2+ series. */
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  /** Value printed next to each bar. Defaults to `true` with 1–2 series. */
  showValues?: boolean
  /**
   * With a single series, paint each bar with its dimension color instead of
   * one series color. Defaults to `true`.
   */
  colorByDimension?: boolean
  valueFormatter?: (value: number) => string
  /** Shortens a dimension label for the axis (e.g. `shortenDimensionLabel`). */
  labelFormatter?: (dimension: string) => string
  /** Classes for the chart box — set the height here (defaults to `h-64`). */
  chartClassName?: string
  className?: string
}

/** Row key holding the pre-formatted value rendered as a direct bar label. */
const LABEL_SUFFIX = '__label'

/** Palette order is fixed: a series keeps its color when others are filtered out. */
const PALETTE = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

/**
 * Compares dimension averages across one or more entities — a teacher against
 * their department, two periods against each other, a single profile against
 * its target. `bars` (default) is the accurate read; `radar` shows the shape of
 * a profile at a glance. Purely presentational: it receives shaped series and
 * owns no query.
 *
 * With one series the bars are colored per dimension so they stay
 * distinguishable without a legend; with several, color identifies the entity
 * and the legend is always shown.
 *
 * @example
 * <DimensionComparisonChart
 *   series={[{ id: 'teacher', label: 'Docente', scores }]}
 *   labelFormatter={shortenDimensionLabel}
 * />
 *
 * @example
 * <DimensionComparisonChart
 *   variant="radar"
 *   series={[teacherSeries, departmentSeries]}
 *   referenceValue={4}
 *   referenceLabel="Meta"
 * />
 */
export function DimensionComparisonChart({
  series,
  dimensions,
  variant = 'bars',
  orientation = 'horizontal',
  min = 0,
  max = 5,
  decimals = 2,
  isLoading = false,
  error = null,
  emptyMessage = 'No hay dimensiones para comparar.',
  referenceValue,
  referenceLabel,
  showLegend,
  showGrid = true,
  showTooltip = true,
  showValues,
  colorByDimension = true,
  valueFormatter,
  labelFormatter,
  chartClassName,
  className,
}: DimensionComparisonChartProps) {
  const formatValue = valueFormatter ?? ((value: number) => value.toFixed(decimals))
  const withLegend = showLegend ?? series.length > 1
  const withValues = showValues ?? series.length <= 2
  const axis = dimensions ?? deriveDimensions(series)
  const singleSeries = series.length === 1
  const paintByDimension = singleSeries && colorByDimension

  const hasData = series.some((entry) => entry.scores.some((score) => score.value != null))

  const chartConfig: ChartConfig = Object.fromEntries(
    series.map((entry, index) => [
      entry.id,
      { label: entry.label, color: entry.color ?? PALETTE[index % PALETTE.length] },
    ]),
  )

  const rows = axis.map((dimension) => {
    const row: Record<string, string | number | null> = {
      dimension: labelFormatter?.(dimension.key) ?? dimension.label ?? dimension.key,
    }

    for (const entry of series) {
      const value = entry.scores.find((score) => score.dimension === dimension.key)?.value ?? null

      row[entry.id] = value
      // Pre-formatted so `LabelList` can read it straight from the row.
      row[`${entry.id}${LABEL_SUFFIX}`] = value == null ? '' : formatValue(value)
    }

    return row
  })

  if (isLoading) {
    return <Skeleton className={cn('h-64 w-full rounded-md', chartClassName, className)} />
  }

  if (error) return <InlineError message={error} className={className} />

  if (!hasData || axis.length === 0) {
    return (
      <div
        className={cn(
          'text-muted-foreground flex h-64 items-center justify-center text-center text-sm text-balance',
          chartClassName,
          className,
        )}
      >
        {emptyMessage}
      </div>
    )
  }

  const boxClass = cn('h-64 w-full', chartClassName, className)
  const tickStyle = { fontSize: 11, fill: 'var(--color-muted-foreground)' }

  if (variant === 'radar') {
    return (
      <ChartContainer config={chartConfig} className={boxClass}>
        <RadarChart data={rows} outerRadius="72%">
          {showGrid && <PolarGrid stroke="var(--color-border)" />}

          <PolarAngleAxis dataKey="dimension" tick={tickStyle} />
          <PolarRadiusAxis domain={[min, max]} tick={tickStyle} axisLine={false} />

          {showTooltip && (
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />}
            />
          )}

          {withLegend && <ChartLegend content={<ChartLegendContent />} />}

          {series.map((entry, index) => {
            const color = entry.color ?? PALETTE[index % PALETTE.length]

            return (
              <Radar
                key={entry.id}
                dataKey={entry.id}
                name={entry.label}
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={singleSeries ? 0.18 : 0.1}
                dot={{ r: 3, fill: color, stroke: 'var(--color-background)', strokeWidth: 1 }}
                isAnimationActive={false}
              />
            )
          })}
        </RadarChart>
      </ChartContainer>
    )
  }

  const isHorizontal = orientation === 'horizontal'

  return (
    <ChartContainer config={chartConfig} className={boxClass}>
      <BarChart
        data={rows}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: withValues ? 40 : 12, left: isHorizontal ? 8 : -16, bottom: 8 }}
        barGap={2}
      >
        {showGrid && (
          <CartesianGrid
            horizontal={!isHorizontal}
            vertical={isHorizontal}
            stroke="var(--color-border)"
          />
        )}

        {isHorizontal ? (
          <>
            <XAxis
              type="number"
              domain={[min, max]}
              tickLine={false}
              axisLine={false}
              tick={tickStyle}
            />
            <YAxis
              type="category"
              dataKey="dimension"
              width={120}
              tickLine={false}
              axisLine={false}
              tick={tickStyle}
            />
          </>
        ) : (
          <>
            <XAxis
              type="category"
              dataKey="dimension"
              tickLine={false}
              axisLine={false}
              tick={tickStyle}
            />
            <YAxis
              type="number"
              domain={[min, max]}
              tickLine={false}
              axisLine={false}
              tick={tickStyle}
            />
          </>
        )}

        {referenceValue != null && (
          <ReferenceLine
            {...(isHorizontal ? { x: referenceValue } : { y: referenceValue })}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={
              referenceLabel
                ? {
                    value: referenceLabel,
                    position: isHorizontal ? 'insideTopRight' : 'insideTopLeft',
                    fontSize: 10,
                    fill: 'var(--color-muted-foreground)',
                  }
                : undefined
            }
          />
        )}

        {showTooltip && (
          <ChartTooltip
            cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.4 }}
            content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />}
          />
        )}

        {withLegend && <ChartLegend content={<ChartLegendContent />} />}

        {series.map((entry, index) => {
          const color = entry.color ?? PALETTE[index % PALETTE.length]

          return (
            <Bar
              key={entry.id}
              dataKey={entry.id}
              name={entry.label}
              fill={color}
              radius={4}
              maxBarSize={28}
              isAnimationActive={false}
            >
              {paintByDimension &&
                axis.map((dimension, dimensionIndex) => (
                  <Cell
                    key={dimension.key}
                    fill={dimension.color ?? PALETTE[dimensionIndex % PALETTE.length]}
                  />
                ))}

              {withValues && (
                <LabelList
                  dataKey={`${entry.id}${LABEL_SUFFIX}`}
                  position={isHorizontal ? 'right' : 'top'}
                  offset={6}
                  className="fill-foreground"
                  fontSize={11}
                />
              )}
            </Bar>
          )
        })}
      </BarChart>
    </ChartContainer>
  )
}

/** Dimension axis in first-appearance order across every series. */
function deriveDimensions(series: DimensionSeries[]): DimensionAxis[] {
  const seen = new Map<string, DimensionAxis>()

  for (const entry of series) {
    for (const score of entry.scores) {
      if (!seen.has(score.dimension)) seen.set(score.dimension, { key: score.dimension })
    }
  }

  return [...seen.values()]
}

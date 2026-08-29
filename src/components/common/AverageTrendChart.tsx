import { useId, useState } from 'react'

import { Settings2 } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import { InlineError } from '@/components/common/InlineError'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** A single point of a trend: one period/month and its average. */
export interface TrendPoint {
  /** Category on the x axis — a month key, a period code, any ordered label. */
  x: string
  /** Average at that point; `null` leaves a gap instead of faking continuity. */
  value: number | null
}

/** One line of the chart: a teacher, a department, a dimension, a target… */
export interface TrendSeries {
  /** Stable identity — the color follows this, never the position in the array. */
  id: string
  label: string
  /** Overrides the palette color assigned by order. */
  color?: string
  /** `dashed` marks non-measured lines such as targets or benchmarks. */
  variant?: 'solid' | 'dashed'
  data: TrendPoint[]
}

export interface AverageTrendChartProps {
  series: TrendSeries[]
  /** Explicit x order; derived from the series (first appearance) when omitted. */
  categories?: string[]
  /** `line` for plain trends, `area` when a single series should read as volume. */
  type?: 'line' | 'area'
  /** Y axis bounds. Defaults to the 0–5 evaluation scale. */
  min?: number
  max?: number
  /** Decimals used in tooltips and labels. Defaults to 2. */
  decimals?: number
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  /** Horizontal marker, e.g. the institutional target or the overall average. */
  referenceValue?: number
  referenceLabel?: string
  /** Legend. Defaults to `true` whenever there are 2+ series. */
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  /**
   * Dash patterns per series, the secondary encoding that keeps lines apart for
   * colorblind readers. Defaults to `true` from 3 series on.
   */
  dashPatterns?: boolean
  /** Draw across `null` points instead of breaking the line. Defaults to `false`. */
  connectNulls?: boolean
  /**
   * Shows a button that opens a popover to override the Y axis min/max on
   * the fly, e.g. to zoom into a narrow band of scores. Purely a display
   * preference — kept as local UI state, never reported back to the caller.
   * Defaults to `true`.
   */
  customizable?: boolean
  /** Formats the value in axis and tooltip. */
  valueFormatter?: (value: number) => string
  /** Formats the x tick label (e.g. `2025-1` → `2025-I`). */
  xFormatter?: (value: string) => string
  /** Classes for the chart box — set the height here (defaults to `h-64`). */
  chartClassName?: string
  className?: string
}

/** Palette order is fixed: a series keeps its color when others are filtered out. */
const PALETTE = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

/** Secondary encoding for CVD readers, applied in the same fixed order. */
const DASH_PATTERNS = ['', '6 4', '2 3', '10 4 2 4', '1 3']

/**
 * Trend of an average over time — a teacher across periods, a department month
 * by month, one dimension against another, a value against its target. Purely
 * presentational: it receives already-shaped series and owns no query, so the
 * same chart serves any entity that produces a number per period.
 *
 * Each series keeps its color by `id` (never by array position), so filtering
 * one out never repaints the rest.
 *
 * @example
 * <AverageTrendChart
 *   series={[{ id: 'teacher', label: 'Mi promedio', data: points }]}
 *   referenceValue={4} referenceLabel="Meta"
 * />
 *
 * @example
 * <AverageTrendChart
 *   series={dimensionSeries}
 *   chartClassName="h-80"
 *   xFormatter={(code) => code.replace('-', ' · ')}
 * />
 *
 * @example
 * <AverageTrendChart series={series} customizable={false} />
 */
export function AverageTrendChart({
  series,
  categories,
  type = 'line',
  min = 0,
  max = 5,
  decimals = 2,
  isLoading = false,
  error = null,
  emptyMessage = 'No hay datos suficientes para mostrar la tendencia.',
  referenceValue,
  referenceLabel,
  showLegend,
  showGrid = true,
  showTooltip = true,
  dashPatterns,
  connectNulls = false,
  customizable = true,
  valueFormatter,
  xFormatter,
  chartClassName,
  className,
}: AverageTrendChartProps) {
  const minInputId = useId()
  const maxInputId = useId()

  const [minOverride, setMinOverride] = useState<number | undefined>(undefined)
  const [maxOverride, setMaxOverride] = useState<number | undefined>(undefined)

  const formatValue = valueFormatter ?? ((value: number) => value.toFixed(decimals))
  const withLegend = showLegend ?? series.length > 1
  const withDashes = dashPatterns ?? series.length > 2

  const effectiveMin = minOverride ?? min
  const effectiveMax = maxOverride ?? max
  const isCustomized = minOverride != null || maxOverride != null

  const handleResetBounds = () => {
    setMinOverride(undefined)
    setMaxOverride(undefined)
  }

  const xValues = categories ?? deriveCategories(series)
  const hasData = series.some((entry) => entry.data.some((point) => point.value != null))

  const chartConfig: ChartConfig = Object.fromEntries(
    series.map((entry, index) => [
      entry.id,
      { label: entry.label, color: entry.color ?? PALETTE[index % PALETTE.length] },
    ]),
  )

  const rows = xValues.map((x) => {
    const row: Record<string, string | number | null> = { x }

    for (const entry of series) {
      row[entry.id] = entry.data.find((point) => point.x === x)?.value ?? null
    }

    return row
  })

  if (isLoading) {
    return <Skeleton className={cn('h-64 w-full rounded-md', chartClassName, className)} />
  }

  if (error) return <InlineError message={error} className={className} />

  if (!hasData) {
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

  const ChartRoot = type === 'area' ? AreaChart : LineChart

  return (
    <div className={cn('relative', className)}>
      {customizable && (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                // variant="ghost"
                size="icon-sm"
                aria-label="Personalizar gráfico"
                className={cn(
                  'absolute top-0 right-0 z-10',
                  isCustomized && 'text-primary bg-primary/10 hover:bg-primary/15',
                )}
              />
            }
          >
            <Settings2 className="size-4" aria-hidden="true" />
          </PopoverTrigger>

          <PopoverContent align="end" className="w-64">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Personalizar gráfico</p>

              {isCustomized && (
                <button
                  type="button"
                  onClick={handleResetBounds}
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium transition-colors"
                >
                  Restablecer
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={minInputId} className="text-xs font-medium">
                  Mínimo
                </Label>

                <Input
                  id={minInputId}
                  type="number"
                  step={0.1}
                  min={0}
                  value={effectiveMin}
                  onChange={(event) => {
                    const raw = event.target.value
                    setMinOverride(raw === '' ? undefined : Number(raw))
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={maxInputId} className="text-xs font-medium">
                  Máximo
                </Label>

                <Input
                  id={maxInputId}
                  type="number"
                  step={0.1}
                  max={5}
                  value={effectiveMax}
                  onChange={(event) => {
                    const raw = event.target.value
                    setMaxOverride(raw === '' ? undefined : Number(raw))
                  }}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <ChartContainer config={chartConfig} className={cn('h-64 w-full pt-6', chartClassName)}>
        <ChartRoot data={rows} margin={{ top: 12, right: 16, left: 16, bottom: 4 }}>
          {showGrid && <CartesianGrid vertical={false} stroke="var(--color-border)" />}

          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={xFormatter}
            tick={{ fontSize: 14, fill: 'var(--color-muted-foreground)' }}
          />

          <YAxis
            domain={[effectiveMin, effectiveMax]}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 14, fill: 'var(--color-muted-foreground)' }}
          />

          {referenceValue != null && (
            <ReferenceLine
              y={referenceValue}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={
                referenceLabel
                  ? {
                      value: referenceLabel,
                      position: 'insideTopRight',
                      fontSize: 14,
                      fill: 'var(--color-muted-foreground)',
                    }
                  : undefined
              }
            />
          )}

          {showTooltip && (
            <ChartTooltip
              cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
              content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />}
            />
          )}

          {withLegend && <ChartLegend content={<ChartLegendContent />} />}

          {series.map((entry, index) => {
            const color = entry.color ?? PALETTE[index % PALETTE.length]
            const dash =
              entry.variant === 'dashed'
                ? '4 4'
                : withDashes
                  ? DASH_PATTERNS[index % DASH_PATTERNS.length]
                  : ''

            const common = {
              dataKey: entry.id,
              name: entry.label,
              stroke: color,
              strokeWidth: 2,
              strokeDasharray: dash || undefined,
              connectNulls,
              dot: { r: 4, fill: color, stroke: 'var(--color-background)', strokeWidth: 2 },
              activeDot: { r: 6, fill: color, stroke: 'var(--color-background)', strokeWidth: 2 },
              isAnimationActive: false,
            }

            // Straight segments between measured points: a smoothed curve
            // bends past the values it joins, inventing averages no period
            // ever had.
            return type === 'area' ? (
              <Area key={entry.id} {...common} type="linear" fill={color} fillOpacity={0.12} />
            ) : (
              <Line key={entry.id} {...common} type="linear" />
            )
          })}
        </ChartRoot>
      </ChartContainer>
    </div>
  )
}

/** X categories in first-appearance order across every series. */
function deriveCategories(series: TrendSeries[]) {
  const seen = new Set<string>()

  for (const entry of series) {
    for (const point of entry.data) seen.add(point.x)
  }

  return [...seen]
}

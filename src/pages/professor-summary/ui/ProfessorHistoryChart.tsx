import { useMemo, useState } from 'react'
import { Brush, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/shared/ui'

import type { ProfessorHistoryPoint } from '../model/data'

const chartConfig = {
  value: {
    label: 'Promedio global',
    color: 'var(--color-brand-600)',
  },
} satisfies ChartConfig

/** Comparison ranges, in number of most-recent semesters. */
const RANGE_OPTIONS = [2, 3, 5] as const

type RangeValue = '2' | '3' | '5' | 'all'

/** Below this many visible points the pan/zoom brush adds noise, not value. */
const BRUSH_MIN_POINTS = 5

export interface ProfessorHistoryChartProps {
  data: ProfessorHistoryPoint[]
}

export function ProfessorHistoryChart({ data }: ProfessorHistoryChartProps) {
  const [range, setRange] = useState<RangeValue>('all')

  // Only offer a "last N" range when there is more history than N to trim.
  const rangeItems = useMemo(() => {
    const items: { value: RangeValue; label: string }[] = RANGE_OPTIONS.filter(
      (count) => data.length > count,
    ).map((count) => ({
      value: String(count) as RangeValue,
      label: `Últimos ${count} semestres`,
    }))
    items.push({ value: 'all', label: 'Todos los semestres' })
    return items
  }, [data.length])

  const visible = useMemo(
    () => (range === 'all' ? data : data.slice(-Number(range))),
    [data, range],
  )

  const showBrush = visible.length > BRUSH_MIN_POINTS

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-ink-900">
            Evolución histórica
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-500">
            Promedio global por semestre en la escala 1–5.
            {showBrush
              ? ' Arrastre la barra inferior para acercar o desplazarse.'
              : ''}
          </p>
        </div>

        {rangeItems.length > 1 && (
          <div className="w-full sm:w-56">
            <Select
              items={rangeItems}
              value={range}
              onValueChange={(value) => {
                if (value) setRange(value as RangeValue)
              }}
            >
              <SelectTrigger
                aria-label="Rango de comparación"
                className="h-9 w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {rangeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mt-5">
        {visible.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-60 w-full">
            <LineChart
              data={visible}
              margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 4" />
              <XAxis
                dataKey="code"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={12}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickLine={false}
                axisLine={false}
                width={28}
                tickMargin={6}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '2 3' }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.name ?? ''
                    }
                    formatter={(value) => (
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-[2px] bg-brand-600" />
                          Promedio global
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(value).toFixed(1)}
                          <span className="text-muted-foreground"> / 5</span>
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Line
                dataKey="value"
                type="linear"
                stroke="var(--color-value)"
                strokeWidth={2.25}
                dot={{ r: 3.5, fill: 'var(--color-value)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              {showBrush && (
                <Brush
                  key={`${range}-${visible.length}`}
                  dataKey="code"
                  height={26}
                  travellerWidth={8}
                  stroke="var(--color-brand-300)"
                  fill="var(--color-brand-50)"
                />
              )}
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-60 items-center justify-center text-[14px] text-ink-500">
            Sin historial disponible
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-3.5 text-[13px] text-ink-700">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
        Promedio global · {visible.length}{' '}
        {visible.length === 1 ? 'semestre' : 'semestres'}
      </div>
    </Card>
  )
}

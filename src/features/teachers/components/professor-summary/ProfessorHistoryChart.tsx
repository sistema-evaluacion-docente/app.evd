import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useMemo } from 'react'
import { Brush, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import type { ProfessorHistoryPoint } from '../../model/professorSummary'
import { useRangeFilter } from './useRangeFilter'

const chartConfig = {
  value: {
    label: 'Promedio global',
    color: 'var(--color-brand-600)',
  },
} satisfies ChartConfig

const BRUSH_MIN_POINTS = 5

export interface ProfessorHistoryChartProps {
  data: ProfessorHistoryPoint[]
}

export function ProfessorHistoryChart({ data }: ProfessorHistoryChartProps) {
  const { range, visible } = useRangeFilter(data)
  const showBrush = visible.length > BRUSH_MIN_POINTS

  const semesterLabel = useMemo(
    () => (visible.length === 1 ? 'semestre' : 'semestres'),
    [visible.length],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolucion historica</CardTitle>

        <p className="text-muted-foreground mt-1 text-sm">
          Promedio global por semestre en la escala 1-5.
          {showBrush ? ' Arrastre la barra inferior para acercar o desplazarse.' : ''}
        </p>
      </CardHeader>
      {/*
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <RangeSelect
          totalItems={data.length}
          value={range}
          onChange={setRange}
          className="w-full sm:w-56"
        />
      </div> */}

      <CardContent>
        {visible.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-60 w-full">
            <LineChart data={visible} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
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
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                    formatter={(value) => (
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="bg-primary h-2.5 w-2.5 rounded-sm" />
                          Promedio global
                        </span>

                        <span className="text-foreground font-mono font-medium tabular-nums">
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
          <div className="text-muted-foreground flex h-60 items-center justify-center text-sm">
            Sin historial disponible
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div className="border-border text-foreground/80 mt-4 flex items-center gap-2 text-sm">
          <span className="bg-primary h-2.5 w-2.5 rounded-full" />
          Promedio global · {visible.length} {semesterLabel}
        </div>
      </CardFooter>
    </Card>
  )
}

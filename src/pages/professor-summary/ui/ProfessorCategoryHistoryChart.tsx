import { Brush, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

import type { CategoryHistoryPoint } from '../model/data'

const chartConfig = {
  mine: {
    label: 'Usted',
    color: 'var(--color-brand-600)',
  },
  dept: {
    label: 'Promedio docentes',
    color: 'var(--color-ink-400)',
  },
} satisfies ChartConfig

/** Below this many visible points the pan/zoom brush adds noise, not value. */
const BRUSH_MIN_POINTS = 5

export interface ProfessorCategoryHistoryChartProps {
  /** Already trimmed to the selected range and sorted oldest → newest. */
  data: CategoryHistoryPoint[]
}

/** Two-line evolution (teacher vs. department average) for one category. */
export function ProfessorCategoryHistoryChart({ data }: ProfessorCategoryHistoryChartProps) {
  const showBrush = data.length > BRUSH_MIN_POINTS

  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-[14px] text-ink-500">
        Sin historial disponible
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-60 w-full">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
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
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="mine"
          name="mine"
          type="linear"
          stroke="var(--color-mine)"
          strokeWidth={2.25}
          dot={{ r: 3.5, fill: 'var(--color-mine)', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          dataKey="dept"
          name="dept"
          type="linear"
          stroke="var(--color-dept)"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 3, fill: 'var(--color-dept)', strokeWidth: 0 }}
          activeDot={{ r: 4.5 }}
        />
        {showBrush && (
          <Brush
            key={data.length}
            dataKey="code"
            height={26}
            travellerWidth={8}
            stroke="var(--color-brand-300)"
            fill="var(--color-brand-50)"
          />
        )}
      </LineChart>
    </ChartContainer>
  )
}

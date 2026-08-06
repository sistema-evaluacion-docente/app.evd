import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { dimensionKey } from '@/lib/dimensionLabel'
import type { CourseDetail } from '../types'

interface TeacherGroupAverageChartProps {
  courses: CourseDetail[]
}

const chartConfig = {
  conocimiento: { label: 'Conocimiento', color: 'var(--color-chart-1)' },
  desempeno: { label: 'Desempeño', color: 'var(--color-chart-2)' },
  relaciones: { label: 'Relaciones', color: 'var(--color-chart-3)' },
  evaluacion: { label: 'Evaluación', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

/**
 * Grouped bar chart comparing the four dimension averages across each of a
 * teacher's evaluated groups.
 *
 * @example
 * <TeacherGroupAverageChart courses={teacher.courses} />
 */
export function TeacherGroupAverageChart({ courses }: TeacherGroupAverageChartProps) {
  const data = courses.map((course) => {
    const row: Record<string, string | number> = { group: groupLabel(course) }

    for (const dimension of course.dimensions) {
      row[dimensionKey(dimension.dimension)] = Number(dimension.average.toFixed(2))
    }

    return row
  })

  return (
    <ChartContainer config={chartConfig} className="max-h-64 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />

        <XAxis
          dataKey="group"
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={56}
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
        />

        <YAxis
          domain={[0, 5]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
        />

        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />

        {Object.keys(chartConfig).map((key) => (
          <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={2} />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

/** Compact axis label for a course group, e.g. "TALLER GB01". */
function groupLabel(course: CourseDetail) {
  return `${course.course_name.split(' ')[0].toUpperCase()} G${course.group_name}`
}

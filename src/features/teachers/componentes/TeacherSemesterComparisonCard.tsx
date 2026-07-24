import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useState } from 'react'

import { useGetTeacherHistory } from '@/features/teachers'
import useGetTeacherSemesterComparison from '../hooks/useGetTeacherSemesterComparison'

interface TeacherSemesterComparisonCardProps {
  teacherId: number
}

export default function TeacherSemesterComparisonCard({
  teacherId,
}: TeacherSemesterComparisonCardProps) {
  const { data: historyRes } = useGetTeacherHistory(teacherId)
  const history = historyRes?.data?.history ?? []

  const [currentSemester, setCurrentSemester] = useState<string>('')
  const [oldSemester, setOldSemester] = useState<string>('')

  const { data, isLoading } = useGetTeacherSemesterComparison({
    teacher_id: teacherId,
    current_semester: Number(currentSemester),
    old_semester: Number(oldSemester),
  })

  const comparison = data?.data

  const periodOptions = history.map((h) => ({
    value: String(h.evaluation_id),
    label: `${h.period_code} — ${h.period_name}`,
  }))

  return (
    <Card className="animate-fade-in p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-semibold">Comparación entre Semestres</h2>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={currentSemester}
            onValueChange={(value) => (value ? setCurrentSemester(value) : null)}
          >
            <SelectTrigger className="w-full max-w-48">
              <span>
                {currentSemester
                  ? periodOptions.find((o) => o.value === currentSemester)?.label
                  : 'Semestre actual'}
              </span>
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={oldSemester}
            onValueChange={(value) => (value ? setOldSemester(value) : null)}
          >
            <SelectTrigger className="w-full max-w-48">
              <span>
                {oldSemester
                  ? periodOptions.find((o) => o.value === oldSemester)?.label
                  : 'Semestre anterior'}
              </span>
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!currentSemester || !oldSemester ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Selecciona ambos periodos para comparar.
        </p>
      ) : isLoading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : comparison ? (
        <div className="mt-5 space-y-6">
          <OverallComparison
            current={comparison.current_overall_average}
            old={comparison.old_overall_average}
            delta={comparison.average_difference}
            currentCode={comparison.current_semester}
            oldCode={comparison.old_semester}
            currentGroups={comparison.current_group_count}
            oldGroups={comparison.old_group_count}
            currentRespondents={comparison.current_respondent_count}
            oldRespondents={comparison.old_respondent_count}
          />

          {(comparison.dimensions?.length ?? 0) > 0 && (
            <DimensionComparison dimensions={comparison.dimensions ?? []} />
          )}

          {(comparison.current_courses?.length ?? 0) > 0 && (
            <CourseComparison
              courses={comparison.current_courses ?? []}
              title={`Materias — ${comparison.current_semester}`}
            />
          )}

          {(comparison.old_courses?.length ?? 0) > 0 && (
            <CourseComparison
              courses={comparison.old_courses ?? []}
              title={`Materias — ${comparison.old_semester}`}
            />
          )}
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          Sin datos de comparación para los periodos seleccionados.
        </p>
      )}
    </Card>
  )
}

function OverallComparison({
  current,
  old,
  delta,
  currentCode,
  oldCode,
  currentGroups,
  oldGroups,
  currentRespondents,
  oldRespondents,
}: {
  current: number
  old: number
  delta: number
  currentCode: string
  oldCode: string
  currentGroups: number
  oldGroups: number
  currentRespondents: number
  oldRespondents: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
          {oldCode}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{old.toFixed(2)}</p>
        <p className="text-muted-foreground text-xs">
          {oldGroups} grupos · {oldRespondents} respuestas
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border p-4">
        <DeltaIndicator delta={delta} size="lg" />
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
          {currentCode}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{current.toFixed(2)}</p>
        <p className="text-muted-foreground text-xs">
          {currentGroups} grupos · {currentRespondents} respuestas
        </p>
      </div>
    </div>
  )
}

function DimensionComparison({
  dimensions,
}: {
  dimensions: {
    dimension: string
    current_average: number
    old_average: number
    difference: number
  }[]
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Dimensiones</h3>
      <ul className="divide-y rounded-lg border">
        {dimensions.map((dim) => (
          <li key={dim.dimension} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">{dim.dimension}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1 tabular-nums">
                <span className="text-muted-foreground text-xs">{dim.old_average.toFixed(2)}</span>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="text-sm font-semibold">{dim.current_average.toFixed(2)}</span>
              </div>
              <DeltaIndicator delta={dim.difference} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CourseComparison({
  courses,
  title,
}: {
  courses: {
    course_name: string
    group_name: string
    overall_average: number
    respondent_count: number
  }[]
  title: string
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="divide-y rounded-lg border">
        {courses.map((course) => (
          <li
            key={`${course.course_name}-${course.group_name}`}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{course.course_name}</span>
              <span className="text-muted-foreground block text-xs">
                Grupo {course.group_name} · {course.respondent_count} respuestas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">
                {course.overall_average.toFixed(2)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeltaIndicator({ delta, size = 'sm' }: { delta: number; size?: 'sm' | 'lg' }) {
  const isAbove = delta > 0.005
  const isBelow = delta < -0.005
  const Icon = isAbove ? ArrowUp : isBelow ? ArrowDown : Minus
  const colorClass = isAbove ? 'text-emerald-600' : isBelow ? 'text-red-600' : 'text-amber-600'
  const iconSize = size === 'lg' ? 20 : 13
  const textClass = size === 'lg' ? 'text-xl' : 'text-[13px]'

  return (
    <div
      className={cn('flex items-center gap-0.5 font-semibold tabular-nums', colorClass, textClass)}
    >
      <Icon size={iconSize} />
      {Math.abs(delta).toFixed(2)}
    </div>
  )
}

import { ChevronRight } from 'lucide-react'

import { ScoreLegend } from '@/components/common/ScoreLegend'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { dimensionColor } from '@/lib/dimensionLabel'
import { getScoreToneClass } from '@/lib/scoreTone'
import { useGetTeacherMatrix } from '../api'
import type { DimensionDetail } from '../types'

export interface TeacherQuestionMatrixProps {
  /** Teacher whose matrix is fetched. The query stays idle until it is set. */
  teacherId?: number
  /** Evaluation the matrix belongs to. The query stays idle until it is set. */
  evaluationId?: number
  /** Period-level dimensions (`TeacherDetail.dimensions`) — source of each question's text, dimension, and row order, already loaded by the caller. */
  dimensions: DimensionDetail[]
  className?: string
}

interface QuestionRow {
  code: string
  text: string
}

interface QuestionGroup {
  /** `undefined` for the fallback group of questions not found in `dimensions`. */
  dimension: string | undefined
  rows: QuestionRow[]
}

/**
 * Groups the matrix's question codes by pedagogical dimension, in the same
 * order as `dimensions` — so the color/name shown once per group (instead of
 * repeated per row) still tells the reader what each row belongs to, without
 * a separate legend. Codes present in the matrix but not found in any
 * dimension (shouldn't normally happen — defensive) land in a trailing
 * unlabeled group instead of silently disappearing.
 */
function groupQuestionsByDimension(
  codes: string[],
  dimensions: DimensionDetail[],
): QuestionGroup[] {
  const remaining = new Set(codes)
  const groups: QuestionGroup[] = []

  for (const dimension of dimensions) {
    const rows = dimension.questions
      .filter((question) => remaining.has(question.code))
      .map((question) => ({ code: question.code, text: question.text }))

    if (rows.length > 0) {
      groups.push({ dimension: dimension.dimension, rows })
      for (const row of rows) remaining.delete(row.code)
    }
  }

  if (remaining.size > 0) {
    groups.push({
      dimension: undefined,
      rows: codes.filter((code) => remaining.has(code)).map((code) => ({ code, text: code })),
    })
  }

  return groups
}

/**
 * Per-question breakdown of a teacher's own evaluation for one period: one
 * row per question, grouped by pedagogical dimension (a colored, full-name
 * header per group instead of a color dot repeated on every row — reads the
 * same as `DimensionCard`'s header elsewhere in the app, and avoids a
 * separate legend disconnected from the rows it explains), one column per
 * course taught that period, plus a trailing "Promedio" row/column — so a
 * teacher can spot exactly which question is pulling a course down, not just
 * which dimension. The matrix endpoint doesn't send question text, so it's
 * cross-referenced from `dimensions` (already loaded by the caller from
 * `TeacherDetail`, the same fixed question set across every course).
 *
 * @example
 * <TeacherQuestionMatrix teacherId={12} evaluationId={5} dimensions={teacher.dimensions} />
 */
export function TeacherQuestionMatrix({
  teacherId,
  evaluationId,
  dimensions,
  className,
}: TeacherQuestionMatrixProps) {
  const { data, isPending } = useGetTeacherMatrix({ teacherId, evaluationId })

  const isIdle = teacherId == null || evaluationId == null

  if (isIdle) return null

  const matrix = data?.data
  const courses = matrix?.courses ?? []

  const codes = Object.keys(matrix?.column_averages ?? {}).sort()
  const groups = groupQuestionsByDimension(codes, dimensions)

  const overallOfOverall =
    courses.length > 0
      ? courses.reduce((sum, course) => sum + course.overall_average, 0) / courses.length
      : undefined

  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Detalle por pregunta
        </h2>

        <ScoreLegend />
      </div>

      <div className="border-border bg-background rounded-md border">
        {isPending ? (
          <div className="flex items-center gap-1.5 px-5 py-3">
            <Skeleton className="size-3.5 shrink-0 rounded-sm" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground px-6 py-6 text-center text-sm">
            No hay materias con datos para este periodo.
          </p>
        ) : (
          <Collapsible>
            <CollapsibleTrigger className="cursor-pointer text-muted-foreground hover:bg-muted/40 group flex w-full items-center gap-1.5 px-5 py-3 text-left text-sm font-medium transition-colors">
              <ChevronRight
                aria-hidden="true"
                className="size-3.5 shrink-0 transition-transform group-data-panel-open:rotate-90"
              />
              Ver preguntas ({codes.length})
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="overflow-x-auto px-5 pb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-border text-muted-foreground border-b text-left">
                      <th scope="col" className="py-2 pr-2 font-medium">
                        N°
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Indicador
                      </th>

                      {courses.map((course) => (
                        <th
                          key={course.course_name}
                          scope="col"
                          className="max-w-32 min-w-24 px-2 py-2 text-center font-medium whitespace-normal"
                        >
                          {course.course_name}
                        </th>
                      ))}

                      <th scope="col" className="px-2 py-2 text-center font-medium">
                        Promedio
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-border divide-y">
                    {groups.map((group) => (
                      <QuestionGroupRows
                        key={group.dimension ?? '__ungrouped__'}
                        group={group}
                        courses={courses}
                        columnAverages={matrix?.column_averages}
                        columnCount={courses.length + 3}
                      />
                    ))}

                    <tr className="border-border border-t font-medium">
                      <td className="py-2 pr-2" colSpan={2}>
                        Promedio
                      </td>

                      {courses.map((course) => (
                        <td
                          key={course.course_name}
                          className={`px-2 py-2 text-center tabular-nums ${getScoreToneClass(course.overall_average)}`}
                        >
                          {course.overall_average.toFixed(2)}
                        </td>
                      ))}

                      <td className="px-2 py-2 text-center tabular-nums">
                        {overallOfOverall != null ? overallOfOverall.toFixed(2) : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </section>
  )
}

function QuestionGroupRows({
  group,
  courses,
  columnAverages,
  columnCount,
}: {
  group: QuestionGroup
  courses: { course_name: string; question_averages: Record<string, number> }[]
  columnAverages: Record<string, number> | undefined
  columnCount: number
}) {
  return (
    <>
      <tr className="bg-muted/40">
        <td colSpan={columnCount} className="px-2 py-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            {group.dimension && (
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: dimensionColor(group.dimension) }}
              />
            )}
            {group.dimension ?? 'Otras preguntas'}
          </span>
        </td>
      </tr>

      {group.rows.map((row) => (
        <tr key={row.code}>
          <td className="py-2 pr-2 tabular-nums">{row.code}</td>
          <td className="py-2 pr-3">{row.text}</td>

          {courses.map((course) => {
            const value = course.question_averages[row.code]

            return (
              <td
                key={course.course_name}
                className={`px-2 py-2 text-center tabular-nums ${value != null ? getScoreToneClass(value) : ''}`}
              >
                {value != null ? value.toFixed(2) : '—'}
              </td>
            )
          })}

          <td className="px-2 py-2 text-center font-medium tabular-nums">
            {columnAverages?.[row.code]?.toFixed(2) ?? '—'}
          </td>
        </tr>
      ))}
    </>
  )
}

import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link, useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PeriodSelect, type PeriodSelectOption } from '@/components/common/PeriodSelect'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AI_STATUS_DISPLAY, type AiStatus } from '@/features/evaluations'
import {
  CommentsPanel,
  CourseDimensionBreakdown,
  useGetTeacherComments,
  useGetTeacherDetail,
} from '@/features/teachers'
import { useAuthStore } from '@/features/auth'
import { dimensionColor } from '@/lib/dimensionLabel'
import { cn } from '@/lib/utils'
import { CourseAverageTrend } from '../components'
import { courseHref } from '../config'
import { useGetTeacherCourseHistory } from '../api'

/**
 * Detail page for a single subject ("materia") within one of the
 * authenticated teacher's periods, reached from the "Materias" sidebar
 * submenu or the "Ver detalle" link on a course row. Shows the dimension
 * breakdown, historical comparison and comments scoped to just this course +
 * group. The comparison baseline is picked by the user from every period
 * this specific course was taught (not just the immediately previous one).
 * Route: `/periodos/:period/materias/:courseCode/:groupName`.
 */
export default function PeriodCourseDetailPage() {
  const [, params] = useRoute('/periodos/:period/materias/:courseCode/:groupName')
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined

  const period = params?.period ? decodeURIComponent(params.period) : undefined
  const courseCode = params?.courseCode ? decodeURIComponent(params.courseCode) : undefined
  const groupName = params?.groupName ? decodeURIComponent(params.groupName) : undefined

  const { data, isLoading } = useGetTeacherDetail({ teacherId, periodName: period })
  const teacher = data?.data
  const periodCourses = teacher?.courses ?? []

  const courseIndex = periodCourses.findIndex(
    (item) => item.course_code === courseCode && item.group_name === groupName,
  )
  const course = courseIndex >= 0 ? periodCourses[courseIndex] : undefined
  const prevCourseInPeriod = courseIndex > 0 ? periodCourses[courseIndex - 1] : undefined
  const nextCourseInPeriod =
    courseIndex >= 0 && courseIndex < periodCourses.length - 1
      ? periodCourses[courseIndex + 1]
      : undefined

  const { data: historyData } = useGetTeacherCourseHistory({ teacherId, courseCode, limit: 12 })
  const comparisonOptions = (historyData?.data.items ?? []).filter(
    (item) => item.period_code !== period,
  )
  const [comparisonPeriodId, setComparisonPeriodId] = useState<number>()
  const selectedComparison =
    comparisonOptions.find((item) => item.academic_period_id === comparisonPeriodId) ??
    comparisonOptions[0]

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    error: commentsError,
  } = useGetTeacherComments({
    evaluationId: teacher?.evaluation_id,
    teacherId,
  })
  const courseComments = commentsData?.data.courses.filter(
    (item) => item.course_code === courseCode && item.group_name === groupName,
  )
  const aiStatus: AiStatus | null | undefined = commentsData?.data.ai_status
  const aiStatusConfig = aiStatus ? AI_STATUS_DISPLAY[aiStatus] : undefined
  const showAiPendingNotice = aiStatus === 'PENDING' || aiStatus === 'ANALYZING'

  const backHref = period ? `/periodos/${encodeURIComponent(period)}` : '/periodos'

  if (isLoading) {
    return (
      <>
        <BackButton href={backHref} label="Volver al periodo" className="mb-4" />
        <p className="text-muted-foreground py-10 text-center text-sm">Cargando…</p>
      </>
    )
  }

  if (!course) {
    return (
      <>
        <BackButton href={backHref} label="Volver al periodo" className="mb-4" />
        <p className="text-muted-foreground py-10 text-center text-sm">
          No se encontró información para esta materia en el periodo indicado.
        </p>
      </>
    )
  }

  const dimensionRanking = [...course.dimensions].sort((a, b) => b.average - a.average)

  const dimensionDeltas = selectedComparison
    ? course.dimensions
        .map((dimension) => {
          const previous = selectedComparison.dimensions.find(
            (item) => item.dimension === dimension.dimension,
          )
          return previous?.average != null
            ? { dimension: dimension.dimension, delta: dimension.average - previous.average }
            : null
        })
        .filter((item): item is { dimension: string; delta: number } => item != null)
    : []

  const bestMover = dimensionDeltas.reduce<{ dimension: string; delta: number } | null>(
    (best, current) => (best == null || current.delta > best.delta ? current : best),
    null,
  )
  const worstMover = dimensionDeltas.reduce<{ dimension: string; delta: number } | null>(
    (worst, current) => (worst == null || current.delta < worst.delta ? current : worst),
    null,
  )
  const showBestMover = bestMover != null && bestMover.delta > 0
  const showWorstMover =
    worstMover != null && worstMover.delta < 0 && worstMover.dimension !== bestMover?.dimension

  const comparisonSelectOptions: PeriodSelectOption[] = comparisonOptions.map((item) => ({
    id: item.academic_period_id,
    name: item.period_name,
    code: item.period_code,
  }))

  const periodsTaughtCount = comparisonOptions.length + 1

  return (
    <div className="space-y-6">
      <BackButton href={backHref} label="Volver al periodo" className="mb-4" />

      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.course_name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Grupo {course.group_name} · {period} · {course.respondent_count} estudiantes
          respondieron
        </p>
      </div>

      {(prevCourseInPeriod || nextCourseInPeriod) && (
        <nav
          aria-label="Materias del periodo"
          className="border-border flex items-center justify-between gap-3 border-y py-1.5"
        >
          {prevCourseInPeriod ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto min-w-0 gap-1.5 px-2 py-1"
              render={
                <Link
                  href={courseHref(
                    period ?? '',
                    prevCourseInPeriod.course_code,
                    prevCourseInPeriod.group_name,
                  )}
                />
              }
            >
              <ChevronLeft className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="shrink-0 text-[11px] font-medium tracking-wide uppercase">
                  Materia anterior
                </span>
                <span className="truncate text-xs normal-case opacity-80">
                  {prevCourseInPeriod.course_name}
                </span>
              </span>
            </Button>
          ) : (
            <span />
          )}

          {nextCourseInPeriod ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto min-w-0 gap-1.5 px-2 py-1"
              render={
                <Link
                  href={courseHref(
                    period ?? '',
                    nextCourseInPeriod.course_code,
                    nextCourseInPeriod.group_name,
                  )}
                />
              }
            >
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate text-xs normal-case opacity-80">
                  {nextCourseInPeriod.course_name}
                </span>
                <span className="shrink-0 text-[11px] font-medium tracking-wide uppercase">
                  Materia siguiente
                </span>
              </span>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}

      <div className="flex flex-wrap items-stretch gap-6">
        <div className="border-border bg-background min-w-0 flex-1 rounded-md border px-6 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Promedio en esta asignatura
            </p>

            <span className="text-muted-foreground text-xs">
              Ha dictado esta materia en:{' '}
              <span className="text-foreground text-base font-bold">
                {periodsTaughtCount} {periodsTaughtCount === 1 ? 'periodo' : 'periodos'}
              </span>
            </span>
          </div>

          <ScoreBadge
            size="5xl"
            showMax
            value={course.overall_average}
            previousValue={selectedComparison?.overall_average ?? undefined}
            previousLabel={selectedComparison?.period_name}
            className="mt-1"
          />

          {comparisonSelectOptions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs">
                Comparar la misma materia respecto al periodo:
              </span>

              <PeriodSelect
                options={comparisonSelectOptions}
                value={selectedComparison?.academic_period_id}
                onValueChange={setComparisonPeriodId}
                size="sm"
                ariaLabel="Periodo de comparación"
              />
            </div>
          )}

          {(showBestMover || showWorstMover) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {showBestMover && bestMover && (
                <Badge className="gap-1 bg-emerald-50 text-emerald-700">
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                  Mayor mejora: {bestMover.dimension} (+{bestMover.delta.toFixed(2)})
                </Badge>
              )}

              {showWorstMover && worstMover && (
                <Badge className="gap-1 bg-red-50 text-red-700">
                  <TrendingDown className="size-3.5" aria-hidden="true" />
                  Requiere atención: {worstMover.dimension} ({worstMover.delta.toFixed(2)})
                </Badge>
              )}
            </div>
          )}
        </div>

        {dimensionRanking.length > 0 && (
          <div className="border-border bg-background flex w-full shrink-0 flex-col rounded-md border px-5 py-5 sm:w-80">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Ranking de dimensiones
            </p>

            <ol className="flex flex-1 flex-col justify-center space-y-3">
              {dimensionRanking.map((dimension, index) => {
                const isBest = index === 0
                const isWorst = index === dimensionRanking.length - 1 && dimensionRanking.length > 1

                return (
                  <li key={dimension.dimension} className="flex items-center gap-2.5 text-sm">
                    <span className="text-muted-foreground w-4 shrink-0 tabular-nums">
                      {index + 1}
                    </span>

                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: dimensionColor(dimension.dimension) }}
                    />

                    <span className="min-w-0 flex-1 leading-snug wrap-break-word">
                      {dimension.dimension}
                    </span>

                    <span
                      className={cn(
                        'num shrink-0 text-base font-bold tabular-nums',
                        isBest && 'text-green-600',
                        isWorst && 'text-red-600',
                      )}
                    >
                      {dimension.average.toFixed(2)}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>

      <section className="border-border bg-background rounded-md border">
        <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
          Evolución en esta asignatura
        </h2>

        <div className="px-6 py-4">
          <CourseAverageTrend courseCode={courseCode ?? ''} teacherId={teacherId} title={null} />
        </div>
      </section>

      <section className="border-border bg-background rounded-md border">
        <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
          {selectedComparison
            ? `Dimensiones pedagógicas comparadas con ${selectedComparison.period_name}`
            : 'Dimensiones pedagógicas'}
        </h2>

        <CourseDimensionBreakdown
          course={course}
          previousCourse={selectedComparison}
          previousLabel={selectedComparison?.period_name}
          className="px-6"
        />
      </section>

      {showAiPendingNotice && aiStatusConfig && (
        <div className="border-border bg-muted/30 flex flex-wrap items-center gap-2 rounded-md border px-4 py-3 text-sm">
          <Badge className={aiStatusConfig.className}>{aiStatusConfig.label}</Badge>
          <span className="text-muted-foreground">
            La clasificación por riesgo y categoría de estos comentarios aparecerá cuando el
            análisis con IA termine.
          </span>
        </div>
      )}

      <CommentsPanel
        courses={courseComments}
        isLoading={isCommentsLoading}
        error={commentsError ? commentsError.message : null}
        title="Comentarios de los estudiantes"
        emptyMessage="Todavía no hay comentarios registrados para esta materia."
      />
    </div>
  )
}

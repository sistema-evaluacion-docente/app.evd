import { ChevronUp } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { GenerateReportPdfButton } from '@/components/common/GenerateReportPdfButton'
import { MoverBadge } from '@/components/common/MoverBadge'
import { PdfChartImage } from '@/components/common/pdf/PdfChartImage'
import { PdfCommentList } from '@/components/common/pdf/PdfCommentList'
import { PdfFactGrid } from '@/components/common/pdf/PdfFactGrid'
import { PdfPage } from '@/components/common/pdf/PdfPage'
import { PdfSection } from '@/components/common/pdf/PdfSection'
import { PdfTable } from '@/components/common/pdf/PdfTable'
import { PeriodSelect, type PeriodSelectOption } from '@/components/common/PeriodSelect'
import CourseTeacherDetailSkeleton from '@/components/skeletons/CourseTeacherDetailSkeleton'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreLegend } from '@/components/common/ScoreLegend'
import { TransitionLink } from '@/components/common/TransitionLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { AI_STATUS_DISPLAY, type AiStatus } from '@/features/evaluations'
import { CATEGORIES, categoryLabel, UNCATEGORIZED } from '@/lib/categoryLabel'
import { dimensionColor } from '@/lib/dimensionLabel'
import { formatPdfAverage } from '@/lib/pdf/formatPdfAverage'
import { pdfColors, pdfDimensionColors, pdfRiskColor } from '@/lib/pdf/pdfColors'
import { getScoreToneClass } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'
import { useGetTeacherComments, useGetTeacherCourseHistory, useGetTeacherDetail } from '../api'
import { CommentsPanel } from './CommentsPanel'
import { CourseAverageTrend } from './CourseAverageTrend'
import { CourseDimensionBreakdown } from './CourseDimensionBreakdown'

const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

export interface CourseTeacherDetailProps {
  teacherId: number
  courseCode: string
  groupName: string
  /** Academic period the course and its comparison are anchored to. */
  period: string
  /**
   * Shows the teacher's name and avatar above the title, and a "Descargar
   * reporte" button — for a viewer who isn't the teacher themself (e.g. a
   * director). Defaults to `false`.
   */
  showTeacherIdentity?: boolean
  className?: string
}

/**
 * Full report of one teacher's results in a single subject ("materia") for
 * one period: average with a user-picked comparison period, a dimension
 * ranking, the full dimension/question breakdown, comments, and the
 * subject's evolution across every period the teacher taught it. Reused by
 * the teacher's own view of their own materia and a director's read of any
 * teacher's — only the surrounding page (back link, navigation, identity
 * header) differs between the two.
 *
 * @example
 * <CourseTeacherDetail teacherId={12} courseCode="SIS101" groupName="A" period="2025-1" />
 *
 * @example
 * <CourseTeacherDetail
 *   teacherId={teacher.teacher_id}
 *   courseCode={course.course_code}
 *   groupName={course.group_name}
 *   period={period}
 *   showTeacherIdentity
 * />
 */
export function CourseTeacherDetail({
  teacherId,
  courseCode,
  groupName,
  period,
  showTeacherIdentity = false,
  className,
}: CourseTeacherDetailProps) {
  const comparisonToggleId = useId()
  const trendChartRef = useRef<HTMLElement>(null)

  const { data, isLoading } = useGetTeacherDetail({ teacherId, periodName: period })
  const teacher = data?.data
  const course = teacher?.courses.find(
    (item) => item.course_code === courseCode && item.group_name === groupName,
  )

  const { data: historyData, isLoading: isHistoryLoading } = useGetTeacherCourseHistory({
    teacherId,
    courseCode,
    limit: 12,
  })
  const comparisonOptions = (historyData?.data.items ?? []).filter(
    (item) => item.period_code !== period,
  )
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonPeriodId, setComparisonPeriodId] = useState<number>()
  const selectedComparison = comparisonEnabled
    ? (comparisonOptions.find((item) => item.academic_period_id === comparisonPeriodId) ??
      comparisonOptions[0])
    : undefined

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

  if (isLoading) {
    return (
      <CourseTeacherDetailSkeleton
        withTeacherIdentity={showTeacherIdentity}
        className={className}
      />
    )
  }

  if (!course) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        No se encontró información para esta materia en el periodo indicado.
      </p>
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

  // Full comment text goes in the PDF report here — unlike the teacher's own
  // (multi-course) report, this one is scoped to a single subject, so the
  // volume stays small enough to include verbatim, not just counts.
  const flatCourseComments = courseComments?.flatMap((item) => item.comments) ?? []
  const commentRiskCounts = flatCourseComments.reduce(
    (counts, comment) => {
      const key = comment.risk_level?.name.toUpperCase()
      if (key === 'BAJO' || key === 'MEDIO' || key === 'ALTO') counts[key] += 1
      return counts
    },
    { BAJO: 0, MEDIO: 0, ALTO: 0 },
  )
  const commentCategoryCounts = flatCourseComments.reduce<Record<string, number>>(
    (counts, comment) => {
      for (const category of comment.pedagogical_categories) {
        counts[category.name] = (counts[category.name] ?? 0) + 1
      }
      return counts
    },
    {},
  )

  const reportFileName = `Reporte-Materia-${course.course_name.replace(/\s+/g, '-')}-${period}`

  const pdfReportButton = teacher && (
    <GenerateReportPdfButton
      label="Descargar reporte de la materia"
      fileName={reportFileName}
      className="hover:border-primary hover:bg-primary hover:text-primary-foreground"
      chartRefs={{ trend: trendChartRef }}
      buildDocument={(images) => (
        <PdfPage title="Reporte de la materia" subtitle={`${teacher.name} · Periodo: ${period}`}>
          <PdfFactGrid
            facts={[
              { label: 'Materia', value: course.course_name },
              { label: 'Código', value: course.course_code },
              { label: 'Grupo', value: course.group_name },
            ]}
            columns={3}
          />

          <PdfFactGrid
            facts={[
              { label: 'Docente', value: teacher.name },
              { label: 'Periodo', value: period },
              {
                label: selectedComparison
                  ? `Promedio actual (${period})`
                  : 'Promedio en esta asignatura',
                value: formatPdfAverage(course.overall_average),
              },
              ...(selectedComparison
                ? [
                    {
                      label: `Promedio comparación (${selectedComparison.period_name})`,
                      value: formatPdfAverage(selectedComparison.overall_average),
                    },
                  ]
                : []),
            ]}
            columns={selectedComparison ? 4 : 3}
          />

          {(showBestMover || showWorstMover) && (
            <PdfFactGrid
              facts={[
                ...(showBestMover && bestMover
                  ? [
                      {
                        label: 'Mayor mejora',
                        value: `${bestMover.dimension} (+${bestMover.delta.toFixed(2)})`,
                        color: pdfColors.riskLow,
                      },
                    ]
                  : []),
                ...(showWorstMover && worstMover
                  ? [
                      {
                        label: 'Requiere atención',
                        value: `${worstMover.dimension} (${worstMover.delta.toFixed(2)})`,
                        color: pdfColors.riskHigh,
                      },
                    ]
                  : []),
              ]}
              columns={2}
            />
          )}

          <PdfSection title="Promedio por dimensión">
            <PdfFactGrid
              facts={dimensionRanking.map((dimension) => ({
                label: dimension.dimension,
                value: formatPdfAverage(dimension.average),
                color: pdfDimensionColors[dimension.dimension],
              }))}
              columns={dimensionRanking.length || 1}
            />
          </PdfSection>

          {course.dimensions.map((dimension) => {
            const previousDimension = selectedComparison?.dimensions.find(
              (item) => item.dimension === dimension.dimension,
            )

            return (
              <PdfSection
                key={dimension.dimension}
                title={`${dimension.dimension} — Promedio ${formatPdfAverage(dimension.average)}`}
                noBreak={false}
              >
                <PdfTable
                  columns={
                    previousDimension
                      ? [
                          { header: 'Pregunta', width: '50%' },
                          { header: `Actual (${period})`, width: '25%', align: 'center' },
                          {
                            header: `Comparación (${selectedComparison?.period_name})`,
                            width: '25%',
                            align: 'center',
                          },
                        ]
                      : [
                          { header: 'Pregunta', width: '78%' },
                          { header: 'Promedio', width: '22%', align: 'center' },
                        ]
                  }
                  rows={dimension.questions.map((question) => {
                    const previousQuestion = previousDimension?.questions.find(
                      (item) => item.code === question.code,
                    )
                    const row = [
                      `${question.code}. ${question.text}`,
                      formatPdfAverage(question.score),
                    ]
                    if (previousDimension) row.push(formatPdfAverage(previousQuestion?.score))
                    return row
                  })}
                />
              </PdfSection>
            )
          })}

          <PdfSection title="Comentarios de los estudiantes" noBreak={false}>
            <PdfFactGrid
              facts={[
                {
                  label: 'Riesgo bajo',
                  value: String(commentRiskCounts.BAJO),
                  color: pdfColors.riskLow,
                },
                {
                  label: 'Riesgo medio',
                  value: String(commentRiskCounts.MEDIO),
                  color: pdfColors.riskMedium,
                },
                {
                  label: 'Riesgo alto',
                  value: String(commentRiskCounts.ALTO),
                  color: pdfColors.riskHigh,
                },
              ]}
              columns={3}
            />

            <PdfFactGrid
              facts={ANALYZABLE_CATEGORIES.map((category) => ({
                label: categoryLabel(category.code),
                value: String(commentCategoryCounts[category.code] ?? 0),
              }))}
              columns={4}
            />

            <PdfCommentList
              comments={flatCourseComments.map((comment) => ({
                text: comment.original_text,
                riskLabel: comment.risk_level?.name,
                riskColor: pdfRiskColor(comment.risk_level?.name),
                categoryLabels: comment.pedagogical_categories.map((category) =>
                  categoryLabel(category.name),
                ),
              }))}
              emptyMessage="Todavía no hay comentarios registrados para esta materia."
            />
          </PdfSection>

          <PdfSection title={`Evolución de esta asignatura: ${course.course_name}`}>
            <PdfChartImage src={images.trend} />
          </PdfSection>
        </PdfPage>
      )}
    />
  )

  return (
    <div className={cn('space-y-6', className)}>
      <div
        id="course-teacher-detail-header"
        className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.course_name}</h1>
            <Badge className="shrink-0">{period}</Badge>
          </div>

          <p className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm">
            <span className="num font-medium">{course.course_code}</span>
            <span aria-hidden="true">·</span>
            <span>Grupo {course.group_name}</span>
          </p>
        </div>

        {showTeacherIdentity && teacher && (
          <TransitionLink
            href={`/docentes/${teacher.teacher_id}?period=${encodeURIComponent(period)}`}
            className="group inline-flex w-fit shrink-0 items-center gap-3 lg:flex-row-reverse"
          >
            <Avatar className="size-12 shrink-0">
              <AvatarFallback className="uppercase">{teacher.name.at(0) ?? '?'}</AvatarFallback>
              <AvatarImage src={teacher.avatar_url} alt={teacher.name} />
            </Avatar>

            <div className="min-w-0 lg:text-right">
              <p className="group-hover:text-primary text-sm font-medium transition-colors">
                {teacher.name}
              </p>
              <p className="text-muted-foreground text-xs">{teacher.institutional_code}</p>
            </div>
          </TransitionLink>
        )}
      </div>

      {showTeacherIdentity && pdfReportButton && <div className="shrink-0">{pdfReportButton}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-border bg-background min-w-0 flex-1 rounded-md border px-6 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Promedio en esta asignatura
            </p>
          </div>

          <ScoreBadge
            size="5xl"
            showMax
            value={course.overall_average}
            previousValue={selectedComparison?.overall_average ?? undefined}
            previousLabel={selectedComparison?.period_name}
            className="mt-1"
          />

          {isHistoryLoading ? (
            <Skeleton className="mt-3 h-8 w-64" />
          ) : (
            comparisonSelectOptions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id={comparisonToggleId}
                    checked={comparisonEnabled}
                    onCheckedChange={(checked) => {
                      setComparisonEnabled(checked)
                      if (!checked) setComparisonPeriodId(undefined)
                    }}
                  />
                  <Label
                    htmlFor={comparisonToggleId}
                    className="text-muted-foreground text-sm font-normal"
                  >
                    Comparar con otro periodo
                  </Label>
                </div>

                {comparisonEnabled && (
                  <PeriodSelect
                    options={comparisonSelectOptions}
                    value={selectedComparison?.academic_period_id}
                    onValueChange={setComparisonPeriodId}
                    size="sm"
                    ariaLabel="Periodo de comparación"
                  />
                )}
              </div>
            )
          )}

          {isHistoryLoading ? (
            <Skeleton className="mt-4 h-5 w-48 rounded-full" />
          ) : (
            (showBestMover || showWorstMover) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {showBestMover && bestMover && (
                  <MoverBadge direction="up">
                    Mayor mejora: {bestMover.dimension} (+{bestMover.delta.toFixed(2)})
                  </MoverBadge>
                )}

                {showWorstMover && worstMover && (
                  <MoverBadge direction="down">
                    {worstMover.dimension} ({worstMover.delta.toFixed(2)})
                  </MoverBadge>
                )}
              </div>
            )
          )}
        </div>

        {dimensionRanking.length > 0 && (
          <div className="border-border bg-background flex w-full shrink-0 flex-col rounded-md border px-5 py-5">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Promedio por dimensión
            </p>

            <div className="flex flex-1 items-stretch gap-3">
              {/* Order axis: dimensions are sorted highest → lowest, top to
                  bottom — this arrow says so directly instead of numbering
                  each row 1st/2nd/3rd, which read as a competitive ranking
                  and broke down entirely on ties. */}
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                  Mayor
                </span>
                <ChevronUp
                  className="text-muted-foreground -mb-1.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className="bg-muted-foreground/30 w-0.5 flex-1 rounded-full"
                />
                <span className="text-muted-foreground mt-1 text-[10px] font-medium tracking-wide uppercase">
                  Menor
                </span>
              </div>

              <ol className="flex flex-1 flex-col justify-center space-y-3">
                {dimensionRanking.map((dimension) => (
                  <li key={dimension.dimension} className="flex items-center gap-2.5 text-sm">
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
                        getScoreToneClass(dimension.average),
                      )}
                    >
                      {dimension.average.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <ScoreLegend className="mt-4" />
          </div>
        )}
      </div>

      <section className="border-border bg-background rounded-md border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <h2 className="text-sm font-medium">
            {selectedComparison
              ? `Dimensiones pedagógicas comparadas con ${selectedComparison.period_name}`
              : 'Dimensiones pedagógicas'}
          </h2>

          <ScoreLegend />
        </div>

        <CourseDimensionBreakdown
          dimensions={course.dimensions}
          previous={selectedComparison?.dimensions}
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

      <section ref={trendChartRef} className="border-border bg-background rounded-md border">
        <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
          Evolución de esta asignatura: {course.course_name}
        </h2>

        <div className="px-6 py-4">
          <CourseAverageTrend courseCode={courseCode} teacherId={teacherId} title={null} />
        </div>
      </section>
    </div>
  )
}

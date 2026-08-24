import { useId, useRef, useState } from 'react'

import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { GenerateReportPdfButton } from '@/components/common/GenerateReportPdfButton'
import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { PdfChartImage } from '@/components/common/pdf/PdfChartImage'
import { PdfFactGrid } from '@/components/common/pdf/PdfFactGrid'
import { PdfPage } from '@/components/common/pdf/PdfPage'
import { PdfSection } from '@/components/common/pdf/PdfSection'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { useGetAcademicPeriods } from '@/features/periods'
import { useNavigate } from '@/hooks/useNavigate'
import { CATEGORIES, categoryLabel, UNCATEGORIZED } from '@/lib/categoryLabel'
import { formatPdfAverage } from '@/lib/pdf/formatPdfAverage'
import { pdfColors } from '@/lib/pdf/pdfColors'
import type { RiskLevelMeta } from '@/lib/riskLevel'
import { cn } from '@/lib/utils'
import { useGetDepartmentPeriodRangeStats } from '../api'
import { DepartmentCommentPeriodBreakdown } from './DepartmentCommentPeriodBreakdown'
import { DepartmentCommentsSummary } from './DepartmentCommentsSummary'
import { DepartmentDimensionsChart } from './DepartmentDimensionsChart'
import { DepartmentDimensionsPeriodComparison } from './DepartmentDimensionsPeriodComparison'
import { DepartmentStatsHero } from './DepartmentStatsHero'
// Materia/docente mover badges temporarily disabled — see the commented block
// below (search "MOVER BADGES DISABLED"). Re-add these imports when re-enabling:
//   import { TrendingDown, TrendingUp } from 'lucide-react'
//   import { useGetTeachers, type TeacherRecord } from '@/features/teachers'
//   import { findBestWorstMover, type MoverEntry } from '@/lib/bestWorstMover'
//   import { useGetDepartmentPeriodRangeSubjects } from '../api'
//   import type { DepartmentSubjectAverage } from '../types'

const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

export interface DepartmentPeriodRangeSummaryProps {
  /** How many trailing periods to preselect once "comparar un rango" is turned on. Defaults to 2. */
  defaultRangeSize?: number
  className?: string
}

/**
 * Full self-contained widget with the director's own department averages —
 * overall, per-dimension, per-period trend and comment breakdowns
 * (`GET /stats/departments/period-range`). Defaults to the single most
 * recent period, the common case; comparing a range of periods is an
 * explicit opt-in via a toggle, not the default view.
 *
 * @example
 * <DepartmentPeriodRangeSummary />
 *
 * @example
 * <DepartmentPeriodRangeSummary defaultRangeSize={4} />
 */
export function DepartmentPeriodRangeSummary({
  defaultRangeSize = 2,
  className,
}: DepartmentPeriodRangeSummaryProps) {
  const compareRangeId = useId()
  const navigate = useNavigate()
  const { data: periodsData, isPending: isPeriodsPending } = useGetAcademicPeriods()
  const periods = periodsData?.data ?? []
  const sortedPeriods = [...periods].sort((a, b) => a.code.localeCompare(b.code))

  // Until the user picks explicitly, default to the last `defaultRangeSize`
  // periods — derived from the loaded list rather than synced via an effect.
  const defaultEnd = sortedPeriods[sortedPeriods.length - 1]
  const defaultStart = sortedPeriods[Math.max(0, sortedPeriods.length - defaultRangeSize)]

  const [compareRange, setCompareRange] = useState(false)
  const [startPeriodId, setStartPeriodId] = useState<number | undefined>(undefined)
  const [endPeriodId, setEndPeriodId] = useState<number | undefined>(undefined)

  const commentsCardRef = useRef<HTMLDivElement>(null)
  const trendCardRef = useRef<HTMLElement>(null)
  const dimensionsCardRef = useRef<HTMLElement>(null)

  const effectiveEndId = endPeriodId ?? defaultEnd?.id
  // Outside "comparar un rango" mode, start always tracks end — there's only
  // ever one period selector on screen, so nothing can drift out of sync.
  const effectiveStartId = compareRange ? (startPeriodId ?? defaultStart?.id) : effectiveEndId

  const startPeriod = periods.find((period) => period.id === effectiveStartId)
  const endPeriod = periods.find((period) => period.id === effectiveEndId)

  const handleStartChange = (id: number) => {
    setStartPeriodId(id)

    const period = periods.find((p) => p.id === id)
    if (period && endPeriod && period.code > endPeriod.code) setEndPeriodId(id)
  }

  const handleEndChange = (id: number) => {
    setEndPeriodId(id)

    const period = periods.find((p) => p.id === id)
    if (period && compareRange && startPeriod && period.code < startPeriod.code) {
      setStartPeriodId(id)
    }
  }

  const { data, isPending, isFetching, error } = useGetDepartmentPeriodRangeStats({
    startPeriod: startPeriod?.code,
    endPeriod: endPeriod?.code,
  })

  // Comparing a genuine range switches the comments card to
  // `DepartmentCommentPeriodBreakdown`, which fetches its own per-period data.
  const rangeCompareActive =
    compareRange &&
    startPeriod !== undefined &&
    endPeriod !== undefined &&
    startPeriod !== endPeriod

  /* MOVER BADGES DISABLED — pending fix: for a single period, the "previous
     period" is picked purely by chronological code order, which can land on
     an academic period with no evaluation data at all, silently yielding no
     badges. Disabled for the university-server release; re-enable once that
     baseline-period selection is fixed. Uncomment this block and the
     matching imports above + JSX block below (search "MOVER BADGES
     DISABLED") together — nothing else in this file depends on it.

  // Baseline for the materia/docente mover badges: the range's start when
  // comparing a range, otherwise the period immediately before the single
  // selected one (chronologically, by code) — same "always the immediately
  // previous period" rule already used for the teacher's own summary.
  const currentMoverPeriod = endPeriod
  const previousMoverPeriod = rangeCompareActive
    ? startPeriod
    : sortedPeriods[sortedPeriods.findIndex((period) => period.id === currentMoverPeriod?.id) - 1]
  const moversActive =
    currentMoverPeriod !== undefined &&
    previousMoverPeriod !== undefined &&
    currentMoverPeriod !== previousMoverPeriod

  const { data: startSubjects, isPending: isStartSubjectsPending } =
    useGetDepartmentPeriodRangeSubjects({
      startPeriod: moversActive ? previousMoverPeriod?.code : undefined,
      endPeriod: moversActive ? previousMoverPeriod?.code : undefined,
      limit: 100,
    })
  const { data: endSubjects, isPending: isEndSubjectsPending } =
    useGetDepartmentPeriodRangeSubjects({
      startPeriod: moversActive ? currentMoverPeriod?.code : undefined,
      endPeriod: moversActive ? currentMoverPeriod?.code : undefined,
      limit: 100,
    })

  const { data: startTeachers, isPending: isStartTeachersPending } = useGetTeachers({
    academicPeriodId: moversActive ? previousMoverPeriod?.id : undefined,
    limit: 100,
  })
  const { data: endTeachers, isPending: isEndTeachersPending } = useGetTeachers({
    academicPeriodId: moversActive ? currentMoverPeriod?.id : undefined,
    limit: 100,
  })

  const isMoversPending =
    moversActive &&
    (isStartSubjectsPending ||
      isEndSubjectsPending ||
      isStartTeachersPending ||
      isEndTeachersPending)

  const startSubjectsByName = new Map(
    (startSubjects?.data ?? []).map((subject) => [subject.course_name, subject]),
  )
  const subjectMovers = (endSubjects?.data ?? [])
    .map((end) => {
      const start = startSubjectsByName.get(end.course_name)
      return start ? { item: end, delta: end.overall_average - start.overall_average } : null
    })
    .filter((entry): entry is MoverEntry<DepartmentSubjectAverage> => entry != null)
  const { best: bestSubjectMover, worst: worstSubjectMover } = findBestWorstMover(subjectMovers)
  const showBestSubject = bestSubjectMover != null && bestSubjectMover.delta > 0
  const showWorstSubject =
    worstSubjectMover != null &&
    worstSubjectMover.delta < 0 &&
    worstSubjectMover.item !== bestSubjectMover?.item

  const startTeachersById = new Map(
    (startTeachers?.data ?? []).map((teacher) => [teacher.id, teacher]),
  )
  const teacherMovers = (endTeachers?.data ?? [])
    .map((end) => {
      const start = startTeachersById.get(end.id)
      return start ? { item: end, delta: end.overall_average - start.overall_average } : null
    })
    .filter((entry): entry is MoverEntry<TeacherRecord> => entry != null)
  const { best: bestTeacherMover, worst: worstTeacherMover } = findBestWorstMover(teacherMovers)
  const showBestTeacher = bestTeacherMover != null && bestTeacherMover.delta > 0
  const showWorstTeacher =
    worstTeacherMover != null &&
    worstTeacherMover.delta < 0 &&
    worstTeacherMover.item !== bestTeacherMover?.item
  */

  if (!isPeriodsPending && sortedPeriods.length === 0) {
    return (
      <p className={cn('text-muted-foreground py-10 text-center text-sm', className)}>
        No existen periodos académicos para mostrar.
      </p>
    )
  }

  const periodLabel =
    compareRange && startPeriod && endPeriod && startPeriod !== endPeriod
      ? `${startPeriod.name} — ${endPeriod.name}`
      : (endPeriod?.name ?? '')

  const showTrendChart = compareRange && startPeriod !== endPeriod

  /**
   * Comments of one risk level, in the period the charts are showing — the
   * range's last one while comparing, since that's the period the risk
   * breakdown itself is drawn from.
   */
  const commentsHrefForRisk = (level: RiskLevelMeta) => {
    const params = new URLSearchParams({ riskLevel: String(level.id) })

    if (endPeriod?.name) params.set('period', endPeriod.name)

    return `/comentarios?${params.toString()}`
  }

  const departmentName = data?.data?.department_name
  const reportTitle = departmentName
    ? `Resumen del departamento (${departmentName})`
    : 'Resumen del departamento'
  const reportFileName = departmentName
    ? `Resumen-Departamento-${departmentName.replace(/\s+/g, '-')}`
    : undefined

  const stats = data?.data

  const generalFacts = stats
    ? [
        { label: 'Departamento', value: stats.department_name },
        { label: 'Promedio general', value: formatPdfAverage(stats.overall_average) },
        { label: 'Periodo evaluado', value: periodLabel || stats.start_period_code },
      ]
    : []

  const riskFacts = stats?.comments_risk_counts
    ? [
        {
          label: 'Comentarios de riesgo bajo',
          value: String(stats.comments_risk_counts.BAJO),
          color: pdfColors.riskLow,
        },
        {
          label: 'Comentarios de riesgo medio',
          value: String(stats.comments_risk_counts.MEDIO),
          color: pdfColors.riskMedium,
        },
        {
          label: 'Comentarios de riesgo alto',
          value: String(stats.comments_risk_counts.ALTO),
          color: pdfColors.riskHigh,
        },
      ]
    : []

  const categoryFacts = stats?.comments_pedagogical_category_counts
    ? ANALYZABLE_CATEGORIES.map((category) => ({
        label: categoryLabel(category.code),
        value: String(stats.comments_pedagogical_category_counts?.[category.code] ?? 0),
      }))
    : []

  return (
    <div className={cn('space-y-6', className)}>
      <PageTitle className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>Resumen del departamento</div>

        <div className="flex flex-wrap items-center gap-3 font-normal">
          <GenerateReportPdfButton
            label="Descargar reporte del departamento"
            fileName={reportFileName ?? 'Resumen-Departamento'}
            disabled={!stats}
            chartRefs={{
              comments: commentsCardRef,
              ...(showTrendChart ? { trend: trendCardRef } : {}),
              dimensions: dimensionsCardRef,
            }}
            buildDocument={(images) => (
              <PdfPage
                title={reportTitle}
                subtitle={periodLabel ? `Periodo: ${periodLabel}` : undefined}
              >
                <PdfFactGrid facts={generalFacts} columns={3} />
                {riskFacts.length > 0 && <PdfFactGrid facts={riskFacts} columns={3} />}
                {categoryFacts.length > 0 && <PdfFactGrid facts={categoryFacts} columns={4} />}

                <PdfSection title="Comentarios de la heteroevaluación">
                  <PdfChartImage src={images.comments} />
                </PdfSection>

                {showTrendChart && images.trend && (
                  <PdfSection title="Evolución del promedio por periodo">
                    <PdfChartImage src={images.trend} />
                  </PdfSection>
                )}

                <PdfSection
                  title={
                    rangeCompareActive
                      ? 'Promedios por dimensión pedagógica, por periodo'
                      : 'Promedios por dimensión pedagógica'
                  }
                >
                  <PdfChartImage src={images.dimensions} />
                </PdfSection>
              </PdfPage>
            )}
          />

          {compareRange ? (
            <>
              <PeriodSelect
                value={effectiveStartId}
                onValueChange={handleStartChange}
                placeholder="Periodo inicial"
                ariaLabel="Periodo inicial"
              />

              <span className="text-muted-foreground text-sm">hasta</span>

              <PeriodSelect
                value={effectiveEndId}
                onValueChange={handleEndChange}
                placeholder="Periodo final"
                ariaLabel="Periodo final"
              />
            </>
          ) : (
            <PeriodSelect
              value={effectiveEndId}
              onValueChange={handleEndChange}
              placeholder="Periodo"
              ariaLabel="Periodo"
            />
          )}

          {isFetching && <Spinner className="text-muted-foreground size-4" />}
        </div>
      </PageTitle>

      <p className="text-foreground text-sm font-bold">
        Tomado de: Evaluación docente generado por DIVISIST (División de Sistemas)
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Switch id={compareRangeId} checked={compareRange} onCheckedChange={setCompareRange} />
          <Label htmlFor={compareRangeId} className="text-muted-foreground text-sm font-normal">
            Comparar un rango de periodos
          </Label>
        </div>
      </div>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      )}

      {!isPending && data?.data && (
        <div
          className={cn(
            'space-y-6 transition-opacity',
            isFetching && 'pointer-events-none opacity-60',
          )}
        >
          <DepartmentStatsHero
            stats={data?.data}
            commentsHref={
              endPeriod ? `/comentarios?period=${encodeURIComponent(endPeriod.name)}` : undefined
            }
          />

          {/* MOVER BADGES DISABLED — see the matching commented block above
              (search "MOVER BADGES DISABLED") for why, and uncomment both
              together to re-enable.

          {moversActive &&
            (isMoversPending ||
              showBestSubject ||
              showWorstSubject ||
              showBestTeacher ||
              showWorstTeacher) && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">
                  {rangeCompareActive
                    ? `Comparando ${previousMoverPeriod?.name} con ${currentMoverPeriod?.name}`
                    : `Comparado con el periodo anterior (${previousMoverPeriod?.name})`}
                </p>

                {isMoversPending ? (
                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-9 w-56 rounded-full" />
                    <Skeleton className="h-9 w-56 rounded-full" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {showBestSubject && bestSubjectMover && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700">
                        <TrendingUp className="size-4.5" aria-hidden="true" />
                        Materia con mayor mejora: {bestSubjectMover.item.course_name} (+
                        {bestSubjectMover.delta.toFixed(2)})
                      </span>
                    )}

                    {showWorstSubject && worstSubjectMover && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700">
                        <TrendingDown className="size-4.5" aria-hidden="true" />
                        Materia que requiere atención: {worstSubjectMover.item.course_name} (
                        {worstSubjectMover.delta.toFixed(2)})
                      </span>
                    )}

                    {showBestTeacher && bestTeacherMover && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700">
                        <TrendingUp className="size-4.5" aria-hidden="true" />
                        Docente con mayor mejora: {bestTeacherMover.item.user.name} (+
                        {bestTeacherMover.delta.toFixed(2)})
                      </span>
                    )}

                    {showWorstTeacher && worstTeacherMover && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700">
                        <TrendingDown className="size-4.5" aria-hidden="true" />
                        Docente que requiere atención: {worstTeacherMover.item.user.name} (
                        {worstTeacherMover.delta.toFixed(2)})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          */}

          {(data?.data?.comments_risk_counts ||
            data?.data?.comments_pedagogical_category_counts) && (
            <div ref={commentsCardRef}>
              {rangeCompareActive ? (
                <DepartmentCommentPeriodBreakdown periods={data?.data?.periods ?? []} />
              ) : (
                <DepartmentCommentsSummary
                  riskCounts={data?.data?.comments_risk_counts}
                  categoryCounts={data?.data?.comments_pedagogical_category_counts}
                  onRiskLevelClick={(level) => {
                    const href = commentsHrefForRisk(level)
                    navigate(href)
                  }}
                />
              )}
            </div>
          )}

          {showTrendChart && (
            <section ref={trendCardRef} className="border-border bg-background rounded-md border">
              <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
                Evolución del promedio por periodo
              </h2>

              <div className="px-6 py-4">
                <AverageTrendChart
                  series={[
                    {
                      id: 'department',
                      label: 'Promedio del departamento',
                      data: data?.data.period_averages.map((period) => ({
                        x: period.academic_period_name || period.academic_period_code,
                        value: period.overall_average,
                      })),
                    },
                  ]}
                  referenceValue={data?.data?.overall_average}
                  referenceLabel="Promedio del rango"
                />
              </div>
            </section>
          )}

          <section
            ref={dimensionsCardRef}
            className="border-border bg-background rounded-md border"
          >
            <div className="border-border border-b px-6 py-4">
              <h2 className="text-muted-foreground text-sm font-medium">
                Promedios por dimensión pedagógica
              </h2>

              {rangeCompareActive && (
                <p className="text-muted-foreground/80 mt-0.5 text-xs">
                  Una barra por periodo en cada dimensión, del más antiguo al más reciente.
                </p>
              )}
            </div>

            <div className="px-6 py-4">
              {rangeCompareActive ? (
                <DepartmentDimensionsPeriodComparison
                  periods={data?.data?.periods ?? []}
                  referenceValue={data?.data?.overall_average}
                  referenceLabel="Promedio del rango"
                />
              ) : (
                <DepartmentDimensionsChart
                  dimensions={data?.data?.dimensions}
                  referenceValue={data?.data?.overall_average}
                  referenceLabel="Promedio general"
                />
              )}
            </div>
          </section>

          {/* Subjects table intentionally not shown here — belongs to the
              dedicated Materias flow, not the general summary. */}
        </div>
      )}

      {!isPending && !data?.data && !error && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No hay datos para el rango de periodos seleccionado.
        </p>
      )}
    </div>
  )
}

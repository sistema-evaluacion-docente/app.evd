import { useId, useRef, useState } from 'react'
import { useRoute, useSearchParams } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { GenerateReportPdfButton } from '@/components/common/GenerateReportPdfButton'
import { InlineError } from '@/components/common/InlineError'
import { PdfChartImage } from '@/components/common/pdf/PdfChartImage'
import { PdfFactGrid } from '@/components/common/pdf/PdfFactGrid'
import { PdfPage } from '@/components/common/pdf/PdfPage'
import { PdfSection } from '@/components/common/pdf/PdfSection'
import { PdfTable } from '@/components/common/pdf/PdfTable'
import { PeriodBanner } from '@/components/common/PeriodBanner'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useGetCourseTeachersComparison } from '@/features/stats'
import { CATEGORIES, categoryShortLabel, UNCATEGORIZED } from '@/lib/categoryLabel'
import { formatPdfAverage } from '@/lib/pdf/formatPdfAverage'
import { pdfColors } from '@/lib/pdf/pdfColors'
import {
  TeacherCommentsComparison,
  TeacherComparisonRanking,
  TeacherDimensionComparison,
} from '../components'
import { buildTeacherComparisonColorMap, comparisonEntryKey } from '../config'

const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)
function shortTeacherName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length <= 2 ? name : `${parts[0]} ${parts[1]}`
}

/**
 * Full page comparing every teacher who taught a course in a given period —
 * ranking, per-dimension breakdowns, and comment summaries — with a
 * downloadable PDF version of the same comparison.
 * Route: `/materias/:courseCode/comparar`
 *
 * The PDF button forces `TeacherDimensionComparison`'s list/chart toggle to
 * `'chart'` before capturing (via `beforeCapture`), waits a couple of frames
 * for it to render, snapshots each dimension's now-visible bar chart, then
 * restores whichever view the user had open — see `GenerateReportPdfButton`.
 */
export default function SubjectComparisonPage() {
  const [, params] = useRoute('/materias/:courseCode/comparar')
  const [searchParams] = useSearchParams()
  const includeCommentsId = useId()

  const courseCode = params?.courseCode ? decodeURIComponent(params.courseCode) : undefined
  const period = searchParams.get('period') ?? undefined
  const courseName = searchParams.get('name') ?? undefined

  const [includeComments, setIncludeComments] = useState(true)
  const [dimensionViewMode, setDimensionViewMode] = useState<'list' | 'chart'>('list')
  const dimensionChartNodes = useRef(new Map<string, HTMLElement>())
  function handleDimensionChartRef(dimensionName: string, node: HTMLElement | null) {
    if (node) dimensionChartNodes.current.set(dimensionName, node)
    else dimensionChartNodes.current.delete(dimensionName)
  }
  async function prepareChartsForCapture() {
    const previousMode = dimensionViewMode
    if (previousMode === 'chart') return undefined

    setDimensionViewMode('chart')
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)

    return () => setDimensionViewMode(previousMode)
  }

  const { data, isPending, error } = useGetCourseTeachersComparison({ courseCode, period })
  const rawEntries = Array.isArray(data?.data) ? data.data : []
  const seenEntryKeys = new Set<string>()
  const entries = rawEntries.filter((entry) => {
    const key = comparisonEntryKey(entry)
    if (seenEntryKeys.has(key)) return false
    seenEntryKeys.add(key)
    return true
  })
  const colorByKey = buildTeacherComparisonColorMap(entries)

  if (!courseCode || !period) {
    return (
      <>
        <BackButton fallbackHref="/materias" label="Volver" className="mb-4" />
        <p className="text-muted-foreground py-10 text-center text-sm">
          No se encontró información para esta comparación.
        </p>
      </>
    )
  }

  const rankedEntries = [...entries].sort((a, b) => {
    if (a.overall_average == null) return 1
    if (b.overall_average == null) return -1
    return b.overall_average - a.overall_average
  })

  const orderedEntries = [...entries].sort(
    (a, b) => a.teacher_id - b.teacher_id || a.group_name.localeCompare(b.group_name),
  )

  const dimensionNames = orderedEntries[0]?.dimensions.map((dimension) => dimension.dimension) ?? []

  const reportFileName = `Reporte-Comparacion-${(courseName ?? courseCode).replace(/\s+/g, '-')}-${period}`

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/materias" label="Volver" className="mb-4" />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">
            Comparación de docentes{courseName ? `: ${courseName}` : ''}
          </h1>

          {entries.length > 0 && (
            <GenerateReportPdfButton
              label="Descargar reporte de comparación"
              fileName={reportFileName}
              className="hover:border-primary hover:bg-primary hover:text-primary-foreground"
              beforeCapture={prepareChartsForCapture}
              chartRefs={() =>
                Object.fromEntries(
                  dimensionNames.map((name) => [
                    name,
                    { current: dimensionChartNodes.current.get(name) ?? null },
                  ]),
                )
              }
              buildDocument={(images) => (
                <PdfPage
                  title="Comparación de docentes"
                  subtitle={`${courseName ?? courseCode} · Periodo: ${period}`}
                >
                  <PdfFactGrid
                    facts={[
                      { label: 'Materia', value: courseName ?? courseCode },
                      { label: 'Código', value: courseCode },
                      { label: 'Periodo', value: period },
                      { label: 'Docentes comparados', value: String(entries.length) },
                    ]}
                    columns={4}
                  />

                  <PdfSection title="Ranking por promedio general" noBreak={false}>
                    <PdfTable
                      columns={[
                        { header: 'Docente', width: '36%' },
                        { header: 'Grupo', width: '16%' },
                        { header: 'Estudiantes encuestados', width: '24%', align: 'center' },
                        { header: 'Promedio', width: '24%', align: 'center' },
                      ]}
                      rows={rankedEntries.map((entry) => [
                        entry.teacher_name,
                        entry.group_name,
                        String(entry.respondent_count),
                        formatPdfAverage(entry.overall_average),
                      ])}
                    />
                  </PdfSection>

                  {dimensionNames.map((dimensionName) => {
                    const rows = orderedEntries.map((entry) => ({
                      entry,
                      dimension: entry.dimensions.find((d) => d.dimension === dimensionName),
                    }))
                    const scoredRows = rows.filter((row) => row.dimension?.average != null)
                    const best = scoredRows.reduce<(typeof scoredRows)[number] | undefined>(
                      (top, row) =>
                        !top || (row.dimension?.average ?? 0) > (top.dimension?.average ?? 0)
                          ? row
                          : top,
                      undefined,
                    )
                    const worst = scoredRows.reduce<(typeof scoredRows)[number] | undefined>(
                      (bottom, row) =>
                        !bottom || (row.dimension?.average ?? 0) < (bottom.dimension?.average ?? 0)
                          ? row
                          : bottom,
                      undefined,
                    )
                    const indicators = rows.find(
                      (row) => (row.dimension?.questions.length ?? 0) > 0,
                    )?.dimension?.questions

                    return (
                      // `noBreak={false}` — packed tightly against the
                      // sections around it, breaking pages only where the
                      // content actually runs out of room, rather than
                      // forcing every dimension to start its own fresh page
                      // (which left large stretches of blank space below
                      // shorter sections). The tradeoff: if a table does end
                      // up split across a page boundary, its header row
                      // doesn't repeat on the continuation (react-pdf has no
                      // equivalent of an HTML `<thead>` for that) — a smaller
                      // cost than the wasted space this replaces.
                      <PdfSection key={dimensionName} title={dimensionName} noBreak={false}>
                        {best && worst && best.entry !== worst.entry && (
                          <PdfFactGrid
                            facts={[
                              {
                                label: 'Mejor',
                                value: `${best.entry.teacher_name} (${formatPdfAverage(best.dimension?.average)})`,
                                color: pdfColors.riskLow,
                              },
                              {
                                label: 'Menor nota',
                                value: `${worst.entry.teacher_name} (${formatPdfAverage(worst.dimension?.average)})`,
                                color: pdfColors.riskMedium,
                              },
                            ]}
                            columns={2}
                          />
                        )}

                        {images[dimensionName] && <PdfChartImage src={images[dimensionName]} />}

                        <PdfTable
                          columns={[
                            { header: 'Docente', width: '40%' },
                            { header: 'Grupo', width: '20%' },
                            { header: 'Promedio', width: '40%', align: 'center' },
                          ]}
                          rows={rows.map(({ entry, dimension }) => [
                            entry.teacher_name,
                            entry.group_name,
                            formatPdfAverage(dimension?.average),
                          ])}
                        />

                        {indicators && indicators.length > 0 && (
                          <PdfTable
                            columns={[
                              { header: 'N°', width: '6%' },
                              { header: 'Indicador', width: '34%' },
                              ...rows.map(({ entry }) => ({
                                header: shortTeacherName(entry.teacher_name),
                                width: `${60 / rows.length}%`,
                                align: 'center' as const,
                              })),
                            ]}
                            rows={indicators.map((indicator) => [
                              indicator.code,
                              indicator.text,
                              ...rows.map(({ dimension }) => {
                                const score = dimension?.questions.find(
                                  (question) => question.code === indicator.code,
                                )?.score
                                return formatPdfAverage(score)
                              }),
                            ])}
                          />
                        )}
                      </PdfSection>
                    )
                  })}

                  {includeComments && (
                    <PdfSection
                      title="Comentarios de estudiantes — Resumen por docente"
                      noBreak={false}
                    >
                      <PdfTable
                        columns={[
                          { header: 'Docente', width: '22%' },
                          { header: 'Bajo', width: '9%', align: 'center' },
                          { header: 'Medio', width: '9%', align: 'center' },
                          { header: 'Alto', width: '9%', align: 'center' },
                          ...ANALYZABLE_CATEGORIES.map((category) => ({
                            header: categoryShortLabel(category.code),
                            width: '12.75%',
                            align: 'center' as const,
                          })),
                        ]}
                        rows={orderedEntries.map((entry) => [
                          entry.teacher_name,
                          String(entry.comments_risk_counts.BAJO),
                          String(entry.comments_risk_counts.MEDIO),
                          String(entry.comments_risk_counts.ALTO),
                          ...ANALYZABLE_CATEGORIES.map((category) =>
                            String(entry.comments_pedagogical_category_counts[category.code] ?? 0),
                          ),
                        ])}
                      />
                    </PdfSection>
                  )}
                </PdfPage>
              )}
            />
          )}
        </div>

        <PeriodBanner label="Periodo comparado" period={period} />

        {entries.length > 0 && (
          <div className="flex items-center gap-2">
            <Switch
              id={includeCommentsId}
              checked={includeComments}
              onCheckedChange={setIncludeComments}
            />
            <Label
              htmlFor={includeCommentsId}
              className="text-muted-foreground text-sm font-normal"
            >
              Incluir resumen de comentarios en el PDF
            </Label>
          </div>
        )}
      </div>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      )}

      {!isPending && !error && entries.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No hay docentes para comparar en esta materia y periodo.
        </p>
      )}

      {!isPending && !error && entries.length > 0 && (
        <div className="space-y-6">
          <TeacherComparisonRanking
            entries={entries}
            colorByKey={colorByKey}
            courseCode={courseCode}
            period={period}
          />

          <TeacherDimensionComparison
            entries={entries}
            colorByKey={colorByKey}
            viewMode={dimensionViewMode}
            onViewModeChange={setDimensionViewMode}
            onDimensionChartRef={handleDimensionChartRef}
          />

          <TeacherCommentsComparison
            entries={entries}
            colorByKey={colorByKey}
            courseCode={courseCode}
          />
        </div>
      )}
    </div>
  )
}

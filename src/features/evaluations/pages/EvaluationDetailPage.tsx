import { ListChecks } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Link, useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { GenerateReportPdfButton } from '@/components/common/GenerateReportPdfButton'
import { PageTitle } from '@/components/common/PageTitle'
import { PdfChartImage } from '@/components/common/pdf/PdfChartImage'
import { PdfFactGrid } from '@/components/common/pdf/PdfFactGrid'
import { PdfPage } from '@/components/common/pdf/PdfPage'
import { PdfSection } from '@/components/common/pdf/PdfSection'
import { PdfTable } from '@/components/common/pdf/PdfTable'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import EvaluationDetailSkeleton from '@/components/skeletons/EvaluationDetailSkeleton'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { useAcademicPeriodsStore } from '@/features/periods'
import { TeacherAveragesTable, useGetTeachers } from '@/features/teachers'
import { useModalityFilter } from '@/hooks/useModalityFilter'
import { useNavigate } from '@/hooks/useNavigate'
import formatDate from '@/lib/formatDate'
import { MODALITIES } from '@/lib/modality'
import { formatPdfAverage } from '@/lib/pdf/formatPdfAverage'
import { cn } from '@/lib/utils'
import { useGetEvaluation } from '../api'
import {
  EvaluationDimensionDetailCard,
  EvaluationDimensionsChart,
  EvaluationOverview,
  ModalityNotice,
} from '../components'
import { AI_STATUS_DISPLAY, EVALUATION_STATUS_DISPLAY } from '../config'
import type { EvaluationDimensionDetail } from '../types'

/** The report's only filter, offered through the shared "Filtros" panel. */
const FILTERS: FilterConfig[] = [
  {
    type: 'select',
    name: 'modality',
    label: 'Modalidad',
    placeholder: 'Todas',
    options: MODALITIES.map(({ value, label }) => ({ value, label })),
    clearable: true,
  },
]

/**
 * Full page displaying the summary of a single evaluation, optionally narrowed
 * to one modality — an evaluation can hold a presencial and a distancia
 * document, and reading them apart is what tells the two cohorts' results
 * apart. The filter lives in the URL (`?modality=`) so a narrowed report can be
 * linked and shared.
 * Route: `/evaluaciones/:id` where `:id` is the evaluation id.
 */
export default function EvaluationDetailPage() {
  const [, params] = useRoute('/evaluaciones/:id')
  const evaluationId = params?.id ? Number(params.id) : undefined
  const navigate = useNavigate()
  const periods = useAcademicPeriodsStore((state) => state.periods)
  const includeTeachersId = useId()

  const { modality, setModality } = useModalityFilter()

  const { data, isLoading, isPlaceholderData } = useGetEvaluation(evaluationId, modality)
  const evaluation = data?.data

  const dimensionsCardRef = useRef<HTMLElement>(null)
  const [includeTeachers, setIncludeTeachers] = useState(true)

  // Effectively unpaginated, for the PDF report — the on-screen table only
  // ever shows one page (10 rows) at a time, but the report needs every
  // teacher. `limit: 100` is the backend's actual hard cap (GET
  // /teachers/with-averages rejects anything higher with a 400) — a single
  // department realistically stays well under that. Only fetched when the
  // director actually wants the list in the PDF.
  const { data: allTeachersData, isPending: isTeachersPending } = useGetTeachers({
    academicPeriodId: includeTeachers ? evaluation?.academic_period_id : undefined,
    departmentId: includeTeachers ? evaluation?.department_id : undefined,
    limit: 100,
    sortBy: 'overall_average_desc',
  })
  // The report for the modality just picked is still in flight: the one on
  // screen is the previous one, so it dims instead of collapsing into the page
  // skeleton. The filter stays reachable — that is how you get back.
  const isSwitching = isPlaceholderData

  const modalityFilter = (
    <div className="flex items-center gap-2">
      {isSwitching && <Spinner aria-label="Cargando" className="text-muted-foreground size-4" />}

      <DataTableFilters
        filters={FILTERS}
        values={{ modality }}
        onChange={(values) => setModality(values.modality as string | undefined)}
      />
    </div>
  )

  if (isLoading) return <EvaluationDetailSkeleton />

  if (!evaluation) {
    return (
      <>
        <PageTitle>Detalle de la evaluación</PageTitle>

        <p className="text-muted-foreground text-center">No se encontró la evaluación.</p>

        <div className="flex justify-center">
          <BackButton href="/evaluaciones" label="Volver a evaluaciones" />
        </div>
      </>
    )
  }

  const comparison = evaluation.comparison

  const previousDimensions: EvaluationDimensionDetail[] | undefined = comparison?.dimensions.map(
    (dim) => ({
      dimension: dim.dimension,
      average: dim.old_average,
      question_count: dim.questions.length,
      questions: dim.questions.map((q) => ({ code: q.code, text: q.text, average: q.old_average })),
      best_teacher: null,
      worst_teacher: null,
    }),
  )

  const currentDimensions: EvaluationDimensionDetail[] | undefined =
    evaluation?.dimension_averages?.map((dim) => ({
      dimension: dim.dimension,
      average: dim.average,
      question_count: dim.questions.length,
      questions: dim.questions.map((q) => ({
        code: q.code,
        text: q.text,
        average: q.score,
      })),
      best_teacher: null,
      worst_teacher: null,
    }))

  const periodLabel = evaluation.academic_period_name || evaluation.academic_period_code
  const statusConfig = EVALUATION_STATUS_DISPLAY[evaluation.status]
  const aiStatusConfig = evaluation.ai_status ? AI_STATUS_DISPLAY[evaluation.ai_status] : undefined
  const allTeachers = allTeachersData?.data ?? []

  const reportFileName = `Evaluacion-Periodo-${periodLabel.replace(/\s+/g, '-')}`
  const defaultSortBy =
    evaluation.ai_status === 'ANALYZED' ? 'high_risk_comments_count_desc' : 'overall_average_desc'

  return (
    <div
      aria-busy={isSwitching}
      className={cn('space-y-6 transition-opacity', isSwitching && 'opacity-60')}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackButton href="/evaluaciones" label="Volver a evaluaciones" className="mb-4" />

        {modalityFilter}
      </div>

      <ModalityNotice modality={modality} className="-mt-2" />

      <div className="flex items-center gap-2">
        <Switch
          id={includeTeachersId}
          checked={includeTeachers}
          onCheckedChange={setIncludeTeachers}
        />
        <Label htmlFor={includeTeachersId} className="text-muted-foreground text-sm font-normal">
          Incluir la lista de docentes en el PDF
        </Label>
      </div>

      <EvaluationOverview
        evaluation={evaluation}
        pdfHref={`/evaluaciones/${evaluation.id}/pdf`}
        actions={
          <>
            <GenerateReportPdfButton
              label="Descargar reporte de la evaluación"
              fileName={reportFileName}
              disabled={includeTeachers && isTeachersPending}
              chartRefs={{ dimensions: dimensionsCardRef }}
              buildDocument={(images) => (
                <PdfPage
                  title={`Evaluación del periodo (${periodLabel})`}
                  subtitle={`Cargada el ${formatDate(evaluation.created_at)}`}
                >
                  <PdfFactGrid
                    facts={[
                      { label: 'Periodo', value: periodLabel },
                      {
                        label: 'Promedio general',
                        value: formatPdfAverage(evaluation.overall_average),
                      },
                      { label: 'Docentes evaluados', value: String(evaluation.count) },
                    ]}
                    columns={3}
                  />

                  <PdfFactGrid
                    facts={[
                      {
                        label: 'Comentarios de alto riesgo',
                        value: String(evaluation.comments_risk_counts?.ALTO ?? '—'),
                      },
                      { label: 'Procesamiento', value: statusConfig.label },
                      { label: 'Análisis con IA', value: aiStatusConfig?.label ?? 'No disponible' },
                    ]}
                    columns={3}
                  />

                  <PdfSection title="Promedios por dimensión pedagógica">
                    <PdfChartImage src={images.dimensions} />
                  </PdfSection>

                  {currentDimensions?.map((dimension) => (
                    <PdfSection
                      key={dimension.dimension}
                      title={`${dimension.dimension} — Promedio ${formatPdfAverage(dimension.average)}`}
                      noBreak={false}
                    >
                      <PdfTable
                        columns={[
                          { header: 'Pregunta', width: '78%' },
                          { header: 'Promedio', width: '22%', align: 'center' },
                        ]}
                        rows={dimension.questions.map((question) => [
                          `${question.code}. ${question.text}`,
                          formatPdfAverage(question.average),
                        ])}
                      />
                    </PdfSection>
                  ))}

                  {includeTeachers && (
                    <PdfSection title="Docentes evaluados" noBreak={false}>
                      <PdfTable
                        columns={[
                          { header: 'Docente', width: '38%' },
                          { header: 'Código', width: '14%' },
                          { header: 'Tipo de contrato', width: '20%' },
                          { header: 'Promedio', width: '14%', align: 'center' },
                          { header: 'Riesgo alto', width: '14%', align: 'center' },
                        ]}
                        rows={allTeachers.map((teacher) => [
                          teacher.user.name,
                          teacher.institutional_code || '—',
                          teacher.contract_type || '—',
                          formatPdfAverage(teacher.overall_average),
                          String(teacher.high_risk_comments_count ?? '—'),
                        ])}
                      />
                    </PdfSection>
                  )}
                </PdfPage>
              )}
            />

            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/evaluaciones/${evaluation.id}/materias`} />}
              className="bg-background"
            >
              <ListChecks className="size-4" aria-hidden="true" />
              Revisar materias
            </Button>
          </>
        }
      />

      <section ref={dimensionsCardRef} className="border-border bg-background rounded-md border">
        <div className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
          <h2 className="text-muted-foreground text-sm font-medium">
            Promedios por dimensión pedagógica
          </h2>

          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/evaluaciones/${evaluation.id}/dimensiones`} />}
          >
            Ver detalle
          </Button>
        </div>

        <div className="px-6 py-4">
          <EvaluationDimensionsChart
            dimensionAverages={evaluation.dimension_averages}
            // compareAverages={previousDimensions}
            compareLabel={comparison?.previous_period_name}
            referenceValue={evaluation.overall_average}
            referenceLabel="Promedio general"
          />
        </div>
      </section>

      {currentDimensions && (
        <section className="border-border bg-background rounded-md border">
          <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-6 py-4">
            <h2 className="text-muted-foreground text-sm font-medium">
              Dimensiones pedagógicas{' '}
              {comparison && `comparadas con ${comparison?.previous_period_name}`}
            </h2>

            {comparison && (
              <ScoreBadge
                value={comparison.current_average}
                previousValue={comparison.old_average}
                previousLabel={comparison.previous_period_name}
                tone="auto"
              />
            )}
          </div>

          <div className="divide-border divide-y">
            {currentDimensions.map((dimension) => (
              <EvaluationDimensionDetailCard
                key={dimension.dimension}
                dimension={dimension}
                overallDimension={previousDimensions?.find(
                  (item) => item.dimension === dimension.dimension,
                )}
                previousLabel={comparison?.previous_period_name}
              />
            ))}
          </div>
        </section>
      )}

      <TeacherAveragesTable
        departmentId={evaluation.department_id}
        defaultPeriodId={evaluation.academic_period_id}
        defaultSortBy={defaultSortBy}
        modality={modality}
        onTeacherClick={(teacher, periodId) => {
          const period = periods.find((p) => p.id === periodId)
          navigate(`/docentes/${teacher.id}?period=${period?.name}`)
        }}
      />
    </div>
  )
}

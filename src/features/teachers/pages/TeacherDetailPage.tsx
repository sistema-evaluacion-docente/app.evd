import { useRef } from 'react'
import { useRoute, useSearchParams } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { GenerateReportPdfButton } from '@/components/common/GenerateReportPdfButton'
import { PageTitle } from '@/components/common/PageTitle'
import { PdfChartImage } from '@/components/common/pdf/PdfChartImage'
import { PdfFactGrid } from '@/components/common/pdf/PdfFactGrid'
import { PdfPage } from '@/components/common/pdf/PdfPage'
import { PdfSection } from '@/components/common/pdf/PdfSection'
import { PdfTable } from '@/components/common/pdf/PdfTable'
import TeacherDetailSkeleton from '@/components/skeletons/TeacherDetailSkeleton'
import { TeacherPlanAction } from '@/features/plans/components/TeacherPlanAction'
import { CATEGORIES, categoryLabel, UNCATEGORIZED } from '@/lib/categoryLabel'
import { formatPdfAverage } from '@/lib/pdf/formatPdfAverage'
import { pdfColors } from '@/lib/pdf/pdfColors'
import { useGetTeacherComments, useGetTeacherDetail } from '../api'
import { TeacherEvaluationDetail } from '../components'
import { courseTeacherHref } from '../config'

const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

/**
 * One short word per dimension, for the "Resultados por asignatura" table
 * header — `shortenDimensionLabel` (in `@/lib/dimensionLabel`) actually
 * returns the full name unchanged (it's meant for a different purpose), and
 * the full names ("Desarrollo del Conocimiento"...) don't fit a narrow PDF
 * table column without ugly mid-word hyphenation.
 */
const SHORT_DIMENSION_LABEL: Record<string, string> = {
  'Desarrollo del Conocimiento': 'Conocimiento',
  'Desempeño Docente': 'Desempeño',
  'Procesos de Evaluación': 'Evaluación',
  'Integración Interpersonal': 'Interpersonal',
}

/**
 * Full page displaying the detail of a single teacher for a specific academic period.
 * Route: `/docentes/:id?period=<period_name>`
 */
export default function TeacherDetailPage() {
  const [, params] = useRoute('/docentes/:id')
  const [searchParams] = useSearchParams()

  const teacherId = params?.id ? Number(params.id) : undefined
  const periodName = searchParams.get('period') ?? undefined

  const { data, isLoading } = useGetTeacherDetail({ teacherId, periodName })
  const teacher = data?.data

  const dimensionsChartRef = useRef<HTMLElement>(null)
  const trendChartRef = useRef<HTMLElement>(null)

  // Comment text itself is deliberately left out of the PDF — only the
  // risk/category counts (same call already made by `TeacherComments` below,
  // React Query dedupes it).
  const { data: commentsData } = useGetTeacherComments({
    evaluationId: teacher?.evaluation_id,
    teacherId: teacher?.teacher_id,
  })

  if (isLoading) return <TeacherDetailSkeleton />

  if (!teacher) {
    return (
      <>
        <PageTitle>Detalle del docente</PageTitle>
        <p className="text-muted-foreground text-center">No se encontró el docente.</p>
      </>
    )
  }

  const comments = commentsData?.data?.courses.flatMap((course) => course.comments) ?? []

  const riskCounts = comments.reduce(
    (counts, comment) => {
      const key = comment.risk_level?.name.toUpperCase()
      if (key === 'BAJO' || key === 'MEDIO' || key === 'ALTO') counts[key] += 1
      return counts
    },
    { BAJO: 0, MEDIO: 0, ALTO: 0 },
  )

  const categoryCounts = comments.reduce<Record<string, number>>((counts, comment) => {
    for (const category of comment.pedagogical_categories) {
      counts[category.name] = (counts[category.name] ?? 0) + 1
    }
    return counts
  }, {})

  const dimensionNames = teacher.dimensions.map((dimension) => dimension.dimension)
  const dimensionColumnWidth = `${52 / Math.max(dimensionNames.length, 1)}%`

  const reportFileName = `Reporte-Docente-${teacher.name.replace(/\s+/g, '-')}-${teacher.period_code}`

  const pdfReportButton = (
    <GenerateReportPdfButton
      label="Descargar reporte del docente"
      fileName={reportFileName}
      className="bg-background hover:border-primary hover:bg-primary hover:text-primary-foreground"
      chartRefs={{ dimensions: dimensionsChartRef, trend: trendChartRef }}
      buildDocument={(images) => (
        <PdfPage
          title="Reporte del docente"
          subtitle={`${teacher.name} · Periodo: ${teacher.period_name}`}
        >
          <PdfFactGrid
            facts={[
              { label: 'Docente', value: teacher.name },
              { label: 'Código institucional', value: teacher.institutional_code },
              { label: 'Periodo', value: teacher.period_name },
            ]}
            columns={3}
          />

          <PdfFactGrid
            facts={[
              { label: 'Promedio general', value: formatPdfAverage(teacher.overall_average) },
              { label: 'Grupos evaluados', value: String(teacher.group_count) },
            ]}
            columns={2}
          />

          <PdfSection title="Perfil por dimensiones">
            <PdfChartImage src={images.dimensions} />
          </PdfSection>

          <PdfSection title="Resultados por asignatura" noBreak={false}>
            <PdfTable
              columns={[
                { header: 'Materia', width: '20%' },
                { header: 'Grupo', width: '18%' },
                { header: 'Promedio', width: '10%', align: 'center' },
                ...dimensionNames.map((name) => ({
                  header: SHORT_DIMENSION_LABEL[name] ?? name,
                  width: dimensionColumnWidth,
                  align: 'center' as const,
                })),
              ]}
              rows={teacher.courses.map((course) => [
                course.course_name,
                `${course.course_code} - ${course.group_name}`,
                formatPdfAverage(course.overall_average),
                ...dimensionNames.map((name) => {
                  const match = course.dimensions.find((d) => d.dimension === name)
                  return formatPdfAverage(match?.average)
                }),
              ])}
            />
          </PdfSection>

          <PdfSection title="Comentarios de los estudiantes — Resumen">
            <PdfFactGrid
              facts={[
                {
                  label: 'Riesgo bajo',
                  value: String(riskCounts.BAJO),
                  color: pdfColors.riskLow,
                },
                {
                  label: 'Riesgo medio',
                  value: String(riskCounts.MEDIO),
                  color: pdfColors.riskMedium,
                },
                {
                  label: 'Riesgo alto',
                  value: String(riskCounts.ALTO),
                  color: pdfColors.riskHigh,
                },
              ]}
              columns={3}
            />

            <PdfFactGrid
              facts={ANALYZABLE_CATEGORIES.map((category) => ({
                label: categoryLabel(category.code),
                value: String(categoryCounts[category.code] ?? 0),
              }))}
              columns={4}
            />
          </PdfSection>

          <PdfSection title="Evolución del promedio por periodo">
            <PdfChartImage src={images.trend} />
          </PdfSection>
        </PdfPage>
      )}
    />
  )

  return (
    <div className="space-y-6">
      <BackButton href={`/docentes?period=${teacher.period_name}`} className="mb-4" />

      <TeacherEvaluationDetail
        teacher={teacher}
        dimensionsChartRef={dimensionsChartRef}
        trendChartRef={trendChartRef}
        overviewActions={pdfReportButton}
        getCourseHref={(course) =>
          courseTeacherHref(
            course.course_code,
            teacher.teacher_id,
            teacher.period_code,
            course.group_name,
          )
        }
      />

      
    </div>
  )
}

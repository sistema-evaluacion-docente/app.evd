import { FileText, Users } from 'lucide-react'
import { useRoute } from 'wouter'

import { PageTitle } from '@/components/common/PageTitle'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import formatDate from '@/lib/formatDate'
import { useGetEvaluationByPeriod } from '../api'
import { AI_STATUS_DISPLAY, EVALUATION_STATUS_DISPLAY } from '../config'

/**
 * Full page displaying the summary of a single evaluation for an academic
 * period. Route: `/evaluaciones/:id` where `:id` is the academic period id.
 */
export default function EvaluationDetailPage() {
  const [, params] = useRoute('/evaluaciones/:id')
  const periodId = params?.id ? Number(params.id) : undefined

  const { data, isLoading } = useGetEvaluationByPeriod(periodId)
  const evaluation = data?.data

  if (isLoading) {
    return (
      <>
        <PageTitle>Detalle de la evaluación</PageTitle>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-36" />
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>

            <CardContent>
              <Skeleton className="h-28" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!evaluation) {
    return (
      <>
        <PageTitle>Detalle de la evaluación</PageTitle>
        <p className="text-muted-foreground text-center">No se encontró la evaluación.</p>
      </>
    )
  }

  const statusConfig = EVALUATION_STATUS_DISPLAY[evaluation.status]
  const aiStatusConfig = evaluation.ai_status ? AI_STATUS_DISPLAY[evaluation.ai_status] : undefined

  return (
    <>
      <PageTitle>Detalle de la evaluación</PageTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-lg font-semibold">
                  {evaluation.academic_period_name || evaluation.academic_period_code || 'Periodo'}
                </span>

                <span className="text-muted-foreground text-sm">
                  {evaluation.academic_period_code || 'Sin código'}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>

                {aiStatusConfig ? (
                  <Badge className={aiStatusConfig.className}>{aiStatusConfig.label}</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">IA no disponible</span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-muted-foreground size-4" aria-hidden="true" />
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Documento PDF
                  </p>
                </div>

                <a
                  href={evaluation.pdf_url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'bg-muted/60 hover:bg-muted text-foreground mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm font-medium transition-colors',
                    !evaluation.pdf_url && 'pointer-events-none opacity-50',
                  )}
                >
                  <FileText className="size-4" aria-hidden="true" />
                  Ver PDF
                </a>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Users className="text-muted-foreground size-4" aria-hidden="true" />
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Docentes evaluados
                  </p>
                </div>

                <p className="mt-2 text-2xl font-bold tabular-nums">{evaluation.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Resumen</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Promedio general
              </p>

              <ScoreBadge value={evaluation.overall_average} decimals={2} className="text-2xl" />
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Estado</span>
                  <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Análisis IA</span>
                  {aiStatusConfig ? (
                    <Badge className={aiStatusConfig.className}>{aiStatusConfig.label}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Activa</span>
                  <span
                    className={`text-sm font-medium ${evaluation.active ? 'text-emerald-600' : 'text-muted-foreground'}`}
                  >
                    {evaluation.active ? 'Sí' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Creada</span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatDate(evaluation.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

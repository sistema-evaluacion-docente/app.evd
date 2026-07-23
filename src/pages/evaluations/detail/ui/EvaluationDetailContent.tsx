import type { AiStatus } from '@/features/evaluations'
import {
  CommentsTable,
  DimensionOverview,
  GeneralInfoCard,
  NotFoundState,
  ScoresByGroup,
  StatusBadge,
  SummaryStats,
  TeacherRankingTable,
  useAnalyzeEvaluation,
  useEvaluationLogsContext,
} from '@/features/evaluations'
import { cn } from '@/lib/utils'
import { BrainCircuit, CirclePile, Loader2, MessageSquare, Users } from 'lucide-react'

import { useEvaluationDetail } from '../model/useEvaluationDetail'
import EvaluationSection from './EvaluationSection'

type Props = {
  evaluationId: number
}

const AI_STATUS_BADGE: Record<AiStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pendiente de análisis',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  ANALYZING: {
    label: 'Analizando…',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  },
  ANALYZED: {
    label: 'Analizado',
    className: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  },
  FAILED: {
    label: 'Análisis fallido',
    className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
}

function EvaluationDetailContent({ evaluationId }: Props) {
  const { evaluation, summary, department, dimensions, isLoading, noData } =
    useEvaluationDetail(evaluationId)

  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeEvaluation()
  const { connect } = useEvaluationLogsContext()

  const aiStatus: AiStatus | null = evaluation?.ai_status ?? null

  const handleAnalyze = () => {
    analyze(evaluationId)
    connect(evaluationId, [['evaluations'], ['evaluation', String(evaluationId)]])
  }

  return (
    <>
      {noData ? (
        <NotFoundState />
      ) : (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start md:items-center">
            <div>
              <h1 className="text-2xl leading-tight font-semibold tracking-tight">
                Detalle de Evaluación
                <span className="text-muted-foreground ml-2">#{evaluationId}</span>
              </h1>
            </div>

            {evaluation && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusBadge status={evaluation.status} />

                {/* AI status badge */}
                {aiStatus && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                      AI_STATUS_BADGE[aiStatus].className,
                    )}
                  >
                    {aiStatus === 'ANALYZING' && <Loader2 size={11} className="animate-spin" />}
                    {AI_STATUS_BADGE[aiStatus].label}
                  </span>
                )}

                {/* Analyze button */}
                {evaluation.status === 'COMPLETED' && (
                  <>
                    {aiStatus === 'ANALYZED' ? (
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <BrainCircuit size={12} />
                        Re-analizar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || aiStatus === 'ANALYZING'}
                        className={cn(
                          'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          aiStatus === 'FAILED'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-brand-600 hover:bg-brand-700',
                        )}
                      >
                        <BrainCircuit size={12} />
                        {aiStatus === 'FAILED' ? 'Reintentar análisis' : 'Analizar con IA'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <GeneralInfoCard evaluation={evaluation} department={department} isLoading={isLoading} />

          <SummaryStats summary={summary} isLoading={isLoading} />

          <DimensionOverview
            dimensions={dimensions}
            evaluationId={evaluationId}
            isLoading={isLoading}
          />

          <EvaluationSection
            title="Docentes"
            icon={<Users size={18} />}
            url={`/evaluations/${evaluationId}/teachers`}
          />

          <TeacherRankingTable
            academicPeriodId={evaluation?.academic_period_id}
            departmentId={evaluation?.department_id}
          />

          <EvaluationSection
            title="Grupos"
            icon={<CirclePile size={18} />}
            url={`/evaluations/${evaluationId}/groups`}
          />

          <ScoresByGroup evaluationId={evaluationId} />

          <EvaluationSection
            title="Comentarios"
            icon={<MessageSquare size={18} />}
            url={`/evaluations/${evaluationId}/comments`}
          />

          <CommentsTable evaluationId={evaluationId} />
        </>
      )}
    </>
  )
}

export default EvaluationDetailContent

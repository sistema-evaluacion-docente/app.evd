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
} from "@/features/evaluations";
import type { AiStatus } from "@/features/evaluations";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BrainCircuit, CirclePile, Loader2, MessageSquare, Users } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

import { useEvaluationDetail } from "../model/useEvaluationDetail";
import EvaluationSection from "./EvaluationSection";

type Props = {
  evaluationId: number;
};

const AI_STATUS_BADGE: Record<
  AiStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pendiente de análisis",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
  ANALYZING: {
    label: "Analizando…",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  },
  ANALYZED: {
    label: "Analizado",
    className: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  },
  FAILED: {
    label: "Análisis fallido",
    className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
};

function EvaluationDetailContent({ evaluationId }: Props) {
  const { evaluation, summary, department, dimensions, isLoading, noData } =
    useEvaluationDetail(evaluationId);

  const queryClient = useQueryClient();
  const {
    analyze,
    aiStatus: analyzeStatus,
    error: analyzeError,
  } = useAnalyzeEvaluation();

  // ai_status efectivo: prioriza el estado del hook (sesión activa), si no el del servidor
  const effectiveAiStatus: AiStatus | null =
    analyzeStatus ?? evaluation?.ai_status ?? null;

  // Al completarse el análisis, refresca la evaluación para obtener el ai_status actualizado
  useEffect(() => {
    if (analyzeStatus === "ANALYZED" || analyzeStatus === "FAILED") {
      queryClient.invalidateQueries({ queryKey: ["evaluation", evaluationId] });
    }
  }, [analyzeStatus, evaluationId, queryClient]);

  const handleAnalyze = () => {
    analyze(evaluationId, effectiveAiStatus);
  };

  return (
    <>
      {noData ? (
        <NotFoundState />
      ) : (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start md:items-center">
            <div>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                Detalle de Evaluación
                <span className="ml-2 text-muted-foreground">
                  #{evaluationId}
                </span>
              </h1>
            </div>

            {evaluation && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusBadge status={evaluation.status} />

                {/* AI status badge */}
                {effectiveAiStatus && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      AI_STATUS_BADGE[effectiveAiStatus].className,
                    )}
                  >
                    {effectiveAiStatus === "ANALYZING" && (
                      <Loader2 size={11} className="animate-spin" />
                    )}
                    {AI_STATUS_BADGE[effectiveAiStatus].label}
                  </span>
                )}

                {/* Analyze button */}
                {evaluation.status === "COMPLETED" && (
                  <>
                    {effectiveAiStatus === "ANALYZING" ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand-600/50 px-3 text-xs font-semibold text-white"
                      >
                        <Loader2 size={12} className="animate-spin" />
                        Analizando…
                      </button>
                    ) : effectiveAiStatus === "ANALYZED" ? (
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                      >
                        <BrainCircuit size={12} />
                        Re-analizar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white transition-colors",
                          effectiveAiStatus === "FAILED"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-brand-600 hover:bg-brand-700",
                        )}
                      >
                        <BrainCircuit size={12} />
                        {effectiveAiStatus === "FAILED"
                          ? "Reintentar análisis"
                          : "Analizar con IA"}
                      </button>
                    )}

                    {effectiveAiStatus === "FAILED" && analyzeError && (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle size={12} />
                        {analyzeError}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <GeneralInfoCard
            evaluation={evaluation}
            department={department}
            isLoading={isLoading}
          />

          <SummaryStats summary={summary} />

          <DimensionOverview
            dimensions={dimensions}
            evaluationId={evaluationId}
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
  );
}

export default EvaluationDetailContent;

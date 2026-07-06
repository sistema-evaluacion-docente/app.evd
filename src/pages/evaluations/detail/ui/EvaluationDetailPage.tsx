import { useParams } from "wouter";

import { AppFooter, Separator } from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";
import { useEvaluationDetail } from "../model/useEvaluationDetail";
import {
  ActiveBadge,
  CommentsTable,
  DimensionOverview,
  GeneralInfoCard,
  NotFoundState,
  ScoresByGroup,
  StatusBadge,
  SummaryStats,
  TeacherRankingTable,
} from "./components";

export function EvaluationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const evaluationId = parseInt(id ?? "0", 10);

  const {
    evaluation,
    summary,
    department,
    dimensions,
    isLoading,
    noData,
  } = useEvaluationDetail(evaluationId);

  return (
    <AppLayout>
      {noData ? (
        <NotFoundState />
      ) : (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink-900">
                Detalle de Evaluación
                <span className="ml-2 text-ink-400">#{evaluationId}</span>
              </h1>
            </div>

            {evaluation && (
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={evaluation.status} />
                <ActiveBadge active={evaluation.active} />
              </div>
            )}
          </div>

          <GeneralInfoCard
            evaluation={evaluation}
            department={department}
            isLoading={isLoading}
          />

          <SummaryStats summary={summary} />

          <TeacherRankingTable
            academicPeriodId={evaluation?.academic_period_id}
            departmentId={evaluation?.department_id}
          />

          <ScoresByGroup evaluationId={evaluationId} />

          <DimensionOverview dimensions={dimensions} />

          <CommentsTable evaluationId={evaluationId} />

          <Separator />
        </>
      )}

      <AppFooter>
        {evaluation?.academic_period_name ?? "Evaluación"} · Sistema de
        Evaluación Docente
      </AppFooter>
    </AppLayout>
  );
}

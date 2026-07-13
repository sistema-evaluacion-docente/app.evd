import {
  CommentsTable,
  DimensionOverview,
  GeneralInfoCard,
  NotFoundState,
  ScoresByGroup,
  StatusBadge,
  SummaryStats,
  TeacherRankingTable,
} from "@/features/evaluations";
import { useEvaluationDetail } from "../model/useEvaluationDetail";
import { Separator } from "@/components/ui/separator";
import EvaluationSection from "./EvaluationSection";

type Props = {
  evaluationId: number;
};

function EvaluationDetailContent({ evaluationId }: Props) {
  const { evaluation, summary, department, dimensions, isLoading, noData } =
    useEvaluationDetail(evaluationId);

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
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={evaluation.status} />
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

          <Separator />

          <EvaluationSection
            title="Docentes"
            url={`/evaluations/${evaluationId}/teachers`}
          />

          <TeacherRankingTable
            academicPeriodId={evaluation?.academic_period_id}
            departmentId={evaluation?.department_id}
          />

          <EvaluationSection
            title="Grupos"
            url={`/evaluations/${evaluationId}/groups`}
          />

          <ScoresByGroup evaluationId={evaluationId} />

          <EvaluationSection
            title="Comentarios"
            url={`/evaluations/${evaluationId}/comments`}
          />

          <CommentsTable evaluationId={evaluationId} />
        </>
      )}
    </>
  );
}

export default EvaluationDetailContent;

import DataTable from "@/components/common/DataTable";
import {
  NotFoundState,
  ScoreBarInline,
  useGetEvaluation,
} from "@/features/evaluations";
import type { EvaluationScore } from "@/features/evaluations";
import { PageHeader } from "@/shared/ui";
import type { ColumnDef } from "@tanstack/react-table";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

import type { ResponseAPI } from "@/shared/types/Response";
import { createScoresQueryFn } from "@/features/evaluations/components/createScoresQueryFn";

const columns: ColumnDef<EvaluationScore>[] = [
  {
    accessorKey: "group_name",
    header: "Grupo Academico",
    cell: ({ row }) => {
      const score = row.original;
      const name =
        score.group_name ?? `Grupo Academico #${score.academic_group_id}`;
      return (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-card text-xs font-semibold text-muted-foreground">
            {name.charAt(0)}
          </span>

          <div>
            <div className="font-medium">{name}</div>

            <div className="text-xs text-muted-foreground">
              {score.respondent_count} estudiante
              {score.respondent_count !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "overall_average",
    header: "Puntaje",
    cell: ({ getValue }) => {
      const value = getValue() as string | null;
      return <ScoreBarInline score={parseFloat(value ?? "0")} />;
    },
  },
];

type Props = {
  evaluationId: number;
};

function EvaluationGroupsContent({ evaluationId }: Props) {
  const { data: evalRes } = useGetEvaluation(evaluationId);
  const evaluation = evalRes?.data;

  const queryFn = useMemo(
    () =>
      function useGroupsQuery({
        page,
        limit,
        search,
      }: {
        page: number;
        limit: number;
        search: string;
      }): UseQueryResult<ResponseAPI<EvaluationScore[]>> {
        return createScoresQueryFn(evaluationId)({ page, limit, search });
      },
    [evaluationId],
  );

  if (!evaluation) {
    return <NotFoundState />;
  }

  return (
    <>
      <PageHeader
        title="Grupos de la Evaluacion"
      />

      <DataTable<EvaluationScore>
        columns={columns}
        queryFn={queryFn}
        emptyMessage="No hay grupos registrados en esta evaluacion."
        searchPlaceholder="Buscar por grupo..."
        pageSize={10}
        minWidthClassName="min-w-120"
        enableSorting={false}
      />
    </>
  );
}

export default EvaluationGroupsContent;

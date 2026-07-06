import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import DataTable from "@/components/common/DataTable";
import type { EvaluationScore } from "@/features/evaluations";

import { createScoresQueryFn } from "../../model/useGetScoresByEvaluation";
import { ScoreBarInline } from "./ScoreBarInline";

interface ScoresByGroupProps {
  evaluationId: number;
}

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
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-ink-100 text-[11px] font-semibold text-ink-600">
            {name.charAt(0)}
          </span>

          <div>
            <div className="text-[13.5px] font-medium text-ink-800">{name}</div>

            <div className="text-[12px] text-ink-500">
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

export function ScoresByGroup({ evaluationId }: ScoresByGroupProps) {
  const queryFn = useMemo(
    () => createScoresQueryFn(evaluationId),
    [evaluationId],
  );

  return (
    <DataTable<EvaluationScore>
      columns={columns}
      queryFn={queryFn}
      emptyMessage="No hay puntajes registrados para esta evaluacion."
      searchPlaceholder="Buscar por grupo..."
      pageSize={10}
      minWidthClassName="min-w-120"
      enableSorting={false}
    />
  );
}

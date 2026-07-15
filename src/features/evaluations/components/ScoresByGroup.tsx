import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import DataTable from "@/components/common/DataTable";
import type { EvaluationScore } from "../types/Evaluation";

import { createScoresQueryFn } from "./createScoresQueryFn";
import { ScoreBarInline } from "./ScoreBarInline";

interface ScoresByGroupProps {
  evaluationId: number;
}

const columns: ColumnDef<EvaluationScore>[] = [
  {
    accessorKey: "group_name",
    header: "Grupo Académico",
    cell: ({ row }) => {
      const score = row.original;
      const groupName =
        score.group_name ?? `Grupo #${score.academic_group_id}`;
      return (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-card text-xs font-semibold text-muted-foreground">
            {groupName.charAt(0)}
          </span>

          <div className="min-w-0">
            <div className="font-medium">{groupName}</div>

            {score.course_name && (
              <div className="truncate text-xs text-muted-foreground">
                {score.course_name}
              </div>
            )}

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
      enableSearch={false}
      disabledPagination={true}
      enableFilters={false}
    />
  );
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/common/DataTable";
import {
  NotFoundState,
  ScoreBarInline,
  useGetEvaluation,
} from "@/features/evaluations";
import type { TeacherRankingItem } from "@/features/stats";
import { useGetTeacherRanking } from "@/features/stats";
import { PageHeader } from "@/shared/ui";
import type { ColumnDef } from "@tanstack/react-table";
import type { UseQueryResult } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

import type { ResponseAPI } from "@/shared/types/Response";

const columns: ColumnDef<TeacherRankingItem>[] = [
  {
    accessorKey: "name",
    header: "Docente",
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {teacher.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
            <AvatarImage
              src={teacher.avatar_url ?? undefined}
              alt={teacher.name ?? ""}
            />
          </Avatar>
          <Link
            href={`/teachers/${teacher.teacher_id}`}
            className="font-medium hover:text-brand-600 truncate"
          >
            {teacher.name ?? "—"}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "institutional_code",
    header: "Codigo",
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return (
        <span className="font-mono text-[12px] text-muted-foreground">
          {value}
        </span>
      );
    },
  },
  {
    accessorKey: "group_count",
    header: "Grupos",
    cell: ({ getValue }) => {
      const value = getValue() as number;
      return <span className="text-center tabular-nums">{value}</span>;
    },
  },
  {
    accessorKey: "overall_average",
    header: "Promedio",
    cell: ({ getValue }) => {
      const value = getValue() as number | null;
      return value != null ? (
        <ScoreBarInline score={value} />
      ) : (
        <span className="text-ink-400">—</span>
      );
    },
  },
];

type Props = {
  evaluationId: number;
};

function EvaluationTeachersContent({ evaluationId }: Props) {
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  const { data: evalRes } = useGetEvaluation(evaluationId);
  const evaluation = evalRes?.data;

  const queryFn = useMemo(
    () =>
      function useTeachersQuery({
        page,
        limit,
        search,
      }: {
        page: number;
        limit: number;
        search: string;
      }): UseQueryResult<ResponseAPI<TeacherRankingItem[]>> {
        return useGetTeacherRanking(
          page,
          limit,
          search,
          sort,
          evaluation?.academic_period_id,
          evaluation?.department_id,
        );
      },
    [evaluation?.academic_period_id, evaluation?.department_id, sort],
  );

  if (!evaluation) {
    return <NotFoundState />;
  }

  return (
    <>
      <PageHeader
        title="Docentes de la Evaluacion"
      />

      <DataTable<TeacherRankingItem>
        columns={columns}
        queryFn={queryFn}
        emptyMessage="No hay docentes registrados en esta evaluacion."
        searchPlaceholder="Buscar por docente, codigo..."
        pageSize={10}
        minWidthClassName="min-w-150"
        enableSorting={false}
        filters={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSort((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="gap-2"
          >
            {sort === "desc" ? (
              <>
                <ArrowDown className="h-4 w-4" />
                Mayor promedio
              </>
            ) : (
              <>
                <ArrowUp className="h-4 w-4" />
                Menor promedio
              </>
            )}
          </Button>
        }
      />
    </>
  );
}

export default EvaluationTeachersContent;

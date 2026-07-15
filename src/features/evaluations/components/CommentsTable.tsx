import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "wouter";

import DataTable from "@/components/common/DataTable";
import type { EvaluationComment } from "../types/Comment";
import { createCommentsQueryFn } from "./createCommentsQueryFn";

interface CommentsTableProps {
  evaluationId: number;
}

const columns: ColumnDef<EvaluationComment>[] = [
  {
    accessorKey: "teacher_name",
    header: "Docente",
    cell: ({ row }) => {
      const comment = row.original;
      const name = comment.teacher_name ?? `Docente #${comment.teacher_id}`;
      return (
        <div className="flex items-center gap-3">
          <Link to={`/teachers/${comment.teacher_id}`}>
            <Avatar>
              <AvatarFallback>
                {name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>

              <AvatarImage
                src={comment.teacher_avatar_url ?? undefined}
                alt={name}
              />
            </Avatar>
          </Link>

          <div className="min-w-0">
            <Link to={`/teachers/${comment.teacher_id}`}>
              <div className=" font-medium truncate">{name}</div>
            </Link>

            {comment.course_name && (
              <div className="truncate text-xs text-muted-foreground">
                {comment.course_name}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "original_text",
    header: "Comentario",
    cell: ({ getValue }) => {
      const value = getValue() as string | null;
      return (
        <p
          className="max-w-120 text-sm leading-relaxed truncate"
          title={value ?? ""}
        >
          <span className="text-muted-foreground">&ldquo;</span>
          {value ?? "—"}
          <span className="text-muted-foreground">&rdquo;</span>
        </p>
      );
    },
  },
  {
    accessorKey: "risk_level",
    header: "Nivel de riesgo",
    cell: ({ row }) => {
      const rl = row.original.risk_level;
      const score = row.original.risk_score;
      if (!rl) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col items-center gap-1">
          <span
            className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: rl.color_hex }}
          >
            {rl.name}
          </span>
          {score != null && (
            <span className="text-xs font-medium text-muted-foreground">
              {(score * 100).toFixed(1)}% confianza
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "pedagogical_category",
    header: "Categoría pedagógica",
    cell: ({ row }) => {
      const pc = row.original.pedagogical_category;
      const score = row.original.category_score;
      if (!pc) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col items-center gap-1">
          <span
            className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: pc.color_hex }}
          >
            {pc.name}
          </span>
          {score != null && (
            <span className="text-xs font-medium text-muted-foreground">
              {(score * 100).toFixed(1)}% confianza
            </span>
          )}
        </div>
      );
    },
  },
];

export function CommentsTable({ evaluationId }: CommentsTableProps) {
  const queryFn = useMemo(
    () => createCommentsQueryFn(evaluationId),
    [evaluationId],
  );

  return (
    <DataTable<EvaluationComment>
      columns={columns}
      queryFn={queryFn}
      emptyMessage="No hay comentarios registrados en esta evaluación."
      searchPlaceholder="Buscar por docente, curso..."
      pageSize={10}
      minWidthClassName="min-w-150"
      disabledPagination={true}
      enableSearch={false}
      enableFilters={false}
    />
  );
}

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

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {comment.course_name && (
                <>
                  <span className="truncate max-w-32">
                    {comment.course_name}
                  </span>

                  <span>·</span>
                </>
              )}

              <span>
                Grupo: {comment.group_name ?? `#${comment.academic_groups_id}`}
              </span>
            </div>
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
    accessorKey: "Nivel de riesgo",
    header: "Nivel de riesgo",
    cell: () => {
      return <span>{"—"}</span>;
    },
  },
  {
    accessorKey: "Categorías pedagógicas",
    header: "Categorías pedagógicas",
    cell: () => {
      return <span>{"—"}</span>;
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
    />
  );
}

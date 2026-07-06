import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import DataTable from "@/components/common/DataTable";
import type { EvaluationComment } from "../types/Comment";
import { Avatar } from "@/shared/ui";

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
          <Avatar
            name={name}
            src={comment.teacher_avatar_url ?? undefined}
            size={36}
            paletteIndex={comment.teacher_id}
          />
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-ink-800 truncate">
              {name}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-400">
              {comment.course_name && (
                <>
                  <span className="truncate max-w-32">{comment.course_name}</span>
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
          className="max-w-120 text-[13.5px] leading-relaxed text-ink-800 truncate"
          title={value ?? ""}
        >
          <span className="text-ink-400">&ldquo;</span>
          {value ?? "—"}
          <span className="text-ink-400">&rdquo;</span>
        </p>
      );
    },
  },
];

export function CommentsTable({ evaluationId }: CommentsTableProps) {
  const queryFn = useMemo(() => createCommentsQueryFn(evaluationId), [evaluationId]);

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

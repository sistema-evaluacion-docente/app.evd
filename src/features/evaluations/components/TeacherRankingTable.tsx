import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

import DataTable from "@/components/common/DataTable";
import type { TeacherRankingItem } from "@/features/stats";
import { createTeacherRankingQueryFn } from "./createTeacherRankingQueryFn";
import { ScoreBarInline } from "./ScoreBarInline";

interface TeacherRankingTableProps {
  academicPeriodId?: number;
  departmentId?: number;
}

const columns: ColumnDef<TeacherRankingItem>[] = [
  {
    accessorKey: "name",
    header: "Docente",
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <Link
              href={`/teachers/${teacher.teacher_id}`}
              className="font-medium hover:text-brand-600 truncate flex gap-2 items-center"
            >
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

              {teacher.name ?? "—"}
            </Link>
          </div>
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

export function TeacherRankingTable({
  academicPeriodId,
  departmentId,
}: TeacherRankingTableProps) {
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  const queryFn = useMemo(
    () => createTeacherRankingQueryFn(academicPeriodId, departmentId),
    [academicPeriodId, departmentId],
  );

  const toggleSort = () => {
    setSort((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <DataTable<TeacherRankingItem>
      columns={columns}
      queryFn={(params) => queryFn({ ...params, sort })}
      emptyMessage="No hay docentes registrados en esta evaluacion."
      searchPlaceholder="Buscar por docente, codigo..."
      pageSize={10}
      minWidthClassName="min-w-150"
      enableSorting={false}
      filters={
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
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
  );
}

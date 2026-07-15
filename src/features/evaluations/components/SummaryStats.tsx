import { Award, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

import type { EvaluationSummary } from "../types/TeacherEvaluation";
import { StatTile } from "@/shared/ui";

interface SummaryStatsProps {
  summary: EvaluationSummary | undefined;
  isLoading: boolean;
}

export function SummaryStats({ summary, isLoading }: SummaryStatsProps) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="mt-2.5 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatTile
        label="Promedio Departamento"
        value={
          summary.department_average != null
            ? summary.department_average.toFixed(2)
            : "—"
        }
        sub="/5.0"
        icon={<TrendingUp size={16} className="text-brand-600" />}
      />

      <StatTile
        label="Total Docentes"
        value={summary.teacher_count}
        icon={<Users size={16} className="text-muted-foreground" />}
      />

      <Link
        href={`/teachers/${summary.best_teacher?.teacher_id}`}
        className="block"
      >
        <StatTile
          label="Mejor Docente"
          value={
            summary.best_teacher ? (
              <span className="text-3xl">
                {summary.best_teacher.overall_average?.toFixed(2) ?? "—"}
              </span>
            ) : (
              "—"
            )
          }
          sub={summary.best_teacher?.name ?? undefined}
          icon={<Award size={16} className="text-emerald-600" />}
        />
      </Link>

      <Link
        href={`/teachers/${summary.worst_teacher?.teacher_id}`}
        className="block"
      >
        <StatTile
          label="Menor Promedio"
          value={
            summary.worst_teacher ? (
              <span className="text-3xl">
                {summary.worst_teacher.overall_average?.toFixed(2) ?? "—"}
              </span>
            ) : (
              "—"
            )
          }
          sub={summary.worst_teacher?.name ?? undefined}
          icon={<TrendingDown size={16} className="text-amber-600" />}
        />
      </Link>
    </div>
  );
}

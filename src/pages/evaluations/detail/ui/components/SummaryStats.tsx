import { Award, TrendingDown, TrendingUp, Users } from "lucide-react";

import type { EvaluationSummary } from "@/features/evaluations";
import { StatTile } from "@/shared/ui";
import { Link } from "wouter";

interface SummaryStatsProps {
  summary: EvaluationSummary | undefined;
}

export function SummaryStats({ summary }: SummaryStatsProps) {
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
        icon={<Users size={16} className="text-ink-400" />}
      />

      <Link
        href={`/teachers/${summary.best_teacher?.teacher_id}`}
        className="block"
      >
        <StatTile
          label="Mejor Docente"
          value={
            summary.best_teacher ? (
              <span className="text-[16px]">
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
              <span className="text-[16px]">
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

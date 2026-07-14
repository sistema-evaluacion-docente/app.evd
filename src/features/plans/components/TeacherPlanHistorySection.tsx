import { AlertTriangle, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiLineChart, type LineSeries } from "@/shared/ui/multi-line-chart";
import useTeacherPlanHistory from "../hooks/useTeacherPlanHistory";
import { StatusBadge } from "./PlanDetailBody";
import type { Plan, TeacherHistoryPeriod } from "../types/Plan";

/**
 * Categorical palette, fixed assignment (validated for CVD/contrast on both
 * surfaces): the overall average is always blue, each dimension keeps its hue
 * regardless of which periods have data.
 */
const SERIES_COLOR: Record<string, { light: string; dark: string }> = {
  "Promedio general": { light: "#2A6FDB", dark: "#2A6FDB" },
  "Desarrollo del Conocimiento": { light: "#D97757", dark: "#D06E4B" },
  "Desempeño Docente": { light: "#8A4FBE", dark: "#8A4FBE" },
  "Procesos de Evaluación": { light: "#15803D", dark: "#15803D" },
  "Integración Interpersonal": { light: "#C2830A", dark: "#C2830A" },
};

const FALLBACK_COLOR = { light: "#2A6FDB", dark: "#2A6FDB" };

interface TeacherPlanHistorySectionProps {
  teacherId: number;
}

/**
 * Director-facing history of a teacher: performance per period (overall +
 * dimensions), every improvement plan with its resolution, and recurrence
 * flags when the same indicator was planned in different periods.
 */
export function TeacherPlanHistorySection({
  teacherId,
}: TeacherPlanHistorySectionProps) {
  const { data, isLoading } = useTeacherPlanHistory(teacherId);
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  const history = data?.data;

  if (isLoading) {
    return (
      <Card className="space-y-4 p-5 sm:p-6">
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-40 w-full" />
      </Card>
    );
  }

  if (!history) return null;

  const { periods, plans, recurrences } = history;
  const series = buildSeries(periods, mode);

  return (
    <Card className="p-5 sm:p-6 animate-fade-in">
      <h2 className="text-lg font-semibold">
        Planes de Mejoramiento e Historial
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        Seguimiento entre periodos: desempeño por dimensión, planes registrados
        y su resolución.
      </p>

      {recurrences.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50/60 p-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-700">
            <AlertTriangle className="size-4" />
            Reincidencias detectadas
          </div>

          <p className="mt-1 text-[12.5px] text-muted-foreground">
            El docente ha recibido planes en periodos distintos sobre el mismo
            indicador:
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {recurrences.map((rec) => (
              <Badge
                key={`${rec.target_type}:${rec.target_ref ?? ""}`}
                className="border border-amber-200/70 bg-amber-50 text-amber-700"
              >
                {rec.label} · {rec.period_codes.join(", ")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {periods.length >= 2 && series.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Comparación entre periodos
          </h3>

          <MultiLineChart
            labels={periods.map((p) => p.period_code)}
            series={series}
            yMin={1}
            yMax={5}
            yTicks={[2, 3, 4, 5]}
            height={260}
          />
        </div>
      )}

      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Planes registrados
        </h3>

        {plans.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Este docente no ha tenido planes de mejoramiento.
          </p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <PlanHistoryRow key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/** Overall + one line per dimension; a series with missing periods is dropped
 * rather than drawn with holes. */
function buildSeries(
  periods: TeacherHistoryPeriod[],
  mode: "light" | "dark",
): LineSeries[] {
  if (periods.length === 0) return [];

  const colorOf = (label: string) =>
    (SERIES_COLOR[label] ?? FALLBACK_COLOR)[mode];

  const series: LineSeries[] = [];

  const overall = periods.map((p) => p.overall_average);
  if (overall.every((v) => v != null)) {
    series.push({
      key: "overall",
      label: "Promedio general",
      color: colorOf("Promedio general"),
      values: overall as number[],
    });
  }

  const dimensionNames = Object.keys(periods[0].dimensions);

  for (const dimension of dimensionNames) {
    const values = periods.map((p) => p.dimensions[dimension]);
    if (values.every((v) => v != null)) {
      series.push({
        key: dimension,
        label: dimension,
        color: colorOf(dimension),
        values: values as number[],
      });
    }
  }

  return series;
}

function PlanHistoryRow({ plan }: { plan: Plan }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/plans/${plan.id}`}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-foreground hover:text-brand-600 hover:underline"
          >
            {plan.title}
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </Link>

          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Origen {plan.origin_period_code ?? "—"} → Verificación{" "}
            {plan.verification_period_code ?? "pendiente"}
            {plan.close_reason ? ` · ${plan.close_reason}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="num text-[12px] font-semibold text-muted-foreground">
            {plan.progress}%
          </span>

          <StatusBadge status={plan.status} />
        </div>
      </div>

      {plan.items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {plan.items.map((item) => (
            <span
              key={item.id}
              className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {item.target_type === "QUESTION"
                ? `Ítem ${item.target_ref}`
                : (item.target_ref ?? "Cualitativo")}
              {item.status === "CUMPLIDO" && " ✓"}
              {item.status === "NO_CUMPLIDO" && " ✗"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

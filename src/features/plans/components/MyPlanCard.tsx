import { ArrowRight, Check, Clock, TrendingUp } from "lucide-react";
import { Link } from "wouter";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui";
import useMyPlans from "../hooks/useMyPlans";
import { isClosed } from "../lib/planStatus";
import { StatusBadge } from "./PlanDetailBody";

const STAGE_LABEL: Record<string, string> = {
  INICIO: "Inicio",
  MITAD: "Mitad de Semestre",
  SEMANA_16: "Semana 16",
};

/** Docente dashboard card: their current improvement plan, wired to real data. */
export default function MyPlanCard() {
  const { data, isLoading } = useMyPlans();

  const plans = data?.data ?? [];
  const plan = plans.find((p) => !isClosed(p.status)) ?? plans[0];

  if (isLoading) {
    return (
      <Card className="space-y-4 p-5 sm:p-6">
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="p-5 sm:p-6">
        <h2 className="text-[20px] font-semibold text-ink-900">
          Plan de Mejoramiento Docente
        </h2>

        <p className="mt-2 text-[13px] text-ink-500">
          No tienes planes de mejoramiento activos. Si tu director registra un
          plan de seguimiento contigo, aparecerá aquí.
        </p>
      </Card>
    );
  }

  const fulfilled = plan.items.filter((i) => i.status === "CUMPLIDO").length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-[20px] font-semibold text-ink-900">
            Plan de Mejoramiento Docente
          </h2>

          <p className="mt-1 text-[13px] text-ink-500">
            {plan.title} · Origen {plan.origin_period_code ?? "—"} →
            Verificación {plan.verification_period_code ?? "pendiente"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={plan.status} />

          <Link
            href="/my-plans"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold text-foreground hover:bg-muted"
          >
            Ver mi plan
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {plan.checkpoints.map((cp) => {
          const done = cp.status === "COMPLETADO";

          return (
            <div key={cp.id} className="rounded-lg border p-3 text-center">
              <div
                className={cn(
                  "mx-auto inline-flex h-9 w-9 items-center justify-center rounded-md",
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-ink-100 text-ink-400",
                )}
              >
                {done ? <Check size={18} strokeWidth={2.4} /> : <Clock size={16} />}
              </div>

              <div className="mt-2 text-[13px] font-semibold text-ink-900">
                {STAGE_LABEL[cp.stage] ?? cp.stage}
              </div>

              <div className="mt-0.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-500">
                {done ? "Completado" : "Pendiente"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[12px] font-semibold">
          <span className="inline-flex items-center gap-1.5 text-ink-700">
            <TrendingUp size={14} className="text-brand-600" />
            Compromisos cumplidos: {fulfilled}/{plan.items.length}
          </span>

          <span className="num text-ink-700">{plan.progress}%</span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full bg-brand-600 transition-all duration-500"
            style={{ width: `${plan.progress}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

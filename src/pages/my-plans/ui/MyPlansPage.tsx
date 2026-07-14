import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isClosed,
  PlanDetailBody,
  StatusBadge,
  useMyPlans,
  type Plan,
} from "@/features/plans";
import { cn } from "@/shared/lib/utils";
import { AppFooter, PageHeader } from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";

/**
 * Teacher-facing view: their improvement plans, where they follow the
 * compromisos and upload compliance evidence.
 */
export function MyPlansPage() {
  const { data, isLoading } = useMyPlans();

  const plans = useMemo(() => data?.data ?? [], [data]);

  // Land on the open plan (there is at most one per period in practice).
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activePlan = plans.find((plan) => !isClosed(plan.status));
  const currentId = selectedId ?? activePlan?.id ?? plans[0]?.id ?? null;

  return (
    <AppLayout>
      <PageHeader
        title="Mi Plan de Mejora"
        description="Compromisos acordados con tu director de departamento y las evidencias de su cumplimiento."
      />

      {isLoading && (
        <Card className="space-y-4 p-5 sm:p-6">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </Card>
      )}

      {!isLoading && plans.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            No tienes planes de mejoramiento activos.
          </p>

          <p className="mt-1 text-[13px] text-muted-foreground">
            Si tu director registra un plan de seguimiento contigo, aparecerá
            aquí.
          </p>
        </Card>
      )}

      {plans.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {plans.map((plan) => (
            <PlanTab
              key={plan.id}
              plan={plan}
              active={plan.id === currentId}
              onClick={() => setSelectedId(plan.id)}
            />
          ))}
        </div>
      )}

      {currentId != null && (
        <PlanDetailBody planId={currentId} viewer="teacher" />
      )}

      <AppFooter>Sistema de Evaluación Docente</AppFooter>
    </AppLayout>
  );
}

function PlanTab({
  plan,
  active,
  onClick,
}: {
  plan: Plan;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
        active
          ? "border-brand-200/70 bg-brand-50/60"
          : "hover:bg-muted",
      )}
    >
      <span className="font-medium">
        {plan.origin_period_code ?? "—"}
      </span>

      <StatusBadge status={plan.status} />
    </button>
  );
}

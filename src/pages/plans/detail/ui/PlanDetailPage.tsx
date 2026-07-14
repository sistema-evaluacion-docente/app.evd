import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";

import { PlanDetailBody } from "@/features/plans";
import { AppFooter } from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";

/** Director/admin view of a single plan, with acta, evidencias and actions. */
export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const planId = parseInt(id ?? "0", 10);

  return (
    <AppLayout>
      <Link
        href="/plans"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a planes
      </Link>

      <PlanDetailBody planId={planId} viewer="manager" />

      <AppFooter>Sistema de Evaluación Docente</AppFooter>
    </AppLayout>
  );
}

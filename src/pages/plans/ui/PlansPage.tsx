import { Plus } from "lucide-react";
import { useState } from "react";

import DataTable, { type DataTableAction } from "@/components/common/DataTable";
import { usePeriodsStore } from "@/features/periods";
import {
  CreatePlanModal,
  PlanDetailModal,
  PLAN_STATUS_FILTERS,
  useAtRiskTeachers,
  useGetPlans,
  usePlanColumns,
  type Plan,
} from "@/features/plans";
import { AppFooter, Button, FilterPills, PageHeader } from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";

export function PlansPage() {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);
  const periodId = selectedPeriod?.id ? Number(selectedPeriod.id) : undefined;

  const [statusFilter, setStatusFilter] = useState("todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const columns = usePlanColumns();

  const { data: atRiskData } = useAtRiskTeachers(periodId);
  const atRiskTeachers = atRiskData?.data ?? [];

  const rowActions: DataTableAction<Plan>[] = [
    {
      label: "Ver detalle",
      onClick: (plan) => setDetailId(plan.id),
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Planes de Seguimiento"
        description="Gestión y trazabilidad de los compromisos de mejoramiento docente."
        actions={
          <Button variant="brand" size="lg" onClick={() => setCreateOpen(true)}>
            <Plus size={16} strokeWidth={2.25} />
            Crear Nuevo Plan
          </Button>
        }
      />

      <DataTable
        columns={columns}
        queryFn={useGetPlans}
        extraFilterParams={{ status: statusFilter, period_id: periodId }}
        rowActions={rowActions}
        actionsHeaderLabel="Acción"
        searchPlaceholder="Buscar docentes o planes..."
        emptyMessage="Aún no hay planes de seguimiento."
        filters={
          <FilterPills
            value={statusFilter}
            onChange={setStatusFilter}
            options={PLAN_STATUS_FILTERS}
          />
        }
      />

      <AppFooter>
        {selectedPeriod
          ? `Periodo ${selectedPeriod.code} · Sistema de Evaluación Docente`
          : "Sistema de Evaluación Docente"}
      </AppFooter>

      <CreatePlanModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        originPeriodId={periodId}
        atRiskTeachers={atRiskTeachers}
      />

      <PlanDetailModal planId={detailId} onClose={() => setDetailId(null)} />
    </AppLayout>
  );
}

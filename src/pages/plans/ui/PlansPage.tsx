import { Plus } from "lucide-react";
import { useState } from "react";

import DataTable, { type DataTableAction } from "@/components/common/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeriodsStore } from "@/features/periods";
import {
  CreatePlanModal,
  PlanDetailModal,
  PLAN_STATUS_FILTERS,
  PLAN_STATUS_FILTER_ALL,
  useAtRiskTeachers,
  useGetPlans,
  usePlanColumns,
  type Plan,
} from "@/features/plans";
import { AppFooter, PageHeader } from "@/shared/ui";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/widgets/layout";

export function PlansPage() {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);
  const periodId = selectedPeriod?.id ? Number(selectedPeriod.id) : undefined;

  const [statusFilter, setStatusFilter] = useState(PLAN_STATUS_FILTER_ALL);
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
          <Button type="button" onClick={() => setCreateOpen(true)} className="cursor-pointer">
            <Plus size={14} strokeWidth={2.25} />
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
          <Select
            items={PLAN_STATUS_FILTERS}
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value ?? PLAN_STATUS_FILTER_ALL)
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>

            <SelectContent alignItemWithTrigger={false}>
              {PLAN_STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";
import { FileUp } from "lucide-react";
import { Link, useLocation } from "wouter";

import DataTable, { type DataTableAction } from "@/components/common/DataTable";
import type { EvaluationRecord } from "@/features/evaluations";
import {
  useEvaluationColumns,
  useGetEvaluations,
  useUpdateEvaluationStatus,
} from "@/features/evaluations";

export function EvaluationsPage() {
  const [, setLocation] = useLocation();

  const columns = useEvaluationColumns();

  const { mutate: toggleStatus, isPending: isTogglingStatus } =
    useUpdateEvaluationStatus();

  const rowActions: DataTableAction<EvaluationRecord>[] = [
    {
      label: "Ver Detalle",
      onClick(row) {
        setLocation(`/evaluations/${row.id}`);
      },
    },
    {
      label: "Activar",
      visible: (row) => !row.active,
      className: "text-emerald-600 focus:text-emerald-700",
      onClick: (row) => toggleStatus({ evaluationId: row.id, active: true }),
      disabled: () => isTogglingStatus,
    },
    {
      label: "Desactivar",
      variant: "destructive",
      visible: (row) => row.active,
      onClick: (row) => toggleStatus({ evaluationId: row.id, active: false }),
      disabled: () => isTogglingStatus,
    },
  ];

  return (
    <AppLayout
      header={{ userName: "Director Depto.", userRole: "Ciencias Básicas" }}
    >
      <PageHeader
        title="Evaluaciones"
        description="Gestione las evaluaciones docentes del periodo académico."
      />

      <div className="flex items-center justify-end gap-2 -mt-3">
        <Link href="/evaluations/upload">
          <Button size="sm">
            <FileUp className="size-4" />
            Cargar evaluación
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        queryFn={useGetEvaluations}
        emptyMessage="No hay evaluaciones para mostrar."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        searchPlaceholder="Buscar evaluación..."
      />
    </AppLayout>
  );
}

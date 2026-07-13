import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { PageHeader } from "@/shared/ui";
import { FileUp } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

import DataTable, { type DataTableAction } from "@/components/common/DataTable";
import type { EvaluationRecord } from "@/features/evaluations";
import {
  useEvaluationColumns,
  useGetEvaluations,
  useUpdateEvaluationStatus,
} from "@/features/evaluations";

export function EvaluationsContent() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState("");

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
    <>
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
        searchPlaceholder="Buscar evaluación..."
        emptyMessage="No hay evaluaciones para mostrar."
        pageSize={10}
        extraFilterParams={{
          sort_by: sortBy || undefined,
        }}
        filters={
          <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "")}>
            <SelectTrigger>
              <span className="text-sm text-muted-foreground">
                {sortBy === "average_asc"
                  ? "Menor promedio"
                  : sortBy === "average_desc"
                    ? "Mayor promedio"
                    : "Ordenar por promedio"}
              </span>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="average_asc">Menor promedio</SelectItem>
              <SelectItem value="average_desc">Mayor promedio</SelectItem>
            </SelectContent>
          </Select>
        }
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
      />
    </>
  );
}

import { useMemo, useState } from "react";

import DataTable, { type DataTableAction } from "@/components/common/DataTable";
import { useGetAudits, useLogsColumns, type Audit } from "@/features/audits";
import { PageHeader } from "@/shared/ui";
import { AuditDetailDrawer } from "./AuditDetailDrawer";

export function LogsContent() {
  const columns = useLogsColumns();
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const rowActions = useMemo<DataTableAction<Audit>[]>(
    () => [
      {
        label: "Ver detalle",
        onClick: (audit) => {
          setSelectedAuditId(audit.id);
          setIsDrawerOpen(true);
        },
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Logs del Sistema"
        description="Registro completo de actividades realizadas en la plataforma para auditoría y trazabilidad."
      />

      <DataTable
        columns={columns}
        queryFn={useGetAudits}
        enableSearch={false}
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
      />

      <AuditDetailDrawer
        open={isDrawerOpen}
        auditId={selectedAuditId}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) setSelectedAuditId(null);
        }}
      />
    </>
  );
}

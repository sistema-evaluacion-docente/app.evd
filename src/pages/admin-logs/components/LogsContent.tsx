import DataTable from "@/components/common/DataTable";
import { useGetAudits, useLogsColumns } from "@/features/audits";
import { AdminViewBadge, PageHeader } from "@/shared/ui";

export function LogsContent() {
  const columns = useLogsColumns();

  return (
    <>
      <PageHeader
        badge={<AdminViewBadge />}
        title="Logs del Sistema"
        description="Registro completo de actividades realizadas en la plataforma para auditoría y trazabilidad."
      />

      <DataTable
        columns={columns}
        queryFn={useGetAudits}
        enableSearch={false}
        emptyMessage="Sin registros que coincidan con los filtros aplicados."
      />
    </>
  );
}

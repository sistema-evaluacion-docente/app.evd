import { useMemo, useState } from "react";

import DataTable, { type DataTableAction } from "@/components/common/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAudits, useLogsColumns, type Audit } from "@/features/audits";
import { PageHeader } from "@/shared/ui";
import { AuditDetailDrawer } from "./AuditDetailDrawer";

const TABLE_NAMES = [
  { value: "departments", label: "Departamentos" },
  { value: "users", label: "Usuarios" },
  { value: "teachers", label: "Docentes" },
  { value: "periods", label: "Periodos" },
  { value: "directors", label: "Directores" },
  { value: "evaluations", label: "Evaluaciones" },
  { value: "plans", label: "Planes" },
  { value: "subjects", label: "Materias" },
] as const;

const OPERATIONS = [
  { value: "CREATE", label: "Crear" },
  { value: "UPDATE", label: "Actualizar" },
  { value: "DELETE", label: "Eliminar" },
  { value: "LOGIN", label: "Inicio sesión" },
  { value: "IMPORT", label: "Importar" },
  { value: "EXPORT", label: "Exportar" },
] as const;

export function LogsContent() {
  const columns = useLogsColumns();

  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [operation, setOperation] = useState("");

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

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          value={tableName}
          onValueChange={(value) => setTableName(value ?? "")}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas las tablas" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="">Todas las tablas</SelectItem>

            {TABLE_NAMES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={operation}
          onValueChange={(value) => setOperation(value ?? "")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="">Todas las acciones</SelectItem>

            {OPERATIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        key={`${tableName}-${operation}`}
        columns={columns}
        queryFn={useGetAudits}
        enableSearch
        searchPlaceholder="Buscar por descripción, elemento..."
        rowActions={rowActions}
        actionsHeaderLabel="Acciones"
        extraFilterParams={{
          table_name: tableName || undefined,
          operation: operation || undefined,
        }}
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

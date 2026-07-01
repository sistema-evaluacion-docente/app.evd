import type { ColumnDef } from "@tanstack/react-table";

import DataTable from "@/components/common/DataTable";
import { usePeriodsStore } from "@/features/periods/store/periodsStore";
import useGetCommentsByPeriodFromStore from "../hooks/useGetCommentsByPeriodFromStore";
import type { CommentPeriod } from "../types/CommentPeriod";

const RISK_LABELS: Record<number, string> = {
  0: "Sin riesgo",
  1: "Bajo",
  2: "Medio",
  3: "Alto",
};

const columns: ColumnDef<CommentPeriod>[] = [
  {
    accessorKey: "original_text",
    header: "Comentario",
    cell: ({ getValue }) => {
      const value = getValue() as string | null;
      return (
        <div className="max-w-120 truncate" title={value ?? ""}>
          {value ?? "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "risk_level",
    header: "Nivel de Riesgo",
    cell: ({ getValue }) => {
      const value = getValue() as number | null;
      if (value === null || value === undefined) return "—";
      return <span>{RISK_LABELS[value] ?? value}</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return new Date(value).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
  },
];

function CommentsPeriodTable() {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  if (!selectedPeriod?.id) {
    return (
      <div className="mt-6 text-center text-muted-foreground">
        Seleccione un período académico para ver los comentarios.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-md font-semibold mb-4">
        Comentarios del Período - {selectedPeriod.name}
      </h2>

      <div className="space-y-4">
        <DataTable<CommentPeriod>
          columns={columns}
          queryFn={useGetCommentsByPeriodFromStore}
          emptyMessage="No se encontraron comentarios para este período."
          searchPlaceholder="Buscar por docente..."
        />
      </div>
    </div>
  );
}

export default CommentsPeriodTable;

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ColumnDef } from "@tanstack/react-table";

import DataTable from "@/components/common/DataTable";
import { usePeriodsStore } from "@/features/periods/store/periodsStore";
import { Link, useLocation } from "wouter";
import useGetTeachersByPeriodFromStore from "../hooks/useGetTeachersByPeriodFromStore";
import type { TeacherPeriod } from "../types/TeacherPeriod";

const columns: ColumnDef<TeacherPeriod>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ getValue, row }) => {
      const value = getValue() as string;

      return (
        <Link
          className="flex items-center gap-2"
          href={`/teachers/${row.original.teacher_id}`}
        >
          <Avatar>
            <AvatarFallback>{value.slice(0, 2).toUpperCase()}</AvatarFallback>

            <AvatarImage src={row.original.avatar_url} />
          </Avatar>

          <span>{value}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: "institutional_code",
    header: "Código",
  },
  {
    accessorKey: "group_count",
    header: "Grupos",
  },
  {
    accessorKey: "overall_average",
    header: "Promedio General",
    cell: ({ getValue }) => {
      const value = getValue() as number;

      return (
        <div>
          <span className="font-semibold">{value.toFixed(2)}</span>{" "}
          <span className="text-muted-foreground">/ 5</span>
        </div>
      );
    },
  },
];

function TeacherPeriodTable() {
  const [, setLocation] = useLocation();

  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  if (!selectedPeriod?.id) {
    return (
      <div className="mt-6 text-center text-muted-foreground">
        Seleccione un período académico para ver los docentes.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-md font-semibold mb-4">
        Docentes del Período - {selectedPeriod.name}
      </h2>

      <div className="space-y-4">
        <DataTable<TeacherPeriod>
          columns={columns}
          queryFn={useGetTeachersByPeriodFromStore}
          emptyMessage="No se encontraron docentes para este período."
          searchPlaceholder="Buscar docente..."
          actionsHeaderLabel="Acciones"
          rowActions={[
            {
              label: "Ver Detalle",
              onClick: (teacher) => {
                setLocation(`/teachers/${teacher.teacher_id}`);
              },
            },
          ]}
        />
      </div>
    </div>
  );
}

export default TeacherPeriodTable;

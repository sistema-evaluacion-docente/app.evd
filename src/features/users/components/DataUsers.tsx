import { Badge } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import DataTable from "@/components/common/DataTable";
import type { User } from "@/features/auth/types/User";
import formatDate from "@/lib/formatDate";

import useGetUsers from "../hooks/useGetUsers";

const columnHelper = createColumnHelper<User>();

function DataUsers() {
  const { data, isLoading, isError, error } = useGetUsers(1);

  const users = useMemo(() => data?.data ?? [], [data]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nombre",
        cell: (info) => <div>{info.getValue()}</div>,
      }),
      columnHelper.accessor("username", {
        header: "Usuario",
        cell: (info) => <span>@{info.getValue()}</span>,
      }),
      columnHelper.accessor("email", {
        header: "Correo",
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor("roles", {
        header: "Roles",
        enableSorting: false,
        cell: (info) => {
          const roles = info.getValue();
          return (
            <div className="flex flex-wrap gap-1.5">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge variant="outline" key={role}>
                    {role}
                  </Badge>
                ))
              ) : (
                <span>Sin rol</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("active", {
        header: "Estado",
        cell: (info) => (
          <Badge
            className={
              info.getValue()
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white"
            }
          >
            {info.getValue() ? "Activo" : "Inactivo"}
          </Badge>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Creado",
        cell: (info) => <span>{formatDate(info.getValue())}</span>,
      }),
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-ink-100 bg-white p-6 text-sm text-ink-500">
        Cargando usuarios...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Error al cargar usuarios:{" "}
        {error instanceof Error ? error.message : "Error desconocido"}
      </div>
    );
  }

  return (
    <DataTable
      data={users}
      columns={columns}
      emptyMessage="No hay usuarios para mostrar."
    />
  );
}

export default DataUsers;

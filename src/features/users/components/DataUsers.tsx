import { Badge } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import DataTable from "@/components/common/DataTable";
import type { User } from "@/features/auth/types/User";
import formatDate from "@/lib/formatDate";

import useGetUsers from "../hooks/useGetUsers";
import { useDebounce } from "use-debounce";

const columnHelper = createColumnHelper<User>();

function DataUsers() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [value] = useDebounce(globalFilter ?? "", 400);

  const { data, isLoading, isFetching, isError } = useGetUsers({
    page: 1,
    search: value,
  });

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

  return (
    <DataTable
      data={users}
      columns={columns}
      emptyMessage="No hay usuarios para mostrar."
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      isLoading={isLoading || isFetching}
      isError={isError}
    />
  );
}

export default DataUsers;

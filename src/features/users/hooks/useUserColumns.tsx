import { Badge } from "@/components/ui/badge";
import type { User } from "@/features/auth/types/User";
import formatDate from "@/lib/formatDate";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

const columnHelper = createColumnHelper<User>();

export default function useUserColumns() {
  return useMemo(
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
}

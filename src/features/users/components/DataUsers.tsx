import { Badge } from "@/components/ui/badge";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { User } from "@/features/auth/types/User";
import useGetUsers from "../hooks/useGetUsers";
import formatDate from "@/lib/formatDate";

const columnHelper = createColumnHelper<User>();

function DataUsers() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data, isLoading, isError, error } = useGetUsers(1);

  const users = useMemo(() => data?.data ?? [], [data]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nombre",
        cell: (info) => <div className="">{info.getValue()}</div>,
      }),
      columnHelper.accessor("username", {
        header: "Usuario",
        cell: (info) => <span className="">@{info.getValue()}</span>,
      }),
      columnHelper.accessor("email", {
        header: "Correo",
        cell: (info) => <span className="">{info.getValue()}</span>,
      }),
      columnHelper.accessor("roles", {
        header: "Roles",
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
                <span className="">Sin rol</span>
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
        cell: (info) => <span className="">{formatDate(info.getValue())}</span>,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
    <div className="overflow-x-auto rounded-lg border bg-background">
      <table className="w-full min-w-230 text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-ink-200 bg-background/50 font-semibold uppercase"
            >
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    className="px-5 py-3 text-left font-semibold first:pl-6 last:pr-6"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-14 text-center text-[13px] text-ink-500"
              >
                No hay usuarios para mostrar.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-ink-100 transition-colors hover:bg-ink-50/60"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-5 py-3 align-middle first:pl-6 last:pr-6"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataUsers;

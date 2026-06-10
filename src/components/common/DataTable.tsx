import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  emptyMessage?: string;
  minWidthClassName?: string;
  containerClassName?: string;
  tableClassName?: string;
  headRowClassName?: string;
  bodyRowClassName?: string;
  headerCellClassName?: string;
  cellClassName?: string;
  enableSorting?: boolean;
}

function DataTable<TData>({
  data,
  columns,
  emptyMessage = "Sin datos para mostrar.",
  minWidthClassName = "min-w-230",
  containerClassName,
  tableClassName,
  headRowClassName,
  bodyRowClassName,
  headerCellClassName,
  cellClassName,
  enableSorting = true,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting,
  });

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border bg-background",
        containerClassName,
      )}
    >
      <table
        className={cn("w-full text-sm", minWidthClassName, tableClassName)}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className={cn(
                "border-b border-ink-200 bg-background/50 font-semibold uppercase",
                headRowClassName,
              )}
            >
              {headerGroup.headers.map((header) => {
                const canSort = enableSorting && header.column.getCanSort();
                const sorted = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    className={cn(
                      "px-5 py-3 text-left font-semibold first:pl-6 last:pr-6",
                      headerCellClassName,
                    )}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {sorted === "asc" ? "▲" : null}
                        {sorted === "desc" ? "▼" : null}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
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
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-ink-100 transition-colors hover:bg-ink-50/60",
                  bodyRowClassName,
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-5 py-3 align-middle first:pl-6 last:pr-6",
                      cellClassName,
                    )}
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

export default DataTable;

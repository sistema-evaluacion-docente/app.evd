import { cn } from "@/lib/utils";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import type { ResponseAPI } from "@/shared/types/Response";

interface DataTableProps<TData> {
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
  enableSearch?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  queryFn: (params: {
    page: number;
    limit: number;
    search: string;
  }) => UseQueryResult<ResponseAPI<TData[]>>;
}

function DataTable<TData>({
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
  enableSearch = true,
  searchPlaceholder = "Buscar...",
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  queryFn,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [value] = useDebounce(globalFilter ?? "", 400);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const { data, isLoading } = queryFn({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: value,
  });

  console.log(data);

  const result = (data?.data ?? []) as TData[];

  const table = useReactTable({
    data: result,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
  });

  return (
    <>
      {enableSearch ? (
        <div className="flex gap-2 items-center">
          <Input
            type="text"
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter?.(event.target.value)}
            placeholder={searchPlaceholder}
            className="bg-background"
          />
        </div>
      ) : null}

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
                  "border-b bg-background/50 uppercase",
                  headRowClassName,
                )}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "px-5 py-3 text-left first:pl-6 last:pr-6 font-semibold bg-muted/50 text-muted-foreground",
                        headerCellClassName,
                      )}
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
            <>
              {isLoading ? (
                <>
                  {[0, 1, 2, 3, 4].map((el) => (
                    <tr key={el} className="w-full">
                      {columns.map((cell) => (
                        <td key={cell.id} className="w-auto px-2 py-1">
                          <Skeleton className="w-full h-8" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="text-center py-10"
                      >
                        <p className="text-muted-foreground">{emptyMessage}</p>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b transition-colors",
                          bodyRowClassName,
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn(
                              "px-5 py-4 align-middle first:pl-6 last:pr-6",
                              cellClassName,
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </>
              )}
            </>
          </tbody>
        </table>
      </div>

      {!isLoading && table.getRowModel().rows.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>Filas por página</span>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                {table.getState().pagination.pageSize}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-24">
                {pageSizeOptions.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => table.setPageSize(size)}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount() || 1}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default DataTable;

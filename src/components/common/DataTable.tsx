import { cn } from "@/lib/utils";
import type { ResponseAPI } from "@/shared/types/Response";
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
import { EllipsisVertical, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
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

export interface DataTableAction<TData> {
  label: string;
  onClick: (row: TData) => void;
  variant?: "default" | "destructive";
  className?: string;
  disabled?: (row: TData) => boolean;
  visible?: (row: TData) => boolean;
}

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  rowActions?: DataTableAction<TData>[];
  actionsHeaderLabel?: string;
  queryFn: (params: {
    page: number;
    limit: number;
    search: string;
  }) => UseQueryResult<ResponseAPI<TData[]>>;
}

/**
 * Get a URL parameter as a number, with a fallback value.
 * @param paramName The name of the URL parameter to retrieve.
 * @param fallback The fallback value to return if the parameter is not found or is invalid.
 * @returns The parsed URL parameter as a number, or the fallback value if not found or invalid.
 */
function getUrlParamNumber(paramName: string, fallback: number) {
  if (typeof window === "undefined") return fallback;

  const rawValue = new URLSearchParams(window.location.search).get(paramName);

  if (!rawValue) return fallback;

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 1) return fallback;

  return Math.floor(parsed);
}

/**
 * Get a URL parameter as a string, with a fallback value.
 * @param paramName The name of the URL parameter to retrieve.
 * @param fallback The fallback value to return if the parameter is not found or is invalid.
 * @returns The parsed URL parameter as a string, or the fallback value if not found or invalid.
 */
function getUrlParamString(paramName: string, fallback = "") {
  if (typeof window === "undefined") return fallback;

  const rawValue = new URLSearchParams(window.location.search).get(paramName);

  return rawValue ?? fallback;
}

/**
 * DataTable component that displays a table with sorting, searching, and pagination capabilities.
 * @template TData The type of data to display in the table.
 */
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
  rowActions = [],
  actionsHeaderLabel = "Acciones",
  queryFn,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState(() =>
    getUrlParamString("search", ""),
  );
  const [value] = useDebounce(globalFilter ?? "", 400);

  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: getUrlParamNumber("page", 1) - 1,
    pageSize: getUrlParamNumber("limit", pageSize),
  }));

  const { data, isLoading, isFetching, refetch } = queryFn({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: value,
  });

  console.log(data);

  const result = (data?.data ?? []) as TData[];
  const hasRowActions = rowActions.length > 0;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    params.set("page", String(pagination.pageIndex + 1));
    params.set("limit", String(pagination.pageSize));

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${
      queryString ? `?${queryString}` : ""
    }${window.location.hash}`;

    window.history.replaceState(null, "", nextUrl);
  }, [pagination.pageIndex, pagination.pageSize, value]);

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
      <div className="flex gap-2 items-center">
        {enableSearch ? (
          <Input
            type="text"
            value={globalFilter ?? ""}
            onChange={(event) => {
              setGlobalFilter?.(event.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            placeholder={searchPlaceholder}
            className="bg-background"
          />
        ) : null}

        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0"
        >
          <RotateCcw className={cn("size-4", isFetching && "animate-spin")} />
          Recargar
        </Button>
      </div>

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

                {hasRowActions ? (
                  <th
                    className={cn(
                      "px-5 py-3 text-right first:pl-6 last:pr-6 font-semibold bg-muted/50 text-muted-foreground",
                      headerCellClassName,
                    )}
                  >
                    {actionsHeaderLabel}
                  </th>
                ) : null}
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

                      {hasRowActions ? (
                        <td className="w-auto px-2 py-1">
                          <Skeleton className="w-full h-8" />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + (hasRowActions ? 1 : 0)}
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

                        {hasRowActions ? (
                          <td
                            className={cn(
                              "px-5 py-4 align-middle text-right first:pl-6 last:pr-6",
                              cellClassName,
                            )}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <EllipsisVertical />
                                  </Button>
                                }
                              ></DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                className="w-auto min-w-40"
                              >
                                {rowActions
                                  .filter((action) =>
                                    action.visible
                                      ? action.visible(row.original)
                                      : true,
                                  )
                                  .map((action) => (
                                    <DropdownMenuItem
                                      key={action.label}
                                      variant={action.variant ?? "default"}
                                      className={action.className}
                                      disabled={
                                        action.disabled
                                          ? action.disabled(row.original)
                                          : false
                                      }
                                      onClick={() =>
                                        action.onClick(row.original)
                                      }
                                    >
                                      {action.label}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        ) : null}
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

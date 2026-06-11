import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  minWidthClassName?: string;
  containerClassName?: string;
  tableClassName?: string;
  headRowClassName?: string;
  bodyRowClassName?: string;
  headerCellClassName?: string;
  cellClassName?: string;
  globalFilter?: string;
  setGlobalFilter?: (filter: string) => void;
  enableSorting?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
}

function DataTable<TData>({
  data,
  columns,
  isLoading,
  emptyMessage = "Sin datos para mostrar.",
  minWidthClassName = "min-w-230",
  containerClassName,
  tableClassName,
  headRowClassName,
  bodyRowClassName,
  headerCellClassName,
  cellClassName,
  globalFilter,
  setGlobalFilter,
  enableSorting = true,
  enableSearch = true,
  searchPlaceholder = "Buscar...",
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
    </>
  );
}

export default DataTable;

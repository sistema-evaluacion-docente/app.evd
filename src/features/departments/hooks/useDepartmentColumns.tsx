import { Badge } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import type { Department } from "../types/Department";

const columnHelper = createColumnHelper<Department>();

export default function useDepartmentColumns() {
  return useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => (
          <span className="font-mono text-xs">{info.getValue()}</span>
        ),
      }),

      columnHelper.accessor("name", {
        header: "Nombre",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),

      columnHelper.accessor("code", {
        header: "Código",
        cell: (info) => {
          const code = info.getValue();
          return code ?? <span className="text-muted-foreground">—</span>;
        },
      }),

      columnHelper.accessor("active", {
        header: "Activo",
        cell: (info) => (
          <Badge
            className={
              info.getValue()
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white"
            }
          >
            {info.getValue() ? "Sí" : "No"}
          </Badge>
        ),
      }),
    ],
    [],
  );
}

import { Badge } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import type { Setting } from "../types/Setting";

const columnHelper = createColumnHelper<Setting>();

export default function useSettingColumns() {
  return useMemo(
    () => [
      columnHelper.accessor("key", {
        header: "Clave",
        cell: (info) => (
          <span className="font-mono text-xs">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("value", {
        header: "Valor",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("value_type", {
        header: "Tipo",
        cell: (info) => (
          <Badge variant="outline" className="uppercase text-xs">
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Descripción",
        cell: (info) => (
          <span className="text-muted-foreground text-sm">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
    ],
    [],
  );
}

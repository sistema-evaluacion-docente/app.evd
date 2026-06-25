import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import formatDate from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import type { Audit } from "../types/Audit";

type LogAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "IMPORT"
  | "EXPORT";

const ACTIONS: Record<
  LogAction,
  { label: string; bg: string; text: string; border: string }
> = {
  CREATE: {
    label: "Crear",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/70",
  },
  UPDATE: {
    label: "Actualizar",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200/70",
  },
  DELETE: {
    label: "Eliminar",
    bg: "bg-brand-50",
    text: "text-brand-700",
    border: "border-brand-100",
  },
  LOGIN: {
    label: "Inicio sesión",
    bg: "bg-ink-100",
    text: "text-ink-700",
    border: "border-ink-200",
  },
  LOGOUT: {
    label: "Cierre sesión",
    bg: "bg-ink-100",
    text: "text-ink-700",
    border: "border-ink-200",
  },
  IMPORT: {
    label: "Importar",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200/70",
  },
  EXPORT: {
    label: "Exportar",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/70",
  },
};

const columnHelper = createColumnHelper<Audit>();

export default function useLogsColumns() {
  return useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "#",
        enableSorting: true,
        cell: (info) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {String(info.getValue()).padStart(4, "0")}
          </span>
        ),
      }),
      columnHelper.accessor("user_id", {
        header: "Usuario",
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {info.row.original.user_name?.charAt(0).toUpperCase()}
              </AvatarFallback>

              <AvatarImage src={info.row.original.user_avatar} />
            </Avatar>

            <div className="leading-tight">
              <div className="text-sm text-foreground">
                {info.row.original.user_name}
              </div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("table_name", {
        header: "Tabla afectada",
        enableSorting: false,
        cell: (info) => (
          <span className="text-sm text-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("operation", {
        header: "Acción",
        enableSorting: true,
        cell: (info) => {
          const action = ACTIONS[info.getValue() as LogAction] ?? {
            label: info.getValue(),
            bg: "bg-muted",
            text: "text-muted-foreground",
            border: "border-border",
          };

          return (
            <span
              className={cn(
                "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-wide",
                action.bg,
                action.text,
                action.border,
              )}
            >
              {action.label}
            </span>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: "Fecha",
        enableSorting: true,
        cell: (info) => {
          const formatted = formatDate(info.getValue());

          return (
            <div className="whitespace-nowrap" title={formatted}>
              <div className="text-sm text-foreground">{formatted}</div>
            </div>
          );
        },
      }),
    ],
    [],
  );
}

import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import { cn } from "@/shared/lib/utils";
import { Avatar } from "@/shared/ui";
import { statusMeta } from "../lib/planStatus";
import type { Plan } from "../types/Plan";

const columnHelper = createColumnHelper<Plan>();

export default function usePlanColumns() {
  return useMemo(
    () => [
      columnHelper.accessor("teacher_name", {
        header: "Docente",
        cell: (info) => {
          const plan = info.row.original;
          const name = info.getValue() ?? "Docente";

          return (
            <div className="flex items-center gap-3">
              <Avatar name={name} size={40} paletteIndex={plan.teacher_id} />
              <div className="leading-tight">
                <div className="text-[14px] font-semibold text-foreground">
                  {name}
                </div>
                <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Origen {plan.origin_period_code ?? "—"}
                </div>
              </div>
            </div>
          );
        },
      }),

      columnHelper.accessor("title", {
        header: "Plan de Seguimiento",
        cell: (info) => {
          const plan = info.row.original;

          return (
            <div className="max-w-95">
              <div className="text-[14px] font-semibold leading-snug text-foreground">
                {info.getValue()}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {plan.items.length} compromiso(s) · Verif.{" "}
                {plan.verification_period_code ?? "pendiente"}
              </div>
            </div>
          );
        },
      }),

      columnHelper.accessor("progress", {
        header: "Progreso",
        cell: (info) => {
          const progress = info.getValue();
          const meta = statusMeta(info.row.original.status);

          return (
            <div className="min-w-37.5">
              <div className="mb-1.5">
                <span
                  className={cn(
                    "num text-[13px] font-semibold tabular-nums",
                    meta.text,
                  )}
                >
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full transition-all duration-500", meta.bar)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        },
      }),

      columnHelper.accessor("status", {
        header: "Estado",
        cell: (info) => {
          const meta = statusMeta(info.getValue());

          return (
            <span
              className={cn(
                "inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full border px-3 text-[12px] font-semibold",
                meta.bg,
                meta.text,
                meta.border,
              )}
            >
              {meta.label}
            </span>
          );
        },
      }),
    ],
    [],
  );
}

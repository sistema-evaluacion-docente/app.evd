import { Badge } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "wouter";

import { API_URL } from "@/config";
import type { EvaluationRecord } from "../api/evaluationService";

const columnHelper = createColumnHelper<EvaluationRecord>();

const STATUS_MAP: Record<
  EvaluationRecord["status"],
  { label: string; className: string }
> = {
  PROCESSING: { label: "Procesando", className: "bg-amber-500 text-white" },
  COMPLETED: { label: "Completado", className: "bg-emerald-500 text-white" },
  FAILED: { label: "Fallido", className: "bg-red-500 text-white" },
};

export default function useEvaluationColumns() {
  return useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => (
          <Link
            href={`/evaluations/${info.getValue()}`}
            className="font-mono text-xs text-brand-600 hover:text-brand-700 hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),

      columnHelper.accessor("academic_period_name", {
        header: "Periodo",
        cell: (info) => {
          const name = info.getValue();
          return name ?? <span className="text-muted-foreground">—</span>;
        },
      }),

      columnHelper.accessor("status", {
        header: "Estado",
        cell: (info) => {
          const status = info.getValue();
          const config = STATUS_MAP[status];
          return <Badge className={config.className}>{config.label}</Badge>;
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

      columnHelper.accessor("count", {
        header: "Docentes",
        cell: (info) => {
          const count = info.getValue();
          return count != null ? count : "—";
        },
      }),

      columnHelper.accessor("pdf_url", {
        header: "PDF",
        cell: (info) => {
          const url = info.getValue();

          if (!url) return "—";

          return (
            <a
              href={`${API_URL}/${url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 underline underline-offset-2 text-xs"
            >
              Ver PDF
            </a>
          );
        },
      }),
    ],
    [],
  );
}

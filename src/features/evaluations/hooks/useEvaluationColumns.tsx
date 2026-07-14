import { Badge } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import { API_URL } from "@/config";
import { Link } from "wouter";
import type { EvaluationRecord } from "../types/Evaluation";

const columnHelper = createColumnHelper<EvaluationRecord>();

const STATUS_MAP: Record<
  EvaluationRecord["status"],
  { label: string; className: string }
> = {
  PROCESSING: {
    label: "Procesando",
    className: "bg-amber-50 text-amber-700",
  },
  COMPLETED: {
    label: "Completado",
    className: "bg-emerald-50 text-emerald-700",
  },
  FAILED: { label: "Fallido", className: "bg-red-50 text-red-700" },
};

export default function useEvaluationColumns() {
  return useMemo(
    () => [
      columnHelper.accessor("academic_period_name", {
        header: "Periodo",
        cell: (info) => {
          const name = info.getValue();

          return (
            <Link to={`/evaluations/${info.row.original.id}`}>
              {name ?? <span className="text-muted-foreground">—</span>}
            </Link>
          );
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
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }
          >
            {info.getValue() ? "Sí" : "No"}
          </Badge>
        ),
      }),

      columnHelper.accessor("overall_average", {
        header: "Promedio",
        cell: (info) => {
          const avg = info.getValue();
          return (
            <span className="font-semibold">
              {avg != null ? avg.toFixed(2) : "—"}
            </span>
          );
        },
      }),

      columnHelper.accessor("count", {
        header: "Docentes",
        cell: (info) => {
          const count = info.getValue();
          return (
            <Link to={`/evaluations/${info.row.original.id}`}>
              {count != null ? count : "—"}
            </Link>
          );
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
              className="text-brand-700 hover:text-brand-800 underline underline-offset-2 text-xs"
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

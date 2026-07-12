import { AlertTriangle, UserPlus, UserX } from "lucide-react";

import { StatTile } from "@/shared/ui";

interface ResultStatsProps {
  createdCount: number;
  skippedCount: number;
  errorsCount: number;
}

export function ResultStats({
  createdCount,
  skippedCount,
  errorsCount,
}: ResultStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatTile
        label="Creados"
        value={createdCount.toLocaleString("es-CO")}
        valueClassName="text-emerald-700 text-[40px]"
        icon={
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <UserPlus size={18} />
          </span>
        }
        className="p-5 sm:p-6"
      />

      <StatTile
        label="Omitidos"
        value={skippedCount.toLocaleString("es-CO")}
        valueClassName="text-amber-700 text-[40px]"
        icon={
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <UserX size={18} />
          </span>
        }
        className="p-5 sm:p-6"
      />

      <StatTile
        label="Errores"
        value={errorsCount.toLocaleString("es-CO")}
        valueClassName="text-brand-700 text-[40px]"
        icon={
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <AlertTriangle size={18} />
          </span>
        }
        className="p-5 sm:p-6"
      />
    </div>
  );
}

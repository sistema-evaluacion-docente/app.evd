import { Card } from "@/components/ui/card";
import { FileText, Users } from "lucide-react";

import { StatTile } from "@/shared/ui";

interface UploadStatsProps {
  ready: boolean;
  teachers: number;
  comments: number;
}

export function UploadStats({ ready, teachers, comments }: UploadStatsProps) {
  if (ready) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label="Total docentes detectados"
          value={teachers.toLocaleString("es-CO")}
          valueClassName="text-ink-900 text-[40px]"
          icon={
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <Users size={18} />
            </span>
          }
          className="p-5 sm:p-6"
        />

        <StatTile
          label="Total comentarios"
          value={comments.toLocaleString("es-CO")}
          valueClassName="text-ink-900 text-[40px]"
          icon={
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <FileText size={18} />
            </span>
          }
          className="p-5 sm:p-6"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {["Total docentes detectados", "Total comentarios"].map((label) => (
        <Card key={label} className="border-dashed p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              {label}
            </div>

            <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-ink-50 text-ink-300">
              <Users size={18} />
            </div>
          </div>

          <div className="num mt-5 text-[40px] font-semibold leading-none tracking-tight text-ink-300">
            —
          </div>
        </Card>
      ))}
    </div>
  );
}

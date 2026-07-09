import { Card } from "@/components/ui/card";
import { Calendar, ExternalLink, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Department } from "@/features/departments";
import type { EvaluationRecord } from "../types/Evaluation";

interface GeneralInfoCardProps {
  evaluation: EvaluationRecord | undefined;
  department: Department | undefined;
  isLoading: boolean;
}

export function GeneralInfoCard({
  evaluation,
  department,
  isLoading,
}: GeneralInfoCardProps) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="mb-4 text-[17px] font-semibold">Información General</h2>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24 animate-pulse" />
              <Skeleton className="mt-2 h-5 w-32" />
            </div>
          ))}
        </div>
      ) : evaluation ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Periodo Académico
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-[14px] font-medium">
              <Calendar size={14} className="text-ink-400" />
              {evaluation.academic_period_name ?? "—"}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Departamento
            </div>

            <div className="mt-1 text-[14px] font-medium">
              {department?.name ?? `ID: ${evaluation.department_id}`}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Total Docentes
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-[14px] font-medium">
              <Users size={14} className="text-ink-400" />
              {evaluation.count ?? "—"}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              PDF Adjunto
            </div>

            <div className="mt-1">
              {evaluation.pdf_url ? (
                <a
                  href={evaluation.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:underline"
                >
                  <ExternalLink size={13} />
                  Ver PDF
                </a>
              ) : (
                <span className="text-[13px] text-muted-foreground">
                  Sin adjunto
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

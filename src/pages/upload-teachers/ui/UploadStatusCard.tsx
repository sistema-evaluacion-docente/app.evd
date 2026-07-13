import { Card } from "@/components/ui/card";
import { AlertTriangle, Check, Info } from "lucide-react";

import type { UploadStatus } from "@/features/teachers";

const STATUS_HEADING: Record<Exclude<UploadStatus, "idle">, string> = {
  uploading: "Estado: Subiendo archivo",
  success: "Estado: Archivo procesado",
  error: "Estado: Error al procesar",
};

interface UploadStatusCardProps {
  status: Exclude<UploadStatus, "idle">;
  progress: number;
  fileName: string;
  error: string;
  onReset: () => void;
}

export function UploadStatusCard({
  status,
  progress,
  fileName,
  error,
  onReset,
}: UploadStatusCardProps) {
  return (
    <Card className="p-5 sm:p-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {status === "success" ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={13} strokeWidth={2.5} />
            </span>
          ) : status === "error" ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <AlertTriangle size={13} />
            </span>
          ) : (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
            </span>
          )}

          <span className="truncate font-semibold">
            {STATUS_HEADING[status]}
          </span>
        </div>

        <span className="num font-semibold">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-brand-600 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Info size={14} />

          {status === "success" && (
            <span className="truncate">
              Archivo "
              <span className="font-medium">{fileName}</span>"
              procesado exitosamente.
            </span>
          )}

          {status === "uploading" && (
            <span className="truncate">
              Subiendo "
              <span className="font-medium">{fileName}</span>"…
            </span>
          )}

          {status === "error" && (
            <span className="text-brand-500">{error}</span>
          )}
        </span>

        {(status === "success" || status === "error") && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 font-medium text-brand-500 hover:text-brand-600"
          >
            Subir otro archivo
          </button>
        )}
      </div>
    </Card>
  );
}

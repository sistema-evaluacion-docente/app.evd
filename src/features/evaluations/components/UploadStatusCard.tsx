import { Card } from "@/components/ui/card";
import { AlertTriangle, Check, Info } from "lucide-react";

import type { UploadStatus } from "../hooks/useUploadEvaluation";

const STATUS_HEADING: Record<Exclude<UploadStatus, "idle">, string> = {
  uploading: "Estado: Subiendo archivo",
  processing: "Estado: Procesando contenido",
  success: "Estado: Archivo cargado",
  error: "Estado: Error al procesar",
};

interface UploadStatusCardProps {
  status: Exclude<UploadStatus, "idle">;
  progress: number;
  fileName: string;
  fileSize: string;
  error: string;
  onChangeFile: () => void;
}

export function UploadStatusCard({
  status,
  progress,
  fileName,
  fileSize,
  error,
  onChangeFile,
}: UploadStatusCardProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {status === "success" ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={13} strokeWidth={2.5} />
            </span>
          ) : status === "error" ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-muted-foreground">
              <AlertTriangle size={13} />
            </span>
          ) : (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <span className="h-2.5 w-2.5 animate-spin rounded-full border-2" />
            </span>
          )}

          <span className="truncate font-semibold">
            {STATUS_HEADING[status]}
          </span>
        </div>

        <span className="num text-[13px] font-semibold text-mute-foreground">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-brand-600 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-mute-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Info size={14} />

          {status === "success" && (
            <span className="truncate">
              Archivo "<span className="font-medium">{fileName}</span>"
              {fileSize && (
                <span className="text-muted-foreground"> · {fileSize}</span>
              )}{" "}
              procesado exitosamente.
            </span>
          )}

          {status === "uploading" && (
            <span className="truncate">
              Subiendo "<span className="font-medium">{fileName}</span>"
              {fileSize && (
                <span className="text-muted-foreground"> · {fileSize}</span>
              )}
              …
            </span>
          )}

          {status === "processing" && (
            <span className="truncate">
              Extrayendo evaluaciones de "
              <span className="font-medium">{fileName}</span>"
              {fileSize && (
                <span className="text-muted-foreground"> · {fileSize}</span>
              )}
              …
            </span>
          )}

          {status === "error" && (
            <span className="text-brand-500">{error}</span>
          )}
        </span>

        {(status === "success" || status === "error") && (
          <button
            type="button"
            onClick={onChangeFile}
            className="shrink-0 text-sm font-medium text-brand-500 hover:text-brand-600 cursor-pointer"
          >
            Cambiar archivo
          </button>
        )}
      </div>
    </Card>
  );
}

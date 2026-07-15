import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AlertTriangle, BrainCircuit, Loader2 } from "lucide-react";
import { Link } from "wouter";

import type { AiStatus } from "../api/evaluationService";
import type { UploadStatus } from "../hooks/useUploadEvaluation";

const STATUS_MESSAGE: Record<UploadStatus, string> = {
  idle: "Esperando archivo. Use el área superior para subir un PDF institucional.",
  uploading: "Procesando subida del archivo…",
  processing: "Extrayendo evaluaciones y comentarios del PDF…",
  success: "PDF procesado. Analice los comentarios con IA para clasificar el nivel de riesgo.",
  error: "Corrija el archivo e intente nuevamente.",
};

interface UploadFooterProps {
  status: UploadStatus;
  evaluationId: number | null;
  aiStatus: AiStatus | null;
  onAnalyze: () => void;
  analyzeError: string;
}

export function UploadFooter({
  status,
  evaluationId,
  aiStatus,
  onAnalyze,
  analyzeError,
}: UploadFooterProps) {
  const ready = status === "success";

  return (
    <>
      <Separator className="my-2" />

      <div className="flex flex-col gap-3 pt-2">
        <p className="text-sm text-muted-foreground">{STATUS_MESSAGE[status]}</p>

        {/* AI analyze section — only visible after upload succeeds */}
        {ready && aiStatus !== null && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {/* Analyze button */}
              {aiStatus === "ANALYZING" ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600/60 px-5 text-[13.5px] font-semibold text-white"
                >
                  <Loader2 size={15} className="animate-spin" />
                  Analizando…
                </button>
              ) : aiStatus === "ANALYZED" ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-muted px-5 text-[13.5px] font-semibold text-muted-foreground"
                >
                  <BrainCircuit size={15} />
                  Re-analizar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onAnalyze}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-md px-5 text-[13.5px] font-semibold text-white transition-colors",
                    aiStatus === "FAILED"
                      ? "bg-brand-700 hover:bg-brand-800"
                      : "bg-brand-600 hover:bg-brand-700",
                  )}
                >
                  <BrainCircuit size={15} />
                  {aiStatus === "FAILED" ? "Reintentar análisis" : "Analizar con IA"}
                </button>
              )}

              {/* Error message for FAILED */}
              {aiStatus === "FAILED" && analyzeError && (
                <span className="flex items-center gap-1 text-[12px] text-red-600">
                  <AlertTriangle size={13} />
                  {analyzeError}
                </span>
              )}
            </div>

            {/* Ver evaluación — always visible once upload is done */}
            {evaluationId && (
              <Link
                href={`/evaluations/${evaluationId}`}
                className="text-[13px] font-medium text-brand-600 hover:underline"
              >
                Ver evaluación →
              </Link>
            )}
          </div>
        )}

        {/* Ver evaluación fallback when ai_status is null */}
        {ready && aiStatus === null && evaluationId && (
          <div className="flex justify-end">
            <Link
              href={`/evaluations/${evaluationId}`}
              className="text-[13px] font-medium text-brand-600 hover:underline"
            >
              Ver evaluación →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

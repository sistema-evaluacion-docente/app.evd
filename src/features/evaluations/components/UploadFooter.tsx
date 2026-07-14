import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

import type { UploadStatus } from "../hooks/useUploadEvaluation";

const STATUS_MESSAGE: Record<UploadStatus, string> = {
  idle: "Esperando archivo. Use el área superior para subir un PDF institucional.",
  uploading: "Procesando subida del archivo…",
  processing: "Extrayendo evaluaciones y comentarios del PDF…",
  success: "Archivo listo. Continúe para iniciar el análisis automático.",
  error: "Corrija el archivo e intente nuevamente.",
};

interface UploadFooterProps {
  status: UploadStatus;
  ready: boolean;
  evaluationId: number | null;
}

export function UploadFooter({ status, ready, evaluationId }: UploadFooterProps) {
  return (
    <>
      <Separator className="my-2" />

      <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
        <div className="text-sm text-muted-foreground">
          {STATUS_MESSAGE[status]}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={ready ? `/evaluations/${evaluationId}` : "#"}
            onClick={(event) => {
              if (!ready) event.preventDefault();
            }}
            aria-disabled={!ready}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-[13.5px] font-semibold text-white transition-colors",
              ready
                ? "bg-primary hover:bg-primary-hover"
                : "pointer-events-none bg-brand-600/40",
            )}
          >
            <Button size="lg" disabled={!ready}>
              Analizar evaluaciones <ArrowRight size={15} />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

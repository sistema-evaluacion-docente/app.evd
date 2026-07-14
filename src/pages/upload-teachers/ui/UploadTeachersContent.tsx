import { Card } from "@/components/ui/card";
import { PageHeader } from "@/shared/ui";
import { ChevronLeft, Download, Users } from "lucide-react";
import { Link } from "wouter";
import { DropzoneArea } from "./DropzoneArea";

import { Button } from "@/components/ui/button";
import { useUploadPage } from "../hooks/useUploadPage";
import { ResultStats } from "./ResultStats";
import { ResultTables } from "./ResultTables";
import { UploadStatusCard } from "./UploadStatusCard";

function UploadTeachersContent() {
  const {
    inputRef,
    dragOver,
    setDragOver,
    status,
    progress,
    fileName,
    error,
    result,
    handleFile,
    handleReset,
    busy,
    ready,
    createdCount,
    skippedCount,
    errorsCount,
  } = useUploadPage();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Carga de Docentes"
        description="Suba un archivo Excel (.xlsx, .xls) o CSV (.csv) con la lista de docentes para crear masivamente en su departamento."
        actions={
          <Link
            href="/teachers"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-ink-200 bg-card px-4 text-[13px] font-semibold text-ink-800 hover:bg-ink-50"
          >
            <ChevronLeft size={14} /> Volver a Docentes
          </Link>
        }
      />

      <DropzoneArea
        dragOver={dragOver}
        busy={busy}
        inputRef={inputRef}
        onDragOverChange={setDragOver}
        onFileSelected={handleFile}
      />

      <div className="flex items-center justify-end gap-2">
        <a
          download
          href="/DocentesEjemplo.csv"
          className="inline-flex items-center gap-1.5  text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download size={14} /> Descargar CSV de ejemplo
          </Button>
        </a>
      </div>

      {status !== "idle" && (
        <UploadStatusCard
          status={status}
          progress={progress}
          fileName={fileName}
          error={error}
          onReset={handleReset}
        />
      )}

      {ready && (
        <ResultStats
          createdCount={createdCount}
          skippedCount={skippedCount}
          errorsCount={errorsCount}
        />
      )}

      {ready && (createdCount > 0 || skippedCount > 0 || errorsCount > 0) && (
        <ResultTables result={result!} />
      )}

      {!ready && status !== "error" && status !== "idle" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {["Creados", "Omitidos", "Errores"].map((label) => (
            <Card key={label} className="border-dashed p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {label}
                </div>

                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Users size={18} />
                </div>
              </div>

              <div className="num mt-5 text-[40px] font-semibold leading-none tracking-tight text-muted-foreground">
                —
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center animate-fade-in">
        <div className="text-sm text-muted-foreground">
          {status === "idle" &&
            "Esperando archivo. Use el área superior para subir un Excel con los docentes."}

          {status === "uploading" && "Procesando subida del archivo…"}

          {status === "success" &&
            "Archivo procesado. Los docentes creados ya están disponibles en el sistema."}

          {status === "error" && "Corrija el archivo e intente nuevamente."}
        </div>
      </div>
    </div>
  );
}

export default UploadTeachersContent;

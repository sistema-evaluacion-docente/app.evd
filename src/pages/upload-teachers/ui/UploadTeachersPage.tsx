import {
    AlertTriangle,
    Check,
    ChevronLeft,
    FileSpreadsheet,
    FileUp,
    Info,
    UserPlus,
    Users,
    UserX,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUploadTeachers, type UploadStatus } from "@/features/teachers";
import { cn } from "@/lib/utils";
import { PageHeader, StatTile } from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";

const STATUS_HEADING: Record<Exclude<UploadStatus, "idle">, string> = {
  uploading: "Estado: Subiendo archivo",
  success: "Estado: Archivo procesado",
  error: "Estado: Error al procesar",
};

export function UploadTeachersPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { status, progress, fileName, error, result, upload, reset } =
    useUploadTeachers();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    upload(file);
  };

  const handleReset = () => {
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const busy = status === "uploading";
  const ready = status === "success";
  const createdCount = result?.created.length ?? 0;
  const skippedCount = result?.skipped.length ?? 0;
  const errorsCount = result?.errors.length ?? 0;

  return (
    <AppLayout
      mainClassName="max-w-[1200px] space-y-5"
      header={{
        userName: "Director Depto.",
        userRole: "Ciencias Básicas",
        showBreadcrumb: true,
        breadcrumb: (
          <>
            <Link
              href="/teachers"
              className="transition-colors hover:text-ink-900"
            >
              Docentes
            </Link>
            <span className="mx-2 text-ink-300">/</span>
            <span className="font-medium text-ink-900">Cargar docentes</span>
          </>
        ),
      }}
    >
      <PageHeader
        title="Carga de Docentes"
        description="Suba un archivo Excel (.xlsx o .xls) con la lista de docentes para crear masivamente en su departamento."
        actions={
          <Link
            href="/teachers"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-800 hover:bg-ink-50"
          >
            <ChevronLeft size={14} /> Volver a Docentes
          </Link>
        }
      />

      {/* Dropzone */}
      <Card className="p-5 sm:p-6">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            if (!busy) setDragOver(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (!busy) handleFile(event.dataTransfer.files[0]);
          }}
          className={cn(
            "flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14",
            dragOver
              ? "border-brand-600 bg-brand-50/60"
              : "border-brand-200 bg-brand-50/20",
            busy && "pointer-events-none opacity-60",
          )}
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FileUp size={28} strokeWidth={1.75} />
          </div>

          <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-ink-900">
            Arrastre su archivo aquí
          </h3>

          <p className="mt-1.5 text-[13px] text-ink-500">
            Formatos aceptados:{" "}
            <span className="font-medium text-brand-600">.xlsx · .xls</span>
          </p>

          <Button
            size="lg"
            disabled={busy}
            className="mt-6 px-5"
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet size={16} />
            Seleccionar Archivo Excel
          </Button>

          <p className="mt-5 text-[11.5px] text-ink-400">
            Columnas requeridas: nombre, email, codigo institucional, tipo de
            contrato
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
      </Card>

      {/* Status card */}
      {status !== "idle" && (
        <Card className="p-5 sm:p-6">
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
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink-100">
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
                </span>
              )}
              <span className="truncate text-[14px] font-semibold text-ink-900">
                {STATUS_HEADING[status]}
              </span>
            </div>
            <span className="num text-[13px] font-semibold text-ink-700">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full bg-brand-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-[12.5px] text-ink-500">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Info size={14} />
              {status === "success" && (
                <span className="truncate">
                  Archivo "
                  <span className="font-medium text-ink-700">{fileName}</span>"
                  procesado exitosamente.
                </span>
              )}
              {status === "uploading" && (
                <span className="truncate">
                  Subiendo "
                  <span className="font-medium text-ink-700">{fileName}</span>"…
                </span>
              )}
              {status === "error" && (
                <span className="text-brand-700">{error}</span>
              )}
            </span>
            {(status === "success" || status === "error") && (
              <button
                type="button"
                onClick={handleReset}
                className="shrink-0 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
              >
                Subir otro archivo
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Result stats */}
      {ready && (
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
      )}

      {/* Detailed results */}
      {ready && (createdCount > 0 || skippedCount > 0 || errorsCount > 0) && (
        <Card className="p-5 sm:p-6">
          <h3 className="text-[16px] font-semibold text-ink-900">
            Detalle de la importación
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-500">
            Desglose de cada fila procesada del archivo Excel.
          </p>

          <Separator className="my-4" />

          {createdCount > 0 && (
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-emerald-800">
                <UserPlus size={15} /> Creados ({createdCount})
              </h4>
              <div className="overflow-x-auto rounded-lg border border-ink-200">
                <table className="min-w-full text-left text-[13px]">
                  <thead className="bg-ink-50 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-500">
                    <tr>
                      <th className="px-4 py-2.5">Nombre</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Código</th>
                      <th className="px-4 py-2.5">Contrato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {result!.created.map((row, i) => (
                      <tr key={i} className="hover:bg-ink-50/50">
                        <td className="px-4 py-2 font-medium text-ink-900">
                          {row.nombre}
                        </td>
                        <td className="px-4 py-2 text-ink-600">{row.email}</td>
                        <td className="px-4 py-2 font-mono text-ink-700">
                          {row.codigo_institucional}
                        </td>
                        <td className="px-4 py-2 text-ink-600">
                          {row.tipo_contrato ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {skippedCount > 0 && (
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-amber-800">
                <UserX size={15} /> Omitidos ({skippedCount})
              </h4>
              <div className="overflow-x-auto rounded-lg border border-ink-200">
                <table className="min-w-full text-left text-[13px]">
                  <thead className="bg-ink-50 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-500">
                    <tr>
                      <th className="px-4 py-2.5">Nombre</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Código</th>
                      <th className="px-4 py-2.5">Razón</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {result!.skipped.map((row, i) => (
                      <tr key={i} className="hover:bg-ink-50/50">
                        <td className="px-4 py-2 font-medium text-ink-900">
                          {row.fila.nombre}
                        </td>
                        <td className="px-4 py-2 text-ink-600">
                          {row.fila.email}
                        </td>
                        <td className="px-4 py-2 font-mono text-ink-700">
                          {row.fila.codigo_institucional}
                        </td>
                        <td className="px-4 py-2 text-brand-700">
                          {row.razon}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorsCount > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-brand-800">
                <AlertTriangle size={15} /> Errores ({errorsCount})
              </h4>
              <div className="overflow-x-auto rounded-lg border border-ink-200">
                <table className="min-w-full text-left text-[13px]">
                  <thead className="bg-ink-50 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-500">
                    <tr>
                      <th className="px-4 py-2.5">Nombre</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Código</th>
                      <th className="px-4 py-2.5">Razón</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {result!.errors.map((row, i) => (
                      <tr key={i} className="hover:bg-ink-50/50">
                        <td className="px-4 py-2 font-medium text-ink-900">
                          {row.fila.nombre}
                        </td>
                        <td className="px-4 py-2 text-ink-600">
                          {row.fila.email}
                        </td>
                        <td className="px-4 py-2 font-mono text-ink-700">
                          {row.fila.codigo_institucional}
                        </td>
                        <td className="px-4 py-2 text-brand-700">
                          {row.razon}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Placeholder stats when idle */}
      {!ready && status !== "error" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {["Creados", "Omitidos", "Errores"].map((label) => (
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
      )}

      <Separator className="my-2" />

      <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
        <div className="text-[12.5px] text-ink-500">
          {status === "idle" &&
            "Esperando archivo. Use el área superior para subir un Excel con los docentes."}
          {status === "uploading" && "Procesando subida del archivo…"}
          {status === "success" &&
            "Archivo procesado. Los docentes creados ya están disponibles en el sistema."}
          {status === "error" && "Corrija el archivo e intente nuevamente."}
        </div>
      </div>
    </AppLayout>
  );
}

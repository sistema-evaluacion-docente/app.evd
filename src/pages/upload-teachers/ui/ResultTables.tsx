import { AlertTriangle, UserPlus, UserX } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TeacherBulkResult } from "@/features/teachers";

interface ResultTablesProps {
  result: TeacherBulkResult;
}

export function ResultTables({ result }: ResultTablesProps) {
  const { created, skipped, errors } = result;

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-[16px] font-semibold text-ink-900">
        Detalle de la importación
      </h3>
      <p className="mt-0.5 text-[13px] text-ink-500">
        Desglose de cada fila procesada del archivo Excel.
      </p>

      <Separator className="my-4" />

      {created.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-emerald-800">
            <UserPlus size={15} /> Creados ({created.length})
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
                {created.map((row, i) => (
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

      {skipped.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-amber-800">
            <UserX size={15} /> Omitidos ({skipped.length})
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
                {skipped.map((row, i) => (
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

      {errors.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-brand-800">
            <AlertTriangle size={15} /> Errores ({errors.length})
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
                {errors.map((row, i) => (
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
  );
}

import { AlertTriangle, Eye, UserPlus, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

import type { TeacherBulkResult } from "@/features/teachers";

interface ResultTablesProps {
  result: TeacherBulkResult;
}

export function ResultTables({ result }: ResultTablesProps) {
  const { created, skipped, errors } = result;

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-lg font-semibold">
        Detalle de la importación
      </h3>

      <p className="mt-0.5 text-muted-foreground">
        Desglose de cada fila procesada del archivo Excel.
      </p>

      {created.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-emerald-800">
            <UserPlus size={15} /> Creados ({created.length})
          </h4>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left">
              <thead className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Nombre</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Código</th>
                  <th className="px-4 py-2.5">Contrato</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {created.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-medium">
                      {row.nombre}
                    </td>

                    <td className="px-4 py-2 text-muted-foreground">{row.email}</td>

                    <td className="px-4 py-2 font-mono">
                      {row.codigo_institucional}
                    </td>

                    <td className="px-4 py-2 text-muted-foreground">
                      {row.tipo_contrato ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <Link to="/teachers">
              <Button>
                <Eye />
                Ver docentes
              </Button>
            </Link>
          </div>
        </div>
      )}

      {skipped.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-amber-800">
            <UserX size={15} /> Omitidos ({skipped.length})
          </h4>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left">
              <thead className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Nombre</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Código</th>
                  <th className="px-4 py-2.5">Razón</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {skipped.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-medium">
                      {row.fila.nombre}
                    </td>

                    <td className="px-4 py-2 text-muted-foreground">
                      {row.fila.email}
                    </td>

                    <td className="px-4 py-2 font-mono">
                      {row.fila.codigo_institucional}
                    </td>

                    <td className="px-4 py-2 text-brand-500">
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
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-brand-600">
            <AlertTriangle size={15} /> Errores ({errors.length})
          </h4>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left">
              <thead className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Nombre</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Código</th>
                  <th className="px-4 py-2.5">Razón</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {errors.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-medium">
                      {row.fila.nombre}
                    </td>

                    <td className="px-4 py-2 text-muted-foreground">
                      {row.fila.email}
                    </td>

                    <td className="px-4 py-2 font-mono">
                      {row.fila.codigo_institucional}
                    </td>

                    <td className="px-4 py-2 text-brand-500">
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

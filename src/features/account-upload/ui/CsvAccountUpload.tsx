import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle, Check, Download, FileText, FileUp } from 'lucide-react'
import { useRef, useState } from 'react'

import { downloadCsv, parseCsv, validateAccountRow } from '../lib/csv'
import type { AccountCsvRow, AccountUploadConfig, ParsedAccountRow } from '../model'

export interface CsvAccountUploadProps {
  config: AccountUploadConfig
  onImport: (rows: AccountCsvRow[]) => void
}

interface ParsedState {
  fileName: string
  rows: ParsedAccountRow[]
  parseError?: string
}

const REQUIRED_COLUMNS = ['codigo', 'nombre', 'email', 'vinculacion']

/** CSV bulk-upload card: dropzone, per-row validation preview and format reference. */
export function CsvAccountUpload({ config, onImport }: CsvAccountUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [parsed, setParsed] = useState<ParsedState | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setParsed({
        fileName: file.name,
        rows: [],
        parseError: 'El archivo debe tener extensión .csv',
      })
      return
    }
    setBusy(true)
    const text = await file.text()
    const { headers, rows } = parseCsv(text)
    const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column))
    if (missing.length > 0) {
      setParsed({
        fileName: file.name,
        rows: [],
        parseError: `Faltan columnas: ${missing.join(', ')}`,
      })
      setBusy(false)
      return
    }
    const index = {
      codigo: headers.indexOf('codigo'),
      nombre: headers.indexOf('nombre'),
      email: headers.indexOf('email'),
      vinculacion: headers.indexOf('vinculacion'),
    }
    const parsedRows: ParsedAccountRow[] = rows.map((columns) => {
      const row: AccountCsvRow = {
        codigo: columns[index.codigo] ?? '',
        nombre: columns[index.nombre] ?? '',
        email: columns[index.email] ?? '',
        vinculacion: columns[index.vinculacion] ?? '',
      }
      return {
        ...row,
        errors: validateAccountRow(row, config.codeRegex, config.codeFormatHint),
      }
    })
    setParsed({ fileName: file.name, rows: parsedRows })
    setBusy(false)
  }

  const validCount = parsed?.rows.filter((row) => row.errors.length === 0).length ?? 0
  const errorCount = parsed?.rows.filter((row) => row.errors.length > 0).length ?? 0

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-ink-900 text-[18px] font-semibold">Carga masiva desde CSV</h2>
          <p className="text-ink-500 mt-1 text-[13px]">
            Suba un archivo CSV con la lista de {config.entityPlural}. Validamos cada fila antes de
            crear las cuentas.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadCsv(config.csvTemplate, config.csvFileName)}
        >
          <Download size={14} />
          Descargar plantilla CSV
        </Button>
      </div>

      {!parsed && (
        <div
          onDragEnter={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            void handleFile(event.dataTransfer.files[0])
          }}
          className={cn(
            'flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragOver ? 'border-brand-600 bg-brand-50/40' : 'border-ink-200 bg-ink-50/40',
          )}
        >
          <div className="border-ink-200 bg-card text-ink-700 shadow-card inline-flex h-14 w-14 items-center justify-center rounded-xl border">
            <FileUp size={24} strokeWidth={1.6} />
          </div>
          <div className="text-ink-900 mt-4 text-[15px] font-semibold">
            Arrastre su archivo CSV aquí
          </div>
          <div className="text-ink-500 mt-1 text-[12.5px]">
            o haga click para seleccionarlo · Tamaño máx 10MB
          </div>
          <Button className="mt-5" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Procesando…' : 'Seleccionar archivo .csv'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>
      )}

      {parsed &&
        (parsed.parseError ? (
          <div className="border-brand-200/70 bg-brand-50 text-brand-800 inline-flex items-start gap-2 rounded-lg border p-4 text-[13px]">
            <AlertTriangle size={16} className="text-brand-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">{parsed.parseError}</div>
              <button
                type="button"
                onClick={() => setParsed(null)}
                className="mt-1 text-[12.5px] underline"
              >
                Subir otro archivo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="bg-ink-100 text-ink-700 inline-flex h-9 w-9 items-center justify-center rounded-md">
                  <FileText size={16} />
                </span>
                <div>
                  <div className="text-ink-900 text-[13.5px] font-semibold">{parsed.fileName}</div>
                  <div className="text-ink-500 text-[12px]">
                    <span className="font-semibold text-emerald-700">{validCount} válidas</span>
                    {errorCount > 0 && (
                      <>
                        {' · '}
                        <span className="text-brand-700 font-semibold">
                          {errorCount} con errores
                        </span>
                      </>
                    )}
                    {` · ${parsed.rows.length} filas en total`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setParsed(null)}>
                  Cambiar archivo
                </Button>
                <Button
                  size="sm"
                  disabled={validCount === 0}
                  onClick={() => {
                    onImport(parsed.rows.filter((row) => row.errors.length === 0))
                    setParsed(null)
                  }}
                >
                  Importar {validCount}{' '}
                  {validCount === 1 ? config.entitySingular : config.entityPlural}
                </Button>
              </div>
            </div>

            <div className="border-ink-200 overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-ink-200 bg-ink-50/60 text-ink-500 border-b text-[10px] font-semibold tracking-[0.08em] uppercase">
                      <th className="w-10 py-2.5 pl-4 text-left font-semibold">#</th>
                      <th className="py-2.5 pr-4 text-left font-semibold">Código</th>
                      <th className="py-2.5 pr-4 text-left font-semibold">Nombre</th>
                      <th className="py-2.5 pr-4 text-left font-semibold">Correo</th>
                      <th className="py-2.5 pr-4 text-left font-semibold">Vinculación</th>
                      <th className="py-2.5 pr-4 text-left font-semibold">Validación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, rowIndex) => {
                      const valid = row.errors.length === 0
                      return (
                        <tr
                          key={rowIndex}
                          className={cn(
                            'border-ink-100 border-b text-[13px] last:border-b-0',
                            !valid && 'bg-brand-50/30',
                          )}
                        >
                          <td className="num text-ink-500 py-2.5 pl-4 tabular-nums">
                            {rowIndex + 1}
                          </td>
                          <td className="num text-ink-900 py-2.5 pr-4 font-semibold tabular-nums">
                            {row.codigo}
                          </td>
                          <td className="text-ink-800 py-2.5 pr-4">{row.nombre}</td>
                          <td className="text-ink-700 py-2.5 pr-4">{row.email}</td>
                          <td className="text-ink-700 py-2.5 pr-4">{row.vinculacion}</td>
                          <td className="py-2.5 pr-4">
                            {valid ? (
                              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700">
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
                                  <Check size={10} strokeWidth={3.5} />
                                </span>
                                Válido
                              </span>
                            ) : (
                              <span className="text-brand-700 inline-flex items-center gap-1.5 text-[11.5px] font-semibold">
                                <AlertTriangle size={12} />
                                {row.errors.join(' · ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ))}

      {/* Expected format reference */}
      <div className="border-ink-100 mt-6 border-t pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-ink-900 text-[14px] font-semibold">Formato esperado del CSV</h3>
          <span className="text-ink-500 text-[11px] font-semibold tracking-[0.06em] uppercase">
            4 columnas requeridas
          </span>
        </div>

        <pre className="border-ink-200 bg-ink-900 text-ink-100 overflow-x-auto rounded-lg border p-4 font-mono text-[12.5px] leading-relaxed">
          <span className="text-emerald-300">codigo</span>,
          <span className="text-emerald-300">nombre</span>,
          <span className="text-emerald-300">email</span>,
          <span className="text-emerald-300">vinculacion</span>
          {config.csvExampleLines.map((line) => `\n${line}`).join('')}
        </pre>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldSpec
            name="codigo"
            description={`Identificador interno. Formato ${config.codeFormatHint}.`}
            example={config.codePlaceholder}
          />
          <FieldSpec
            name="nombre"
            description="Nombre completo con título académico."
            example="Dra. Marta Hernández"
          />
          <FieldSpec
            name="email"
            description="Correo institucional (debe contener universidad.edu)."
            example="m.hernandez@universidad.edu.co"
          />
          <FieldSpec
            name="vinculacion"
            description="Uno de: Tiempo Completo, Medio Tiempo, Catedrático, Ocasional."
            example="Tiempo Completo"
          />
        </div>
      </div>
    </Card>
  )
}

function FieldSpec({
  name,
  description,
  example,
}: {
  name: string
  description: string
  example: string
}) {
  return (
    <div className="border-ink-200 bg-card rounded-lg border p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <code className="bg-ink-100 text-ink-900 rounded px-1.5 py-0.5 font-mono text-[12px] font-semibold">
          {name}
        </code>
        <span className="text-brand-700 text-[10px] font-semibold tracking-[0.08em] uppercase">
          Requerido
        </span>
      </div>
      <div className="text-ink-600 text-[12.5px] leading-snug">{description}</div>
      <div className="text-ink-500 mt-1.5 text-[11.5px]">
        Ej. <span className="text-ink-700 font-mono">{example}</span>
      </div>
    </div>
  )
}

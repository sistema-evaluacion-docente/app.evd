import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  FileUp,
  Info,
  Users,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Link } from 'wouter'

import { cn } from '@/shared/lib/utils'
import {
  AppFooter,
  Button,
  Card,
  PageHeader,
  Separator,
  StatTile,
} from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

const STATUS_HEADING: Record<Exclude<UploadStatus, 'idle'>, string> = {
  uploading: 'Estado: Subiendo archivo',
  processing: 'Estado: Procesando contenido',
  success: 'Estado: Archivo cargado',
  error: 'Estado: Error al procesar',
}

const MAX_SIZE = 50 * 1024 * 1024

export function UploadEvaluationsPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ teachers: 0, comments: 0 })

  const startUpload = useCallback((name: string) => {
    setFileName(name)
    setError('')
    setProgress(0)
    setStatus('uploading')

    let value = 0
    const uploadTimer = window.setInterval(() => {
      value += Math.max(2, 9 - value / 14)
      if (value >= 70) {
        window.clearInterval(uploadTimer)
        setProgress(70)
        setStatus('processing')
        let processed = 70
        const processTimer = window.setInterval(() => {
          processed += 3.5
          if (processed >= 100) {
            window.clearInterval(processTimer)
            setProgress(100)
            setStats({ teachers: 142, comments: 3892 })
            setStatus('success')
          } else {
            setProgress(processed)
          }
        }, 90)
      } else {
        setProgress(value)
      }
    }, 70)
  }, [])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (
      file.type &&
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setFileName(file.name)
      setProgress(0)
      setError('Solo se aceptan archivos en formato PDF Institucional.')
      setStatus('error')
      return
    }
    if (file.size > MAX_SIZE) {
      setFileName(file.name)
      setProgress(0)
      setError('El archivo excede el tamaño máximo de 50MB.')
      setStatus('error')
      return
    }
    startUpload(file.name)
  }

  const reset = () => {
    setStatus('idle')
    setProgress(0)
    setFileName('')
    setError('')
    setStats({ teachers: 0, comments: 0 })
  }

  const loadSample = () => {
    setFileName('evaluaciones_finales_2023_Q2.pdf')
    setProgress(100)
    setStats({ teachers: 142, comments: 3892 })
    setStatus('success')
  }

  const busy = status === 'uploading' || status === 'processing'
  const ready = status === 'success'

  return (
    <AppLayout
      role="director"
      mainClassName="max-w-[1100px] space-y-5"
      header={{ userName: 'Director Depto.', userRole: 'Ciencias Básicas' }}
    >
      <PageHeader
        title="Carga de Evaluaciones Docentes"
        description="Suba el archivo PDF institucional para iniciar el análisis automático de las evaluaciones del periodo académico vigente."
      />

      {/* Dropzone */}
      <Card className="p-5 sm:p-6">
        <div
          onDragEnter={(event) => {
            event.preventDefault()
            if (!busy) setDragOver(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            if (!busy) handleFile(event.dataTransfer.files[0])
          }}
          className={cn(
            'flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14',
            dragOver
              ? 'border-brand-600 bg-brand-50/60'
              : 'border-brand-200 bg-brand-50/20',
            busy && 'pointer-events-none opacity-60',
          )}
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FileUp size={28} strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-ink-900">
            Arrastre su archivo aquí
          </h3>
          <p className="mt-1.5 text-[13px] text-ink-500">
            Formato aceptado:{' '}
            <span className="font-medium text-brand-600">PDF Institucional</span>
          </p>
          <Button
            variant="brand"
            size="lg"
            className="mt-6 px-5"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <FileText size={16} />
            Seleccionar Archivo PDF
          </Button>
          <p className="mt-5 text-[11.5px] text-ink-400">
            Tamaño máximo de archivo: 50MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
      </Card>

      {/* Status card */}
      {status !== 'idle' && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {status === 'success' ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={13} strokeWidth={2.5} />
                </span>
              ) : status === 'error' ? (
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
              {status === 'success' && (
                <span className="truncate">
                  Archivo "
                  <span className="font-medium text-ink-700">{fileName}</span>"
                  procesado exitosamente.
                </span>
              )}
              {status === 'uploading' && (
                <span className="truncate">
                  Subiendo "
                  <span className="font-medium text-ink-700">{fileName}</span>"…
                </span>
              )}
              {status === 'processing' && (
                <span className="truncate">
                  Extrayendo evaluaciones de "
                  <span className="font-medium text-ink-700">{fileName}</span>"…
                </span>
              )}
              {status === 'error' && (
                <span className="text-brand-700">{error}</span>
              )}
            </span>
            {(status === 'success' || status === 'error') && (
              <button
                type="button"
                onClick={reset}
                className="shrink-0 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
              >
                Cambiar archivo
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Stats */}
      {ready ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile
            label="Total docentes detectados"
            value={stats.teachers.toLocaleString('es-CO')}
            valueClassName="text-ink-900 text-[40px]"
            icon={
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <Users size={18} />
              </span>
            }
            className="p-5 sm:p-6"
          />
          <StatTile
            label="Total comentarios"
            value={stats.comments.toLocaleString('es-CO')}
            valueClassName="text-ink-900 text-[40px]"
            icon={
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <FileText size={18} />
              </span>
            }
            className="p-5 sm:p-6"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {['Total docentes detectados', 'Total comentarios'].map((label) => (
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
          {status === 'idle' &&
            'Esperando archivo. Use el área superior para subir un PDF institucional.'}
          {status === 'uploading' && 'Procesando subida del archivo…'}
          {status === 'processing' &&
            'Extrayendo evaluaciones y comentarios del PDF…'}
          {status === 'success' &&
            'Archivo listo. Continúe para iniciar el análisis automático.'}
          {status === 'error' && 'Corrija el archivo e intente nuevamente.'}
        </div>
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <Button variant="outline" onClick={loadSample}>
              Cargar archivo de ejemplo
            </Button>
          )}
          <Link
            href={ready ? '/teachers' : '#'}
            onClick={(event) => {
              if (!ready) event.preventDefault()
            }}
            aria-disabled={!ready}
            className={cn(
              'inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-[13.5px] font-semibold text-white transition-colors',
              ready
                ? 'bg-brand-600 hover:bg-brand-700'
                : 'pointer-events-none bg-brand-600/40',
            )}
          >
            Analizar evaluaciones <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <AppFooter>
        Periodo Académico 2024-1 · Sistema de Evaluación Docente · v2.1
      </AppFooter>
    </AppLayout>
  )
}

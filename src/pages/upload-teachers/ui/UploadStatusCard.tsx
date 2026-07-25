import { Card } from '@/components/ui/card'
import { AlertTriangle, Check } from 'lucide-react'

import type { UploadStatus } from '@/features/teachers'

const STATUS_HEADING: Record<Exclude<UploadStatus, 'idle'>, string> = {
  uploading: 'Estado: Subiendo archivo',
  success: 'Estado: Archivo procesado',
  error: 'Estado: Error al procesar',
}

interface UploadStatusCardProps {
  status: Exclude<UploadStatus, 'idle'>
  fileName: string
  error: string
  onReset: () => void
}

export function UploadStatusCard({ status, fileName, error }: UploadStatusCardProps) {
  return (
    <Card className="animate-fade-in p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {status === 'success' ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={13} strokeWidth={2.5} />
            </span>
          ) : status === 'error' ? (
            <span className="text-brand-600 inline-flex items-center justify-center rounded-full">
              <AlertTriangle size={16} />
            </span>
          ) : (
            <span className="bg-muted inline-flex h-5 w-5 items-center justify-center rounded-full">
              <span className="border-ink-300 border-t-brand-600 h-2.5 w-2.5 animate-spin rounded-full border-2" />
            </span>
          )}

          <span className="truncate font-semibold">{STATUS_HEADING[status]}</span>
        </div>
      </div>

      <div className="text-muted-foreground flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          {status === 'success' && (
            <span className="truncate">
              Archivo "<span className="font-medium">{fileName}</span>" procesado exitosamente.
            </span>
          )}

          {status === 'uploading' && (
            <span className="truncate">
              Subiendo "<span className="font-medium">{fileName}</span>"…
            </span>
          )}

          {status === 'error' && <span className="text-brand-500">{error}</span>}
        </span>
      </div>
    </Card>
  )
}

import { Card } from '@/components/ui/card'
import { Info } from 'lucide-react'

import type { UploadStatus } from '../hooks/useUploadEvaluation'

const STATUS_HEADING: Record<Exclude<UploadStatus, 'idle'>, string> = {
  uploading: 'Estado: Subiendo archivo',
  success: 'Estado: Archivo cargado',
  error: 'Estado: Error al procesar',
}

interface UploadStatusCardProps {
  status: Exclude<UploadStatus, 'idle'>
  fileName: string
  fileSize: string
  error: string
}

/**
 * UploadStatusCard component displays the current status of the file upload process.
 *
 * @param {UploadStatusCardProps} props - The properties for the UploadStatusCard component.
 * @returns {JSX.Element} The rendered UploadStatusCard component.
 */
export function UploadStatusCard({ status, fileName, fileSize, error }: UploadStatusCardProps) {
  return (
    <Card className="animate-fade-in p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-semibold">{STATUS_HEADING[status]}</span>
        </div>
      </div>

      <div className="text-mute-foreground flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Info size={14} />

          {status === 'success' && (
            <span className="truncate">
              Archivo "<span className="font-medium">{fileName}</span>"
              {fileSize && <span className="text-muted-foreground"> · {fileSize}</span>} procesado
              exitosamente.
            </span>
          )}

          {status === 'uploading' && (
            <span className="truncate">
              Subiendo "<span className="font-medium">{fileName}</span>"
              {fileSize && <span className="text-muted-foreground"> · {fileSize}</span>}…
            </span>
          )}

          {status === 'error' && <span className="text-brand-500">{error}</span>}
        </span>
      </div>
    </Card>
  )
}

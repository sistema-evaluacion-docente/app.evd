import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FileText, FileUp, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'

interface UploadDropzoneProps {
  busy: boolean
  onFile: (file: File) => void
  onError?: (message: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * UploadDropzone component allows users to drag and drop a PDF file or select it via a button.
 * It validates the file size and type before passing it to the parent component.
 *
 * @param {UploadDropzoneProps} props - The properties for the UploadDropzone component.
 * @returns {JSX.Element} The rendered UploadDropzone component.
 */
export function UploadDropzone({ busy, onFile, onError }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const validateAndPassFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      onError?.('El archivo excede el tamaño máximo de 10MB.')
      return
    }

    onFile(file)
  }

  return (
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
          if (!busy) {
            const file = event.dataTransfer.files[0]
            if (file) validateAndPassFile(file)
          }
        }}
        className={cn(
          'grid h-[50dvh] place-items-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14',
          dragOver ? 'border-brand-600 bg-brand-50/60' : 'border-brand-200 bg-brand-50/20',
          busy && 'pointer-events-none opacity-60',
        )}
      >
        <div>
          {busy ? (
            <>
              <div className="bg-brand-50 text-brand-600 inline-flex h-16 w-16 items-center justify-center rounded-xl">
                <Loader2 size={28} strokeWidth={1.75} className="animate-spin" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">Subiendo archivo...</h3>
              <p className="text-mute-foreground mt-1.5 text-sm">Por favor espere</p>
            </>
          ) : (
            <>
              <div className="bg-brand-50 text-brand-600 inline-flex h-16 w-16 items-center justify-center rounded-xl">
                <FileUp size={28} strokeWidth={1.75} />
              </div>

              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                Arrastre su archivo aquí
              </h3>

              <p className="text-mute-foreground mt-1.5 text-sm">
                Formato aceptado:{' '}
                <span className="text-brand-400 font-medium">PDF Institucional</span>
              </p>

              <Button
                size="lg"
                disabled={busy}
                className="mt-6 px-5"
                onClick={() => inputRef.current?.click()}
              >
                <FileText size={16} />
                Seleccionar Archivo PDF
              </Button>

              <p className="text-mute-foreground mt-5 text-xs">Tamaño máximo de archivo: 10MB</p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) validateAndPassFile(file)
            }}
          />
        </div>
      </div>
    </Card>
  )
}

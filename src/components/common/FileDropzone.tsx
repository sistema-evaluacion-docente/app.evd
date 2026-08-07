import { FileText, UploadCloud, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatBytes } from '@/lib/formatBytes'
import { cn } from '@/lib/utils'
import { InlineError } from './InlineError'

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

export interface FileDropzoneProps {
  /** The currently selected file, or null. */
  file: File | null
  /** Called with the candidate file from the picker, a drop, or null on remove. */
  onFileChange: (file: File | null) => void
  /** Label shown above the dropzone. Defaults to "Archivo". */
  label?: string
  /** Accepted MIME types for the native picker. Defaults to PDF. */
  accept?: string
  /** Maximum file size in bytes, used in the hint. Defaults to 10 MB. */
  maxSize?: number
  /** Title shown when no file is selected. Defaults to "Selecciona un archivo". */
  title?: string
  /** Hint shown when no file is selected. Defaults to a drag-and-drop + size hint. */
  subtitle?: string
  /** Inline error message (from validation or the server). */
  error?: string | null
  /** Whether the file is currently being uploaded; shows a spinner. */
  isUploading?: boolean
  /** Disables interaction. */
  disabled?: boolean
  /** Extra classes for the dropzone box. */
  className?: string
}

/**
 * Generic clickable and drag-and-drop file picker. It is fully controlled: the
 * parent owns the `file` value and decides how to react to candidates through
 * `onFileChange` (e.g. validating with `useFileUpload`). When a file is
 * selected it shows its name and size plus a remove button.
 *
 * @example
 * <FileDropzone file={file} error={error} onFileChange={handleFile} />
 */
export function FileDropzone({
  file,
  onFileChange,
  label = 'Archivo',
  accept = 'application/pdf,.pdf',
  maxSize = DEFAULT_MAX_SIZE,
  title = 'Selecciona un archivo',
  subtitle,
  error,
  isUploading,
  disabled,
  className,
}: FileDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const subtitleText = subtitle ?? `Arrastra y suelta o haz clic · Máximo ${formatBytes(maxSize)}`

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          onFileChange(event.dataTransfer.files?.[0] ?? null)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          file && 'py-6',
          disabled && 'pointer-events-none opacity-60',
          className,
        )}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />

        {file ? (
          <>
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              {isUploading ? (
                <Spinner aria-label="Subiendo" className="text-primary size-5" />
              ) : (
                <FileText className="text-primary size-5" aria-hidden="true" />
              )}
            </div>

            <div className="text-sm font-medium">
              {isUploading ? 'Subiendo archivo…' : file.name}
            </div>

            <div className="text-muted-foreground text-xs tabular-nums">
              {formatBytes(file.size)}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUploading}
              onClick={(event) => {
                event.stopPropagation()
                onFileChange(null)
              }}
            >
              <X className="size-4" aria-hidden="true" />
              Quitar archivo
            </Button>
          </>
        ) : (
          <>
            {isUploading ? (
              <Spinner aria-label="Subiendo" className="text-muted-foreground size-8" />
            ) : (
              <UploadCloud className="text-muted-foreground size-8" aria-hidden="true" />
            )}

            <div className="text-sm font-medium">{title}</div>

            <div className="text-muted-foreground text-xs">{subtitleText}</div>
          </>
        )}
      </div>

      <InlineError message={error} id={`${inputId}-error`} />
    </div>
  )
}

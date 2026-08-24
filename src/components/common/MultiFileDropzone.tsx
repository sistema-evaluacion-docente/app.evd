import { FileText, UploadCloud, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatBytes } from '@/lib/formatBytes'
import { openLocalFile } from '@/lib/openLocalFile'
import { cn } from '@/lib/utils'
import { InlineError } from './InlineError'

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

export interface MultiFileDropzoneProps {
  /** The files selected so far. */
  files: File[]
  /** Called with the candidates from the picker or a drop, to be validated by the parent. */
  onFilesAdded: (files: File[]) => void
  /** Called with the position of the file to drop. */
  onRemove: (index: number) => void
  /** Label shown above the dropzone. Defaults to "Archivos". */
  label?: string
  /** Accepted MIME types for the native picker. Defaults to PDF. */
  accept?: string
  /** How many files may be selected. Defaults to 2. */
  maxFiles?: number
  /** Maximum file size in bytes, used in the hint. Defaults to 10 MB. */
  maxSize?: number
  /** Title shown inside the box. Defaults to "Selecciona los archivos". */
  title?: string
  /** Hint shown inside the box. Defaults to a drag-and-drop + size hint. */
  subtitle?: string
  /** Inline error message (from validation or the server). */
  error?: string | null
  /** Whether the files are currently being uploaded; shows a spinner and locks removal. */
  isUploading?: boolean
  /** Disables interaction. */
  disabled?: boolean
  /** Extra classes for the dropzone box. */
  className?: string
}

/**
 * Clickable and drag-and-drop picker for a bounded list of files. Fully
 * controlled: the parent owns `files` and decides what to accept through
 * `onFilesAdded` (e.g. validating with `useMultiFileUpload`). Unlike
 * `FileDropzone`, the box keeps prompting while there is room left and the
 * selection is listed underneath it, each entry removable on its own — so the
 * reader sees every document they are about to send, not just the last one.
 * Once `maxFiles` is reached the box stops taking input and says so.
 *
 * @example
 * const { files, error, addFiles, removeFile } = useMultiFileUpload({ maxFiles: 2 })
 * <MultiFileDropzone files={files} error={error} onFilesAdded={addFiles} onRemove={removeFile} />
 */
export function MultiFileDropzone({
  files,
  onFilesAdded,
  onRemove,
  label = 'Archivos',
  accept = 'application/pdf,.pdf',
  maxFiles = 2,
  maxSize = DEFAULT_MAX_SIZE,
  title = 'Selecciona los archivos',
  subtitle,
  error,
  isUploading,
  disabled,
  className,
}: MultiFileDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isFull = files.length >= maxFiles
  const isLocked = Boolean(disabled) || isFull || Boolean(isUploading)

  const subtitleText =
    subtitle ?? `Arrastra y suelta o haz clic · Máximo ${formatBytes(maxSize)} por archivo`

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>

      <div
        onClick={() => {
          if (!isLocked) inputRef.current?.click()
        }}
        onDragOver={(event) => {
          if (isLocked) return
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          if (isLocked) return
          event.preventDefault()
          setIsDragging(false)
          onFilesAdded(Array.from(event.dataTransfer.files ?? []))
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          isLocked ? 'border-border' : 'cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : !isLocked && 'hover:border-primary/50',
          files.length > 0 && 'py-6',
          disabled && 'pointer-events-none opacity-60',
          className,
        )}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="sr-only"
          disabled={isLocked}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => {
            onFilesAdded(Array.from(event.target.files ?? []))
            // Lets the same file be picked again after being removed — the
            // input keeps its value otherwise and fires no change event.
            event.target.value = ''
          }}
        />

        {isUploading ? (
          <Spinner aria-label="Subiendo" className="text-muted-foreground size-8" />
        ) : (
          <UploadCloud
            className={cn('size-8', isFull ? 'text-muted-foreground/50' : 'text-muted-foreground')}
            aria-hidden="true"
          />
        )}

        <div className="text-sm font-medium">
          {isUploading ? 'Subiendo archivos…' : isFull ? 'Selección completa' : title}
        </div>

        <div className="text-muted-foreground text-xs">
          {isFull ? `Ya adjuntó el máximo de ${maxFiles}. Quita uno para cambiarlo.` : subtitleText}
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}`}
              className="border-border flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
                <FileText className="text-primary size-4" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                {/* The name itself opens it, the way a signed format opens
                    from `PlanDocuments`. Only for PDFs: the dropzone is
                    generic and `accept` can name a type the browser would
                    download instead of showing. */}
                {file.type === 'application/pdf' ? (
                  <button
                    type="button"
                    onClick={() => openLocalFile(file)}
                    title={`Previsualizar ${file.name} en una pestaña nueva`}
                    className="block max-w-full cursor-pointer truncate text-sm font-medium underline-offset-2 hover:underline"
                  >
                    {file.name}
                  </button>
                ) : (
                  <p className="truncate text-sm font-medium">{file.name}</p>
                )}

                <p className="text-muted-foreground text-xs tabular-nums">
                  {formatBytes(file.size)}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled || isUploading}
                onClick={() => onRemove(index)}
                aria-label={`Quitar ${file.name}`}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <InlineError message={error} id={`${inputId}-error`} />
    </div>
  )
}

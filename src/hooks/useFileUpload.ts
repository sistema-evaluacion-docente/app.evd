import { useState } from 'react'

import { formatBytes } from '@/lib/formatBytes'

export interface FileUploadOptions {
  /** Accepted MIME types. Defaults to `['application/pdf']`. */
  accept?: string[]
  /** Accepted extensions (e.g. `".pdf"`) for files without a MIME type. Defaults to `['.pdf']`. */
  extensions?: string[]
  /** Maximum file size in bytes. Defaults to 10 MB. */
  maxSize?: number
  /** Called with the selected file once it passes validation. */
  onValidFile?: (file: File) => void
}

export interface FileUploadResult {
  /** The last valid file selected, or null. */
  file: File | null
  /** Descriptive message when the last candidate was rejected, or null. */
  error: string | null
  /** Validates a candidate file (type, extension, size) and stores it. */
  handleFile: (candidate?: File | null) => void
  /** Clears the selected file and any error. */
  clear: () => void
}

/**
 * Manages the selection and validation of a single file for upload: MIME type,
 * extension and maximum size, producing a descriptive error for rejections.
 * Only valid files are stored, so `file` is always safe to submit.
 *
 * @example
 * const { file, error, handleFile, clear } = useFileUpload()
 * <FileDropzone file={file} error={error} onFileChange={handleFile} onRemove={clear} />
 */
export function useFileUpload(options: FileUploadOptions = {}): FileUploadResult {
  const {
    accept = ['application/pdf'],
    extensions = ['.pdf'],
    maxSize = 10 * 1024 * 1024,
    onValidFile,
  } = options

  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const extensionLabel = extensions.map((ext) => ext.replace(/^\./, '').toUpperCase()).join(', ')

  const mimeLabel = accept
    .map((mime) => mime.split('/')[1]?.toUpperCase())
    .filter(Boolean)
    .join(', ')

  const formatLabel = extensionLabel || mimeLabel || 'compatible'

  const maxLabel =
    maxSize >= 1024 * 1024 && maxSize % (1024 * 1024) === 0
      ? `${maxSize / (1024 * 1024)} MB`
      : formatBytes(maxSize)

  const handleFile = (candidate?: File | null) => {
    if (!candidate) {
      setFile(null)
      setError(null)
      return
    }

    const matchesType = accept.includes(candidate.type)
    const matchesExtension = extensions.some((ext) =>
      candidate.name.toLowerCase().endsWith(ext.toLowerCase()),
    )

    if (!matchesType && !matchesExtension) {
      setFile(null)
      setError(`El archivo debe ser ${formatLabel}.`)
      return
    }

    if (candidate.size > maxSize) {
      setFile(null)
      setError(`El archivo supera el máximo permitido de ${maxLabel}.`)
      return
    }

    setError(null)
    setFile(candidate)
    onValidFile?.(candidate)
  }

  const clear = () => {
    setFile(null)
    setError(null)
  }

  return { file, error, handleFile, clear }
}

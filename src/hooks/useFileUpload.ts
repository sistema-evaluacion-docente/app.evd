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
 * Builds the type/extension/size check shared by the single- and multi-file
 * hooks, returning the rejection message for a candidate or `null` when it
 * passes.
 */
function createFileValidator({
  accept = ['application/pdf'],
  extensions = ['.pdf'],
  maxSize = 10 * 1024 * 1024,
}: FileUploadOptions) {
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

  return (candidate: File): string | null => {
    const matchesType = accept.includes(candidate.type)
    const matchesExtension = extensions.some((ext) =>
      candidate.name.toLowerCase().endsWith(ext.toLowerCase()),
    )

    if (!matchesType && !matchesExtension) return `El archivo debe ser ${formatLabel}.`
    if (candidate.size > maxSize) return `El archivo supera el máximo permitido de ${maxLabel}.`

    return null
  }
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
  const validate = createFileValidator(options)

  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (candidate?: File | null) => {
    if (!candidate) {
      setFile(null)
      setError(null)
      return
    }

    const message = validate(candidate)

    if (message) {
      setFile(null)
      setError(message)
      return
    }

    setError(null)
    setFile(candidate)
    options.onValidFile?.(candidate)
  }

  const clear = () => {
    setFile(null)
    setError(null)
  }

  return { file, error, handleFile, clear }
}

export interface MultiFileUploadOptions extends Omit<FileUploadOptions, 'onValidFile'> {
  /** How many files may be selected at once. Defaults to 2. */
  maxFiles?: number
  /** Called with the files kept after a selection. */
  onChange?: (files: File[]) => void
}

export interface MultiFileUploadResult {
  /** Every valid file selected so far, in the order they were added. */
  files: File[]
  /** Descriptive message when a candidate was rejected, or null. */
  error: string | null
  /** Validates candidates (type, extension, size, duplicates, count) and appends them. */
  addFiles: (candidates?: FileList | File[] | null) => void
  /** Drops the file at `index`. */
  removeFile: (index: number) => void
  /** Clears every file and any error. */
  clear: () => void
}

/**
 * Same validation as `useFileUpload`, for a bounded list of files: it also
 * rejects a file already in the list (same name and size — picking the same
 * document twice is the easy mistake) and anything past `maxFiles`. Valid
 * candidates are kept even when a sibling in the same batch is rejected, so
 * one bad file never discards the good ones.
 *
 * @example
 * const { files, error, addFiles, removeFile } = useMultiFileUpload({ maxFiles: 2 })
 * <MultiFileDropzone files={files} error={error} onFilesAdded={addFiles} onRemove={removeFile} />
 */
export function useMultiFileUpload(options: MultiFileUploadOptions = {}): MultiFileUploadResult {
  const { maxFiles = 2, onChange } = options
  const validate = createFileValidator(options)

  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const fileWord = maxFiles === 1 ? 'archivo' : 'archivos'

  const addFiles = (candidates?: FileList | File[] | null) => {
    const list = candidates ? Array.from(candidates) : []

    if (list.length === 0) return

    const next = [...files]
    let message: string | null = null

    for (const candidate of list) {
      if (next.length >= maxFiles) {
        message ??= `Solo puede adjuntar ${maxFiles} ${fileWord}.`
        break
      }

      const invalid = validate(candidate)

      if (invalid) {
        message ??= invalid
        continue
      }

      const isDuplicate = next.some(
        (file) => file.name === candidate.name && file.size === candidate.size,
      )

      if (isDuplicate) {
        message ??= `Ya adjuntó "${candidate.name}".`
        continue
      }

      next.push(candidate)
    }

    setFiles(next)
    setError(message)
    onChange?.(next)
  }

  const removeFile = (index: number) => {
    const next = files.filter((_, position) => position !== index)

    setFiles(next)
    setError(null)
    onChange?.(next)
  }

  const clear = () => {
    setFiles([])
    setError(null)
    onChange?.([])
  }

  return { files, error, addFiles, removeFile, clear }
}

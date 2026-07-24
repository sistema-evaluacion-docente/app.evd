import { useRef, useState } from 'react'

import { useUploadTeachers } from '@/features/teachers'

/**
 * Custom hook for managing the state and behavior of the upload page.
 *
 * @returns {object} An object containing state variables and handler functions for the upload page.
 */
export function useUploadPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const { status, fileName, error, result, upload, reset } = useUploadTeachers()

  const handleFile = (file: File | undefined) => {
    if (!file) return
    upload(file)
  }

  const handleReset = () => {
    reset()
    if (inputRef.current) inputRef.current.value = ''
  }

  const busy = status === 'uploading'
  const ready = status === 'success'
  const createdCount = result?.created.length ?? 0
  const skippedCount = result?.skipped.length ?? 0
  const errorsCount = result?.errors.length ?? 0

  return {
    inputRef,
    dragOver,
    setDragOver,
    status,
    fileName,
    error,
    result,
    handleFile,
    handleReset,
    busy,
    ready,
    createdCount,
    skippedCount,
    errorsCount,
  }
}

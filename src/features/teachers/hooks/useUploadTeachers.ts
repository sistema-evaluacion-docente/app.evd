import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { uploadTeachersExcel, type TeacherBulkResult } from '../api/teacherService'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

const MAX_SIZE = 5 * 1024 * 1024

/**
 * Custom hook for managing the state and behavior of the teacher upload process.
 *
 * @returns {object} An object containing state variables and handler functions for the upload process.
 */
export function useUploadTeachers() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<TeacherBulkResult | null>(null)

  const upload = useCallback(async (file: File) => {
    setFileName(file.name)
    setError('')
    setResult(null)

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      const errorMsg = 'Solo se aceptan archivos en formato Excel (.xlsx, .xls) o CSV (.csv)'
      setError(errorMsg)
      toast.error(errorMsg)
      setStatus('error')
      return
    }

    if (file.size > MAX_SIZE) {
      const errorMsg = 'El archivo excede el tamaño máximo de 5MB.'
      setError(errorMsg)
      toast.error(errorMsg)
      setStatus('error')
      return
    }

    setStatus('uploading')

    try {
      const response = await uploadTeachersExcel(file)

      if (!response.data) {
        const errorMsg = 'Error al subir el archivo.'
        setError(errorMsg)
        toast.error(errorMsg)
        setStatus('error')
        return
      }

      setResult(response.data)
      setStatus('success')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al subir el archivo.'

      setError(errorMsg)
      toast.error(errorMsg)
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setFileName('')
    setError('')
    setResult(null)
  }, [])

  return {
    status,
    fileName,
    error,
    result,
    upload,
    reset,
  }
}

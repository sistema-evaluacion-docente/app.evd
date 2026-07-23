import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { uploadEvaluation } from '../api/evaluationService'
import type { AiStatus } from '../types/Evaluation'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

const MAX_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function useUploadEvaluation() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [evaluationId, setEvaluationId] = useState<number | null>(null)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)

  const upload = useCallback(async (file: File) => {
    setFileName(file.name)
    setFileSize(formatFileSize(file.size))
    setError('')

    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Solo se aceptan archivos en formato PDF Institucional.')
      setError('Solo se aceptan archivos en formato PDF Institucional.')
      setStatus('error')
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error('El archivo excede el tamaño máximo de 10MB.')
      setError('El archivo excede el tamaño máximo de 10MB.')
      setStatus('error')
      return
    }

    toast.info('Iniciando carga del archivo...')
    setStatus('uploading')

    try {
      const uploadResult = await uploadEvaluation(file)
      const evaluationId: number = uploadResult.data.id

      setEvaluationId(evaluationId)
      setAiStatus(uploadResult.data.ai_status)

      toast.success('Archivo cargado exitosamente.')
      setStatus('success')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo.')

      setError(err instanceof Error ? err.message : 'Error al subir el archivo.')
      setStatus('error')
      setEvaluationId(null)
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setFileName('')
    setFileSize('')
    setError('')
    setEvaluationId(null)
    setAiStatus(null)
  }, [])

  const loadSample = useCallback(() => {
    setFileName('evaluaciones_finales_2023_Q2.pdf')
    setStatus('success')
  }, [])

  return {
    status,
    fileName,
    fileSize,
    error,
    upload,
    reset,
    loadSample,
    evaluationId,
    aiStatus,
  }
}

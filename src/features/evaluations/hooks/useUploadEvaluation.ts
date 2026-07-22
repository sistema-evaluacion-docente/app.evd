import { useCallback, useEffect, useRef, useState } from 'react'

import { toast } from 'sonner'
import { uploadEvaluation } from '../api/evaluationService'
import type { AiStatus } from '../types/Evaluation'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

const MAX_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface UploadStats {
  teachers: number
  comments: number
}

export function useUploadEvaluation() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<UploadStats>({ teachers: 0, comments: 0 })
  const [fileSize, setFileSize] = useState('')
  const [evaluationId, setEvaluationId] = useState<number | null>(null)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)

  const progressVal = useRef(0)
  const tickId = useRef<number>(0)

  const clearTimers = () => {
    window.clearInterval(tickId.current)
  }

  useEffect(() => () => clearTimers(), [])

  const startTick = (from: number, to: number, stepMs: number) => {
    window.clearInterval(tickId.current)
    progressVal.current = from
    tickId.current = window.setInterval(() => {
      progressVal.current = Math.min(progressVal.current + 1, to)
      setProgress(progressVal.current)
      if (progressVal.current >= to) window.clearInterval(tickId.current)
    }, stepMs)
  }

  const upload = useCallback(async (file: File) => {
    clearTimers()
    setFileName(file.name)
    setFileSize(formatFileSize(file.size))
    setError('')
    progressVal.current = 0
    setProgress(0)

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
    startTick(0, 90, 100)

    try {
      const uploadResult = await uploadEvaluation(file)
      const evaluationId: number = uploadResult.data.id

      window.clearInterval(tickId.current)
      setEvaluationId(evaluationId)
      setAiStatus(uploadResult.data.ai_status)
      setStats({
        teachers: uploadResult.data.count ?? 0,
        comments: 0,
      })

      setProgress(100)
      toast.success('Archivo cargado exitosamente.')
      setStatus('success')
    } catch (err) {
      clearTimers()
      setProgress(0)
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo.')
      setError(err instanceof Error ? err.message : 'Error al subir el archivo.')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    progressVal.current = 0

    setStatus('idle')
    setProgress(0)
    setFileName('')
    setFileSize('')
    setError('')
    setEvaluationId(null)
    setAiStatus(null)
    setStats({ teachers: 0, comments: 0 })
  }, [])

  const loadSample = useCallback(() => {
    clearTimers()
    setFileName('evaluaciones_finales_2023_Q2.pdf')
    setProgress(100)
    setStats({ teachers: 142, comments: 3892 })
    setStatus('success')
  }, [])

  return {
    status,
    progress,
    fileName,
    fileSize,
    error,
    stats,
    upload,
    reset,
    loadSample,
    evaluationId,
    aiStatus,
  }
}

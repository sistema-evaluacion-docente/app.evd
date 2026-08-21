import { useEffect, useMemo } from 'react'

import type { CourseModality } from '@/lib/modality'
import { useGetEvaluationPdf, useGetTeacherEvaluationReport } from '../api'

export interface EvaluationPdfUrlParams {
  evaluationId?: number
  /**
   * Reads the teacher's own report of the evaluation instead of the whole
   * document — the split the backend builds for that teacher, and the only
   * part of the PDF they are allowed to see.
   */
  teacherId?: number
  /**
   * Which of the two documents an evaluation can carry to read. Ignored for a
   * teacher's report, which is already scoped to them; the backend defaults to
   * `PRESENCIAL` when omitted.
   */
  modality?: CourseModality
}

/**
 * Turns the protected PDF of an evaluation into a browser-usable object URL.
 * The file can't be linked to directly — it is served behind the Bearer token —
 * so it is fetched as a `Blob` and wrapped in an object URL that is revoked as
 * soon as the blob changes or the component unmounts, avoiding the leak a bare
 * `URL.createObjectURL` would cause.
 *
 * @returns The object URL (or `null` while unavailable) plus the query state.
 *
 * @example
 * const { url, isPending, error } = useEvaluationPdfUrl({ evaluationId });
 *
 * @example
 * // The teacher's own split of the same document.
 * const { url } = useEvaluationPdfUrl({ evaluationId, teacherId });
 *
 * @example
 * const { url } = useEvaluationPdfUrl({ evaluationId, modality: 'DISTANCIA' });
 */
export function useEvaluationPdfUrl({ evaluationId, teacherId, modality }: EvaluationPdfUrlParams) {
  const forTeacher = teacherId != null

  // Both are declared, only the one matching the caller is enabled: hooks
  // can't be called conditionally, and a disabled query never fires.
  const wholeDocument = useGetEvaluationPdf(forTeacher ? undefined : evaluationId, modality)
  const teacherReport = useGetTeacherEvaluationReport({ teacherId, evaluationId })

  const { data: blob, isPending, isError, error } = forTeacher ? teacherReport : wholeDocument

  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])

  useEffect(() => {
    if (!url) return

    return () => URL.revokeObjectURL(url)
  }, [url])

  return {
    url,
    isPending: evaluationId != null && isPending,
    isError,
    error,
  }
}

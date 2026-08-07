import { useEffect, useMemo } from 'react'

import { useGetEvaluationPdf } from '../api'

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
 * const { url, isPending, error } = useEvaluationPdfUrl(evaluationId);
 */
export function useEvaluationPdfUrl(evaluationId?: number) {
  const { data: blob, isPending, isError, error } = useGetEvaluationPdf(evaluationId)

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

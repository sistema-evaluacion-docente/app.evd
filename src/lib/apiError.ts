/**
 * Application error carrying the message and code reported by the API.
 */
export class ApiError extends Error {
  /** Backend error code (e.g. `HTTP_ERROR`, `VALIDATION_ERROR`). */
  code?: string
  /** HTTP status code, when available. */
  status?: number

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message)
    this.name = 'ApiError'
    this.code = options?.code
    this.status = options?.status
  }
}

interface ApiErrorDetail {
  code?: string
  message?: string
}

function messageFromDetail(detail: unknown): string {
  if (typeof detail === 'string' && detail.trim()) return detail

  if (detail && typeof detail === 'object' && 'message' in detail) {
    const message = (detail as ApiErrorDetail).message
    if (typeof message === 'string' && message.trim()) return message
  }

  return ''
}

/**
 * Extracts a human-readable message from an API error body, which may arrive as
 * `{ error: string }`, `{ error: { code, message } }`, `{ message }` or
 * `{ detail }`. Returns `''` when nothing usable is found.
 *
 * @param payload - The API response body (or `error.response.data`).
 * @returns The extracted message, or an empty string.
 */
export function extractApiErrorMessage(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return ''

  const record = payload as Record<string, unknown>

  const fromError = messageFromDetail(record.error)
  if (fromError) return fromError

  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail

  return ''
}

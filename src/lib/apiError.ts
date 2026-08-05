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

interface ApiFieldError {
  field?: string
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

/** Formats a single validation error as `Field: message`, dropping the `query.` prefix. */
function formatFieldError(fieldError: ApiFieldError): string {
  const field = fieldError.field?.replace(/^query\./, '') ?? 'Campo'
  const message = fieldError.message?.trim()

  if (!message) return ''

  return `${field}: ${message}`
}

/**
 * Builds a readable message from a `details.errors` array of field errors
 * (FastAPI-style validation), one line per error. Returns `''` when empty.
 */
function messageFromDetails(detail: unknown): string {
  if (!detail || typeof detail !== 'object') return ''

  const record = detail as Record<string, unknown>
  const errors = record.errors

  if (!Array.isArray(errors)) return ''

  const lines = errors
    .map((error) => formatFieldError(error as ApiFieldError))
    .filter((line): line is string => line.length > 0)

  return lines.join('. ')
}

/**
 * Extracts a human-readable message from an API error body, which may arrive as
 * `{ error: string }`, `{ error: { code, message } }`, `{ error: { details: { errors: [...] } } }`,
 * `{ message }` or `{ detail }`. Validation details produce one line per field
 * (`Field: message`). Returns `''` when nothing usable is found.
 *
 * @param payload - The API response body (or `error.response.data`).
 * @returns The extracted message, or an empty string.
 */
export function extractApiErrorMessage(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return ''

  const record = payload as Record<string, unknown>

  const errorDetail = record.error

  if (errorDetail && typeof errorDetail === 'object') {
    const details = (errorDetail as Record<string, unknown>).details

    const fromFieldErrors = messageFromDetails(details)
    if (fromFieldErrors) return fromFieldErrors
  }

  const fromError = messageFromDetail(errorDetail)
  if (fromError) return fromError

  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail

  return ''
}

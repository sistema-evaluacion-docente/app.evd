import { useMemo, useState } from 'react'

import type { LogEntry } from './useDevLogWebSocket'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
const CATEGORIES = ['request', 'response', 'db_write'] as const

export { CATEGORIES, METHODS }

/**
 * Custom hook to filter log entries based on search, method, and category.
 *
 * @param logs - The array of log entries to filter.
 * @returns An object containing the current search term, method filter, category filter,
 *          and the filtered log entries.
 */
export function useLogFilter(logs: LogEntry[]) {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const { meta } = parseLogMessage(log.message)

      if (methodFilter && meta.method !== methodFilter) return false
      if (categoryFilter && meta.category !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!log.message.toLowerCase().includes(q)) return false
      }

      return true
    })
  }, [logs, search, methodFilter, categoryFilter])

  return {
    search,
    setSearch,
    methodFilter,
    setMethodFilter,
    categoryFilter,
    setCategoryFilter,
    filteredLogs,
  }
}

interface LogMeta {
  method: string | null
  category: string
  path: string | null
  statusCode: number | null
}

export function parseLogMessage(message: string): {
  text: string
  detail: string | null
  meta: LogMeta
} {
  try {
    const parsed = JSON.parse(message)

    const meta: LogMeta = {
      method: parsed.method ?? null,
      category: parsed.category ?? 'unknown',
      path: parsed.path ?? null,
      statusCode: parsed.status_code ?? null,
    }

    const cleaned = Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, v]) => v !== null),
    )

    delete cleaned.detail

    if (parsed.detail) {
      const detailParsed = JSON.parse(parsed.detail)
      const restStr = Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned, null, 2) : ''
      const detailStr = JSON.stringify(detailParsed, null, 2)

      return { text: restStr, detail: detailStr, meta }
    }

    return {
      text: Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned, null, 2) : '',
      detail: null,
      meta,
    }
  } catch {
    return {
      text: message,
      detail: null,
      meta: { method: null, category: 'unknown', path: null, statusCode: null },
    }
  }
}

import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import type { PaginationState } from '@tanstack/react-table'

import { PLAN_STATUS_LABEL } from '../lib/planStatus'
import type { PlanStatus } from '../types'

/** Query-string keys of the plans directory. Spanish, like the routes. */
const PARAM = {
  teacher: 'docente',
  teacherName: 'nombre',
  search: 'buscar',
  period: 'periodo',
  status: 'estado',
  page: 'pagina',
  pageSize: 'filas',
} as const

type Param = keyof typeof PARAM

/** `?periodo=todos` — every semester at once, instead of the newest one. */
const ALL_PERIODS = 'todos'

/** Same options the table offers, so a hand-typed `filas` can't ask the API for
 *  an arbitrary page size. */
const PAGE_SIZES = [5, 10, 20, 50]
const DEFAULT_PAGE_SIZE = 10

function isPlanStatus(value: string): value is PlanStatus {
  return value in PLAN_STATUS_LABEL
}

/**
 * `undefined` while nobody has chosen a period — the newest semester leads
 * then; `null` is the explicit "todos los periodos".
 */
function readPeriod(raw: string | null): string | null | undefined {
  if (!raw) return undefined

  return raw === ALL_PERIODS ? null : raw
}

/**
 * Filters of the plans directory, read from and written to the query string.
 *
 * The URL is the only source of truth: the view is shareable, survives a
 * reload, and a link from a teacher's profile
 * (`/planes?docente=42&nombre=Ana%20Ruiz&periodo=todos`) lands on his whole
 * history without the page needing a mode of its own.
 *
 * A pinned teacher filters by id — an oddly formatted name can never empty the
 * table — while `nombre` only fills the search box, so the director reads who
 * he is looking at.
 *
 * @example
 * const { search, teacherId, setSearch } = usePlansFilters()
 */
export function usePlansFilters() {
  const [searchParams] = useSearchParams()
  const [location, navigate] = useLocation()

  const rawTeacher = searchParams.get(PARAM.teacher)
  const teacherId = rawTeacher && /^\d+$/.test(rawTeacher) ? Number(rawTeacher) : undefined
  const teacherName = searchParams.get(PARAM.teacherName)?.trim() || undefined

  const rawStatus = searchParams.get(PARAM.status) ?? ''
  const status: PlanStatus | '' = isPlanStatus(rawStatus) ? rawStatus : ''

  const periodCode = readPeriod(searchParams.get(PARAM.period))

  // While a teacher is pinned the box shows his name: the filter and the text
  // the director reads are the same thing, so there is only ever one to clear.
  const search = teacherId ? (teacherName ?? '') : (searchParams.get(PARAM.search) ?? '')

  const rawPage = Number(searchParams.get(PARAM.page))
  const pageIndex = Number.isInteger(rawPage) && rawPage > 1 ? rawPage - 1 : 0

  const rawPageSize = Number(searchParams.get(PARAM.pageSize))
  const pageSize = PAGE_SIZES.includes(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE

  const update = useCallback(
    (patch: Partial<Record<Param, string | null>>) => {
      const next = new URLSearchParams(searchParams)

      for (const [field, value] of Object.entries(patch) as [Param, string | null][]) {
        // A filter at its default stays out of the URL, so a plain `/planes`
        // is what the director copies once he clears everything.
        if (value) next.set(PARAM[field], value)
        else next.delete(PARAM[field])
      }

      const query = next.toString()

      // Replaced, not pushed: filtering is not a step the back button should
      // have to walk through keystroke by keystroke.
      navigate(query ? `${location}?${query}` : location, { replace: true })
    },
    [location, navigate, searchParams],
  )

  /** Every filter but the page itself sends the table back to the first one. */
  const setSearch = useCallback(
    (value: string) =>
      // Typing over a pinned teacher's name releases the pin: the box always
      // says what is filtering, so editing it hands control back to the text.
      update({ search: value, teacher: null, teacherName: null, page: null }),
    [update],
  )

  const setStatus = useCallback(
    (value: PlanStatus | '') => update({ status: value, page: null }),
    [update],
  )

  /** `null` is "todos los periodos"; a code pins that one semester. */
  const setPeriodCode = useCallback(
    (code: string | null) => update({ period: code ?? ALL_PERIODS, page: null }),
    [update],
  )

  const setPagination = useCallback(
    ({ pageIndex: index, pageSize: size }: PaginationState) =>
      update({
        page: index > 0 ? String(index + 1) : null,
        pageSize: size === DEFAULT_PAGE_SIZE ? null : String(size),
      }),
    [update],
  )

  /** Back to the whole directory, keeping the period and status in place. */
  const clearTeacher = useCallback(
    () => update({ teacher: null, teacherName: null, page: null }),
    [update],
  )

  return {
    search,
    status,
    periodCode,
    teacherId,
    teacherName,
    pageIndex,
    pageSize,
    setSearch,
    setStatus,
    setPeriodCode,
    setPagination,
    clearTeacher,
  }
}

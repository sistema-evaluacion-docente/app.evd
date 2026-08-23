import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/features/auth'
import { CommentCard, CommentList, TeacherSelect } from '@/features/teachers'
import { useModalityFilter } from '@/hooks/useModalityFilter'
import { useTableFilters } from '@/hooks/useTableFilters'
import { CATEGORIES } from '@/lib/categoryLabel'
import { MODALITIES } from '@/lib/modality'
import { RISK_LEVELS } from '@/lib/riskLevel'
import { useGetComments } from '../api'

/** Reads the `#<comment id>` a link (e.g. a "riesgo alto" notification) may
 *  have landed on, ignoring anything that isn't a usable comment id. */
function commentIdFromHash(): number | undefined {
  const id = Number(window.location.hash.slice(1))

  return Number.isInteger(id) && id > 0 ? id : undefined
}

const filterConfig: FilterConfig[] = [
  {
    type: 'select',
    name: 'modality',
    label: 'Modalidad',
    placeholder: 'Todas',
    options: MODALITIES.map(({ value, label }) => ({ value, label })),
    clearable: true,
  },
  {
    type: 'select',
    name: 'riskLevel',
    label: 'Nivel de riesgo',
    options: RISK_LEVELS.map((level) => ({ label: level.name, value: level.id })),
    clearable: true,
  },
  {
    type: 'select',
    name: 'pedagogicalCategoryId',
    label: 'Categoría pedagógica',
    options: CATEGORIES.map((category) => ({ label: category.label, value: category.id })),
    clearable: true,
  },
]

interface CommentsListProps {
  /**
   * Pins the list to a single risk level (see `RISK_LEVELS`). The "Nivel de
   * riesgo" filter is dropped from the panel when set, since the level is no
   * longer the reader's to choose.
   */
  riskLevel?: number
  /**
   * Preselects the "Docente" filter — e.g. a "riesgo alto" notification
   * linking to one teacher's alerts. Just the initial value: the reader can
   * still change or clear it afterwards.
   */
  initialTeacherId?: number
  /** Shown when no comment matches the current filters. */
  emptyMessage?: string
}

/**
 * Displays the paginated list of comments (`GET /comments/`) of a selected
 * academic period, with server-side search and filters by teacher, risk
 * level, pedagogical category and modality. The period and the modality are
 * read from/written to the `period` and `modality` URL query params, so a
 * narrowed read stays linkable.
 *
 * @example
 * <CommentsList />
 *
 * @example
 * // Only the high-risk comments, with no risk filter to loosen it.
 * <CommentsList riskLevel={3} emptyMessage="No hay comentarios de riesgo alto." />
 *
 * @example
 * // Landed on from a "riesgo alto" notification, scoped to that teacher.
 * <CommentsList riskLevel={3} initialTeacherId={teacherId} />
 */
export function CommentsList({
  riskLevel,
  initialTeacherId,
  emptyMessage = 'No hay comentarios que coincidan con los filtros aplicados.',
}: CommentsListProps = {}) {
  const departmentId = useAuthStore((state) => state.user?.department_id)
  const [periodId, setPeriodId] = useState<number | undefined>(undefined)
  const [teacherId, setTeacherId] = useState<number | undefined>(initialTeacherId)
  const [highlightId, setHighlightId] = useState(commentIdFromHash)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [page, setPage] = useState(1)

  const { modality, setModality } = useModalityFilter()

  const { filters, setFilters } = useTableFilters(
    riskLevel ? `comments-risk-${riskLevel}` : 'comments',
    {
      riskLevel: undefined as number | undefined,
      pedagogicalCategoryId: undefined as string | undefined,
    },
  )

  const availableFilters = riskLevel
    ? filterConfig.filter((filter) => filter.name !== 'riskLevel')
    : filterConfig

  const selectedRiskLevel = riskLevel ?? (filters.riskLevel ? Number(filters.riskLevel) : undefined)

  const resetPage = useDebouncedCallback(() => setPage(1), 400)

  const { data, isPending, error } = useGetComments({
    page,
    limit: 10,
    academicPeriodId: periodId,
    teacherId,
    riskLevel: selectedRiskLevel,
    pedagogicalCategoryId: filters.pedagogicalCategoryId
      ? Number(filters.pedagogicalCategoryId)
      : undefined,
    search: debouncedSearch,
    modality,
    enabled: periodId !== undefined && Boolean(departmentId),
  })

  const comments = data?.data ?? []
  const pages = data?.pagination?.pages ?? 1

  // Scrolls to the comment a link (e.g. a "riesgo alto" notification) landed
  // on, once it's actually rendered — only reachable when it's on the page
  // the current filters/pagination happen to show. The highlight itself
  // fades out on its own via `CommentCard`'s existing `transition-colors`.
  useEffect(() => {
    if (highlightId == null || isPending) return

    const node = document.getElementById(String(highlightId))

    if (!node) return

    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timeout = setTimeout(() => setHighlightId(undefined), 2500)

    return () => clearTimeout(timeout)
    // `data`, not the derived `comments` array (a fresh `?? []` literal on
    // every render data is still loading) — this only needs to re-run once
    // the underlying query result actually changes.
  }, [highlightId, isPending, data])

  if (!departmentId) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        Su usuario no está vinculado a un departamento. Contacte al administrador del sistema.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />

          <Input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              resetPage()
            }}
            placeholder="Buscar en los comentarios..."
            aria-label="Buscar en los comentarios"
            className="bg-background h-9 w-64 pl-9 shadow-none"
          />
        </div>

        <PeriodSelect
          value={periodId}
          onValueChange={(id) => {
            setPeriodId(id)
            resetPage()
          }}
          searchParam="period"
        />

        <TeacherSelect
          idValue={teacherId}
          onIdChange={(id) => {
            setTeacherId(id)
            resetPage()
          }}
        />

        <DataTableFilters
          filters={availableFilters}
          // The modality lives in the URL, the rest in the table's own state;
          // the panel reads them as one set of values and hands them back the
          // same way, so they are split again here.
          values={{ ...filters, modality }}
          onChange={({ modality: nextModality, ...rest }) => {
            setFilters(rest)
            setModality(nextModality as string | undefined)

            // A modality change swaps the whole result set, so page 1 has to
            // travel with the very next request instead of 400ms later.
            if (nextModality === modality) resetPage()
            else setPage(1)
          }}
        />
      </div>

      <div className="bg-background border-border/70 rounded-lg border px-6">
        <CommentList
          comments={comments}
          isLoading={isPending}
          error={error ? error.message : null}
          emptyMessage={emptyMessage}
          renderComment={(comment, index) => (
            <CommentCard
              comment={comment}
              index={index}
              showTeacher
              showCourse
              highlighted={comment.id === highlightId}
            />
          )}
        />
      </div>

      {!isPending && !error && comments.length > 0 && (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>

          <span
            aria-live="polite"
            className="text-muted-foreground min-w-20 text-center text-sm tabular-nums"
          >
            Página {page} de {pages}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            aria-label="Página siguiente"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

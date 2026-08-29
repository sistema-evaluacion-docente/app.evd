import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/features/auth'
import { CommentCard, CommentList, TeacherSelect } from '@/features/teachers'
import { useModalityFilter } from '@/hooks/useModalityFilter'
import { useRiskLevelFilter } from '@/hooks/useRiskLevelFilter'
import { useTableFilters } from '@/hooks/useTableFilters'
import { CATEGORIES } from '@/lib/categoryLabel'
import { MODALITIES } from '@/lib/modality'
import { RISK_LEVELS } from '@/lib/riskLevel'
import { useGetComment, useGetComments } from '../api'

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)

  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

/**
 * The `#<comment id>` a link (e.g. a "riesgo alto" notification) landed on,
 * ignoring anything that isn't a usable comment id. Subscribed rather than
 * read once, so a second notification opened while this page is already
 * mounted points at its own comment: `TransitionLink` announces its
 * `pushState` with a `popstate` event, and a plain anchor fires `hashchange`.
 */
function useLinkedCommentId(): number | undefined {
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => '',
  )
  const id = Number(hash.slice(1))

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
   * linking to one teacher's alerts. Re-applied every time the value itself
   * changes (another link into an already-open page); in between, the reader
   * can still change or clear the filter.
   */
  initialTeacherId?: number
  /** Shown when no comment matches the current filters. */
  emptyMessage?: string
}

/**
 * Displays the paginated list of comments (`GET /comments/`) of a selected
 * academic period, with server-side search and filters by teacher, risk
 * level, pedagogical category and modality. The period, the modality and the
 * risk level are read from/written to the `period`, `modality` and `riskLevel`
 * URL query params, so a narrowed read stays linkable — the department
 * summary's risk chart links straight into one level's comments.
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
  const linkedCommentId = useLinkedCommentId()
  const [periodId, setPeriodId] = useState<number | undefined>(undefined)
  const [teacherId, setTeacherId] = useState<number | undefined>(initialTeacherId)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [page, setPage] = useState(1)

  // A second link into the page — another teacher's alerts from a different
  // "riesgo alto" notification — lands on the component already mounted, so
  // `initialTeacherId` has to be re-read on change instead of only at mount.
  // Adjusted during render rather than in an effect so the query below already
  // asks for the new teacher on this pass, with no interim request for the old
  // one.
  const [appliedTeacherId, setAppliedTeacherId] = useState(initialTeacherId)

  if (initialTeacherId !== appliedTeacherId) {
    setAppliedTeacherId(initialTeacherId)
    setTeacherId(initialTeacherId)
    setPage(1)
  }

  const { modality, setModality } = useModalityFilter()
  const { riskLevel: urlRiskLevel, setRiskLevel } = useRiskLevelFilter()

  const { filters, setFilters } = useTableFilters(
    riskLevel ? `comments-risk-${riskLevel}` : 'comments',
    {
      pedagogicalCategoryId: undefined as string | undefined,
    },
  )

  const availableFilters = riskLevel
    ? filterConfig.filter((filter) => filter.name !== 'riskLevel')
    : filterConfig

  const selectedRiskLevel = riskLevel ?? urlRiskLevel

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

  // Fetched by id instead of being looked for among `comments`: the linked
  // comment only lands in the list when it happens to fall on the page the
  // current filters and pagination return, which for a teacher with more than
  // `limit` alerts it usually doesn't. Pinned above the list below.
  const { data: linkedData, error: linkedError } = useGetComment(linkedCommentId)
  const linkedComment = linkedData?.data

  // Kept out of the list so it isn't read twice on the same screen.
  const comments = (data?.data ?? []).filter((comment) => comment.id !== linkedComment?.id)
  const pages = data?.pagination?.pages ?? 1

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
          values={{ ...filters, modality, riskLevel: urlRiskLevel }}
          onChange={({ modality: nextModality, riskLevel: nextRiskLevel, ...rest }) => {
            setFilters(rest)
            setModality(nextModality as string | undefined)

            if (!riskLevel) setRiskLevel(nextRiskLevel as number | undefined)

            if (nextModality === modality && nextRiskLevel === urlRiskLevel) resetPage()
            else setPage(1)
          }}
        />
      </div>

      {linkedCommentId !== undefined && (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Comentario de la notificación
          </h2>

          <div className="bg-background border-border/70 rounded-lg border px-6">
            <CommentList
              comments={linkedComment ? [linkedComment] : []}
              isLoading={!linkedComment && !linkedError}
              error={linkedError ? linkedError.message : null}
              skeletonCount={1}
              emptyMessage="El comentario de esta notificación ya no está disponible."
              renderComment={(comment, index) => (
                <CommentCard comment={comment} index={index} showTeacher showCourse highlighted />
              )}
            />
          </div>
        </section>
      )}

      <div className="bg-background border-border/70 rounded-lg border px-6">
        <CommentList
          comments={comments}
          isLoading={isPending}
          error={error ? error.message : null}
          emptyMessage={emptyMessage}
          renderComment={(comment, index) => (
            <CommentCard comment={comment} index={index} showTeacher showCourse />
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

import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/features/auth'
import { CommentList, TeacherSelect } from '@/features/teachers'
import { useModalityFilter } from '@/hooks/useModalityFilter'
import { useTableFilters } from '@/hooks/useTableFilters'
import { CATEGORIES } from '@/lib/categoryLabel'
import { MODALITIES } from '@/lib/modality'
import { RISK_LEVELS } from '@/lib/riskLevel'
import { useGetComments } from '../api'

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

/**
 * Displays the paginated list of comments (`GET /comments/`) of a selected
 * academic period, with server-side search and filters by teacher, risk
 * level, pedagogical category and modality. The period and the modality are
 * read from/written to the `period` and `modality` URL query params, so a
 * narrowed read stays linkable.
 *
 * @example
 * <CommentsList />
 */
export function CommentsList() {
  const departmentId = useAuthStore((state) => state.user?.department_id)
  const [periodId, setPeriodId] = useState<number | undefined>(undefined)
  const [teacherId, setTeacherId] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [page, setPage] = useState(1)

  const { modality, setModality } = useModalityFilter()

  const { filters, setFilters } = useTableFilters('comments', {
    riskLevel: undefined as number | undefined,
    pedagogicalCategoryId: undefined as string | undefined,
  })

  const resetPage = useDebouncedCallback(() => setPage(1), 400)

  const { data, isPending, error } = useGetComments({
    page,
    limit: 10,
    academicPeriodId: periodId,
    teacherId,
    riskLevel: filters.riskLevel ? Number(filters.riskLevel) : undefined,
    pedagogicalCategoryId: filters.pedagogicalCategoryId
      ? Number(filters.pedagogicalCategoryId)
      : undefined,
    search: debouncedSearch,
    modality,
    enabled: periodId !== undefined && Boolean(departmentId),
  })

  const comments = data?.data ?? []
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
          filters={filterConfig}
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
          commentProps={{ showTeacher: true, showCourse: true }}
          emptyMessage="No hay comentarios que coincidan con los filtros aplicados."
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

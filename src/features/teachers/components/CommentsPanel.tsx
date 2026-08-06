import { ChevronRight, Search, X } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { categoryColor, categoryLabel } from '@/lib/categoryLabel'
import { cn } from '@/lib/utils'
import { useCommentFilters, type CommentFilterOption } from '../hooks'
import type { TeacherCommentsCourse } from '../types'
import { CommentList, type CommentListProps } from './CommentList'

export interface CommentsPanelProps {
  /** Comments grouped by course, as returned by the comments endpoint. */
  courses: TeacherCommentsCourse[] | undefined
  isLoading?: boolean
  error?: string | null
  /** Panel heading; pass `null` (or `showHeader={false}`) to hide it. */
  title?: ReactNode
  description?: ReactNode
  /** Slot on the right of the header (export buttons, links...). */
  headerActions?: ReactNode
  showHeader?: boolean
  /** Stacked bar with the risk distribution in the header. Defaults to `true`. */
  showRiskSummary?: boolean
  /** Search box + risk/category chips. Defaults to `true`. */
  showFilters?: boolean
  /** Render one collapsible section per course. Defaults to `true`. */
  groupByCourse?: boolean
  /** Whether course sections start expanded. Defaults to `true`. */
  defaultOpen?: boolean
  layout?: CommentListProps['layout']
  /** Props forwarded to every `CommentCard`. */
  commentProps?: CommentListProps['commentProps']
  renderComment?: CommentListProps['renderComment']
  emptyMessage?: string
  className?: string
}

/**
 * Editorial panel for a teacher's comments: a header with the total as a large
 * numeral and the risk distribution as a stacked hairline bar, an optional
 * filter strip (debounced search + risk/category chips), and the comments
 * rendered grouped by course or as a single stream. Receives the data through
 * props, so it works with any source (React Query, a page that already has the
 * payload, tests, Storybook...).
 *
 * @example
 * <CommentsPanel courses={data?.data.courses} isLoading={isPending} />
 *
 * @example
 * <CommentsPanel
 *   courses={courses}
 *   title="Comentarios destacados"
 *   showFilters={false}
 *   groupByCourse={false}
 *   layout="grid"
 *   commentProps={{ variant: 'compact', showCourse: true, clampLines: 3 }}
 * />
 */
export function CommentsPanel({
  courses,
  isLoading = false,
  error = null,
  title = 'Comentarios',
  description,
  headerActions,
  showHeader = true,
  showRiskSummary = true,
  showFilters = true,
  groupByCourse = true,
  defaultOpen = true,
  layout = 'list',
  commentProps,
  renderComment,
  emptyMessage = 'Todavía no hay comentarios registrados para este docente.',
  className,
}: CommentsPanelProps) {
  const {
    search,
    setSearch,
    riskLevelId,
    setRiskLevelId,
    categoryId,
    setCategoryId,
    riskLevels,
    categories,
    filteredCourses,
    totalCount,
    filteredCount,
    isFiltered,
    reset,
  } = useCommentFilters(courses)

  /** Categories arrive as raw `LABEL_n` codes — resolve them for the chips. */
  const categoryOptions = useMemo(
    () =>
      categories.map((option) => ({
        ...option,
        name: categoryLabel(option.name),
        color_hex: categoryColor(option.name, option.color_hex),
      })),
    [categories],
  )

  const flatComments = filteredCourses.flatMap((course) => course.comments)
  const hasData = !isLoading && !error && totalCount > 0

  const listProps: Omit<CommentListProps, 'comments'> = {
    isLoading,
    error,
    layout,
    commentProps,
    renderComment,
    emptyMessage: isFiltered
      ? 'Ningún comentario coincide con los filtros aplicados.'
      : emptyMessage,
  }

  return (
    <section
      className={cn('border-border bg-background overflow-hidden rounded-md border', className)}
    >
      {showHeader && (title || description || headerActions) && (
        <header className="border-border relative flex flex-wrap items-end justify-between gap-x-10 gap-y-6 overflow-hidden border-b px-6 py-5">
          <div className="relative min-w-0">
            {title && (
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {title}
              </h2>
            )}

            <p className="mt-1 flex items-baseline gap-2">
              <span className="num text-2xl leading-none font-bold tracking-tight tabular-nums">
                {isFiltered ? filteredCount : totalCount}
              </span>

              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                {isFiltered ? `de ${totalCount}` : totalCount === 1 ? 'comentario' : 'comentarios'}
              </span>
            </p>

            {description && <p className="text-muted-foreground mt-2 text-xs">{description}</p>}
          </div>

          {showRiskSummary && hasData && riskLevels.length > 0 && (
            <RiskDistribution options={riskLevels} total={totalCount} />
          )}

          {headerActions && <div className="relative ml-auto">{headerActions}</div>}
        </header>
      )}

      {showFilters && hasData && (
        <div className="border-border bg-muted/20 flex flex-col flex-wrap items-center gap-x-6 gap-y-3 border-b px-6 py-3">
          <div className="flex w-full items-center justify-between gap-x-4">
            <div className="focus-within:border-brand-500/70 border-border/80 mb-2 flex max-w-md min-w-56 flex-1 items-center gap-2 border-b pb-1 transition-colors">
              <Search className="text-muted-foreground/70 size-3.5 shrink-0" aria-hidden="true" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar en los comentarios"
                aria-label="Buscar en los comentarios"
                className="placeholder:text-muted-foreground/60 w-full bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
              />
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={reset}
                className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs font-medium tracking-wide uppercase transition-colors"
              >
                <X className="size-3" aria-hidden="true" />
                Limpiar
              </button>
            )}
          </div>

          <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-2">
            <ChipGroup
              label="Riesgo"
              options={riskLevels}
              selectedId={riskLevelId}
              onSelect={setRiskLevelId}
            />

            <ChipGroup
              label="Categoría"
              options={categoryOptions}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          </div>
        </div>
      )}

      <div className="px-6">
        {groupByCourse && !isLoading && !error && flatComments.length > 0 ? (
          <div className="divide-border/70 divide-y">
            {filteredCourses.map((course) => (
              <CourseCommentsGroup
                key={`${course.course_code}-${course.group_name}`}
                course={course}
                defaultOpen={defaultOpen}
                listProps={listProps}
              />
            ))}
          </div>
        ) : (
          <div className="py-2">
            <CommentList comments={flatComments} {...listProps} />
          </div>
        )}
      </div>
    </section>
  )
}

function RiskDistribution({ options, total }: { options: CommentFilterOption[]; total: number }) {
  return (
    <div className="relative min-w-56 flex-1 sm:max-w-xs">
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {options.map((option) => (
          <span
            key={option.id}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(option.count / total) * 100}%`,
              backgroundColor: option.color_hex,
            }}
            title={`${option.name}: ${option.count}`}
          />
        ))}
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {options.map((option) => (
          <li
            key={option.id}
            className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wide uppercase"
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: option.color_hex }}
            />
            {option.name}
            <span className="num text-foreground/70 tabular-nums">{option.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CourseCommentsGroup({
  course,
  defaultOpen,
  listProps,
}: {
  course: TeacherCommentsCourse
  defaultOpen: boolean
  listProps: Omit<CommentListProps, 'comments'>
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-2.5 py-4 text-left">
        <ChevronRight
          aria-hidden="true"
          className="text-muted-foreground/70 size-3.5 shrink-0 transition-transform duration-300 group-data-panel-open:rotate-90"
        />

        <span className="num text-muted-foreground/70 shrink-0 text-xs tracking-wide uppercase">
          {course.course_code}
        </span>

        <span className="group-hover:text-brand-600 truncate text-sm font-medium transition-colors">
          {course.course_name}
        </span>

        <span className="text-muted-foreground/70 shrink-0 text-xs tracking-wide uppercase">
          Grupo {course.group_name}
        </span>

        <span
          aria-hidden="true"
          className="border-border/70 mx-1 hidden flex-1 translate-y-px border-b border-dotted sm:block"
        />

        <span className="num text-muted-foreground ml-auto shrink-0 text-xs tabular-nums sm:ml-0">
          {course.comments.length}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-border/60 mb-4 ml-1.5 border-l pl-5">
          <CommentList comments={course.comments} {...listProps} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ChipGroup({
  label,
  options,
  selectedId,
  onSelect,
}: {
  label: string
  options: CommentFilterOption[]
  selectedId: number | null
  onSelect: (id: number | null) => void
}) {
  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="text-muted-foreground/70 mr-0.5 text-xs tracking-wide uppercase">
        {label}
      </span>

      {options.map((option) => {
        const isSelected = option.id === selectedId

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(isSelected ? null : option.id)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium tracking-wide uppercase transition-all duration-200',
              isSelected ? 'shadow-card' : 'text-muted-foreground hover:text-foreground',
            )}
            style={
              isSelected
                ? {
                    color: option.color_hex,
                    backgroundColor: `color-mix(in srgb, ${option.color_hex} 12%, transparent)`,
                  }
                : undefined
            }
          >
            <span
              aria-hidden="true"
              className={cn('size-1.5 shrink-0 rounded-full transition-opacity', {
                'opacity-40': !isSelected,
              })}
              style={{ backgroundColor: option.color_hex }}
            />

            {option.name}

            <span className="num tabular-nums opacity-60">{option.count}</span>
          </button>
        )
      })}
    </div>
  )
}

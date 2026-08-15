import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AI_STATUS_DISPLAY } from '@/features/evaluations'
import type { TeacherComparisonEntry } from '@/features/stats'
import { CommentsPanel, useGetTeacherComments } from '@/features/teachers'
import { CATEGORIES, categoryColor, categoryShortLabel } from '@/lib/categoryLabel'
import { cn } from '@/lib/utils'
import { comparisonEntryKey } from '../config'

/** Fixed status colors (good/warning/critical) — risk severity is a status job, not a teacher-identity color. */
const RISK_LEVELS = [
  { key: 'BAJO', label: 'Bajo', color: '#0ca30c' },
  { key: 'MEDIO', label: 'Medio', color: '#fab219' },
  { key: 'ALTO', label: 'Alto', color: '#d03b3b' },
] as const

export interface TeacherCommentsComparisonProps {
  entries: TeacherComparisonEntry[]
  colorByKey: Map<string, string>
  /** Scopes each teacher's comments to this materia when a row is expanded. */
  courseCode: string
  className?: string
}

/**
 * One row per teacher: a summary (risk/category distribution as two
 * 100%-stacked bars, with exact counts) always visible for at-a-glance
 * comparison, and an expand action that lazily loads and shows that
 * teacher's actual comments — with the same search/risk/category filters as
 * their own detail page — only once the director opens that row. A teacher
 * whose comments haven't finished AI classification shows the pending
 * notice instead (not expandable — there's nothing classified to browse
 * yet).
 *
 * @example
 * <TeacherCommentsComparison entries={entries} colorByKey={colorByKey} courseCode="1155304" />
 */
export function TeacherCommentsComparison({
  entries,
  colorByKey,
  courseCode,
  className,
}: TeacherCommentsComparisonProps) {
  const orderedEntries = [...entries].sort(
    (a, b) => a.teacher_id - b.teacher_id || a.group_name.localeCompare(b.group_name),
  )

  return (
    <section className={cn('border-border bg-background rounded-md border', className)}>
      <div className="border-border border-b px-5 py-3">
        <h3 className="text-sm font-semibold">Comentarios de estudiantes</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Distribución por nivel de riesgo y categoría pedagógica — despliega un docente para ver
          sus comentarios y filtrarlos.
        </p>
      </div>

      <div className="divide-border divide-y">
        {orderedEntries.map((entry) => (
          <TeacherCommentsRow
            key={comparisonEntryKey(entry)}
            entry={entry}
            color={colorByKey.get(comparisonEntryKey(entry))}
            courseCode={courseCode}
          />
        ))}
      </div>
    </section>
  )
}

function TeacherCommentsRow({
  entry,
  color,
  courseCode,
}: {
  entry: TeacherComparisonEntry
  color: string | undefined
  courseCode: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pending = entry.ai_status !== 'ANALYZED'
  const statusConfig = AI_STATUS_DISPLAY[entry.ai_status]

  const riskSegments = RISK_LEVELS.map((level) => ({
    key: level.key,
    label: level.label,
    color: level.color,
    count: entry.comments_risk_counts[level.key],
  }))

  const categorySegments = CATEGORIES.map((category) => ({
    key: category.code,
    label: categoryShortLabel(category.code),
    color: categoryColor(category.code),
    count: entry.comments_pedagogical_category_counts[category.code] ?? 0,
  }))

  const totalComments = riskSegments.reduce((sum, segment) => sum + segment.count, 0)

  // Only fetched once the row is actually expanded — passing `undefined` keeps the query disabled.
  const {
    data,
    isPending: isCommentsLoading,
    error,
  } = useGetTeacherComments({
    evaluationId: isOpen ? entry.evaluation_id : undefined,
    teacherId: isOpen ? entry.teacher_id : undefined,
  })

  const courseComments = data?.data.courses.filter(
    (course) => course.course_code === courseCode && course.group_name === entry.group_name,
  )

  const summary = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-muted-foreground mb-1.5 text-xs">Nivel de riesgo</p>
        <StackedBar segments={riskSegments} />
        <StackedBarLegend segments={riskSegments} />
      </div>

      <div>
        <p className="text-muted-foreground mb-1.5 text-xs">Categoría pedagógica</p>
        <StackedBar segments={categorySegments} />
        <StackedBarLegend segments={categorySegments} />
      </div>
    </div>
  )

  if (pending) {
    return (
      <div className="space-y-3 px-5 py-4">
        <RowHeader entry={entry} color={color} />

        <div className="border-border bg-muted/30 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs">
          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
          <span className="text-muted-foreground">
            La clasificación de estos comentarios aparecerá cuando el análisis con IA termine.
          </span>
        </div>
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-3 px-5 py-4">
        <CollapsibleTrigger className="group flex w-full items-start justify-between gap-3 text-left">
          <RowHeader entry={entry} color={color} totalComments={totalComments} />

          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground mt-0.5 size-3.5 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />
        </CollapsibleTrigger>

        {summary}
      </div>

      <CollapsibleContent>
        <div className="border-border border-t px-5 py-4">
          <CommentsPanel
            courses={courseComments}
            isLoading={isCommentsLoading}
            error={error ? error.message : null}
            showHeader={false}
            groupByCourse={false}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function RowHeader({
  entry,
  color,
  totalComments,
}: {
  entry: TeacherComparisonEntry
  color: string | undefined
  totalComments?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium">{entry.teacher_name}</span>

      {totalComments != null && (
        <span className="text-muted-foreground text-xs">
          · {totalComments} comentario{totalComments === 1 ? '' : 's'}
        </span>
      )}
    </div>
  )
}

function StackedBarLegend({
  segments,
}: {
  segments: { key: string; label: string; color: string; count: number }[]
}) {
  const visible = segments.filter((segment) => segment.count > 0)

  if (visible.length === 0) {
    return <p className="text-muted-foreground mt-1 text-xs">Sin comentarios</p>
  }

  return (
    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
      {visible.map((segment) => (
        <span key={segment.key} className="text-muted-foreground flex items-center gap-1 text-xs">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: segment.color }}
          />
          {segment.label}: {segment.count}
        </span>
      ))}
    </div>
  )
}

function StackedBar({
  segments,
}: {
  segments: { key: string; label: string; color: string; count: number }[]
}) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)

  if (total === 0) {
    return <div className="bg-muted h-3 w-full rounded-full" />
  }

  return (
    <div
      className="flex h-3 w-full gap-0.5"
      role="img"
      aria-label={segments
        .filter((segment) => segment.count > 0)
        .map((segment) => `${segment.label}: ${segment.count}`)
        .join(', ')}
    >
      {segments
        .filter((segment) => segment.count > 0)
        .map((segment) => (
          <div
            key={segment.key}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(segment.count / total) * 100}%`, backgroundColor: segment.color }}
          />
        ))}
    </div>
  )
}

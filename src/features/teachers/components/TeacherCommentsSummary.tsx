import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { CountBarChart } from '@/components/common/CountBarChart'
import { CountPieChart } from '@/components/common/CountPieChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/features/auth'
import { AI_STATUS_DISPLAY, type AiStatus } from '@/features/evaluations'
import { CATEGORIES, categoryColor, categoryLabel, UNCATEGORIZED } from '@/lib/categoryLabel'
import { cn } from '@/lib/utils'
import { RISK_LEVELS } from '@/lib/riskLevel'
import { useGetTeacherComments } from '../api'
import type { TeacherComment } from '../types'
import { CommentCard } from './CommentCard'

/** Excludes "Sin categoría" — a non-classification, not useful for analysis. */
const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

type ViewMode = 'pie' | 'bar'

/** Risk/category counts for one set of comments — shared by the current and comparison periods. */
function aggregateComments(comments: TeacherComment[]) {
  const riskCounts = comments.reduce(
    (counts, comment) => {
      const key = comment.risk_level?.name.toUpperCase()
      if (key === 'BAJO' || key === 'MEDIO' || key === 'ALTO') counts[key] += 1
      return counts
    },
    { BAJO: 0, MEDIO: 0, ALTO: 0 },
  )

  const categoryCounts = comments.reduce<Record<string, number>>((counts, comment) => {
    for (const category of comment.pedagogical_categories) {
      counts[category.name] = (counts[category.name] ?? 0) + 1
    }
    return counts
  }, {})

  return { riskCounts, categoryCounts }
}

export interface TeacherCommentsSummaryProps {
  /** Evaluation the comments belong to. The query stays idle until it is set. */
  evaluationId?: number
  /** Immediately preceding evaluated period, if any — enables the delta indicator in each chart's legend. */
  previousEvaluationId?: number
  /** Teacher whose comments are summarized. Defaults to the authenticated teacher. */
  teacherId?: number
  title?: ReactNode
  className?: string
}

/**
 * Aggregate view of a teacher's own comments for one period: how many were
 * classified at each risk level and under each pedagogical category, drawn
 * as a donut (`CountPieChart`) or a 100%-stacked bar (`CountBarChart`) —
 * toggle in the header switches both at once, same pattern as the list/chart
 * toggle in `TeacherDimensionComparison`. Controlled by `evaluationId` — the
 * period picker lives one level up (`TeacherPeriodInsights`), shared with the
 * question matrix.
 *
 * @example
 * <TeacherCommentsSummary evaluationId={5} teacherId={12} />
 */
export function TeacherCommentsSummary({
  evaluationId,
  previousEvaluationId,
  teacherId,
  title = 'Resumen de comentarios',
  className,
}: TeacherCommentsSummaryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('pie')
  const authTeacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined
  const effectiveTeacherId = teacherId ?? authTeacherId

  const { data, isPending } = useGetTeacherComments({
    evaluationId,
    teacherId: effectiveTeacherId,
  })
  const { data: previousData } = useGetTeacherComments({
    evaluationId: previousEvaluationId,
    teacherId: effectiveTeacherId,
  })

  const isIdle = evaluationId == null || effectiveTeacherId == null

  if (isIdle) return null

  const commentsData = data?.data
  const comments: TeacherComment[] =
    commentsData?.courses.flatMap((course) => course.comments) ?? []
  const previousComments: TeacherComment[] =
    previousData?.data.courses.flatMap((course) => course.comments) ?? []

  const { riskCounts, categoryCounts } = aggregateComments(comments)
  const previousCounts =
    previousEvaluationId != null ? aggregateComments(previousComments) : undefined

  const riskEntries = RISK_LEVELS.map((level) => ({
    key: level.key,
    label: level.name,
    value: riskCounts[level.key],
    color: level.color,
    previousValue: previousCounts?.riskCounts[level.key],
  }))

  const categoryEntries = ANALYZABLE_CATEGORIES.map((category) => ({
    key: category.code,
    label: categoryLabel(category.code),
    value: categoryCounts[category.code] ?? 0,
    color: categoryColor(category.code),
    previousValue:
      previousCounts?.categoryCounts[category.code] ?? (previousCounts ? 0 : undefined),
  }))

  const topComment = comments.reduce<TeacherComment | undefined>((max, comment) => {
    if (comment.risk_score == null) return max
    if (!max || max.risk_score == null || comment.risk_score > max.risk_score) return comment
    return max
  }, undefined)

  const aiStatus: AiStatus | null | undefined = commentsData?.ai_status
  const aiStatusConfig = aiStatus ? AI_STATUS_DISPLAY[aiStatus] : undefined
  const showAiPendingNotice = aiStatus === 'PENDING' || aiStatus === 'ANALYZING'

  return (
    <section className={cn('border-border bg-background rounded-md border', className)}>
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        {title && <h2 className="text-sm font-medium">{title}</h2>}

        <div
          role="group"
          aria-label="Forma de ver el resumen"
          className="border-border inline-flex shrink-0 gap-0.5 rounded-md border p-0.5"
        >
          <Button
            type="button"
            variant={viewMode === 'pie' ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={viewMode === 'pie'}
            onClick={() => setViewMode('pie')}
          >
            <PieChartIcon className="size-3.5" aria-hidden="true" />
            Dona
          </Button>

          <Button
            type="button"
            variant={viewMode === 'bar' ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={viewMode === 'bar'}
            onClick={() => setViewMode('bar')}
          >
            <BarChart3 className="size-3.5" aria-hidden="true" />
            Barra
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-4">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
          <div className="px-6 py-4">
            <Skeleton className="mb-3 h-3 w-32" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </div>
      ) : showAiPendingNotice && aiStatusConfig ? (
        <div className="flex flex-wrap items-center gap-2 px-6 py-4 text-sm">
          <Badge className={aiStatusConfig.className}>{aiStatusConfig.label}</Badge>
          <span className="text-muted-foreground">
            El resumen por riesgo y categoría aparecerá cuando el análisis con IA termine.
          </span>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground px-6 py-6 text-center text-sm">
          Todavía no hay comentarios registrados para este periodo.
        </p>
      ) : (
        <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-4">
            <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Por nivel de riesgo
            </h3>

            {viewMode === 'pie' ? (
              <CountPieChart
                entries={riskEntries}
                emptyMessage="No hay comentarios clasificados por nivel de riesgo en este periodo."
              />
            ) : (
              <CountBarChart
                entries={riskEntries}
                emptyMessage="No hay comentarios clasificados por nivel de riesgo en este periodo."
              />
            )}
          </div>

          <div className="px-6 py-4">
            <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Por categoría pedagógica
            </h3>

            {viewMode === 'pie' ? (
              <CountPieChart
                entries={categoryEntries}
                emptyMessage="No hay comentarios clasificados por categoría en este periodo."
              />
            ) : (
              <CountBarChart
                entries={categoryEntries}
                emptyMessage="No hay comentarios clasificados por categoría en este periodo."
              />
            )}
          </div>
        </div>
      )}

      {topComment && !showAiPendingNotice && (
        <div className="border-border border-t px-6 py-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Requiere más atención
          </h3>

          <CommentCard comment={topComment} showCourse clampLines={3} />
        </div>
      )}
    </section>
  )
}

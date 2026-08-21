import { AlertTriangle, Check, ChevronRight, CircleCheck, HelpCircle, Plus, X } from 'lucide-react'

import { DimensionDot } from '@/components/common/DimensionDot'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import {
  SelectLoadingLabel,
  selectLoadingTriggerClass,
} from '@/components/common/SelectLoadingLabel'
import { IndicatorMatrixSkeleton } from '@/components/skeletons/IndicatorMatrixSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
// From the sub-barrels, not `@/features/teachers`: the teachers feature imports
// `@/features/plans` for `TeacherPlanAction`, so the root barrel would close an
// import cycle between the two features.
import { CommentCard } from '@/features/teachers/components'
import type { TeacherComment } from '@/features/teachers/types'
import { getScoreToneClass } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'
import { type GroupedComments, visibleComments } from '../lib/commentGroups'
import { SUBJECT_ALL } from '../lib/indicatorMatrix'
import {
  commentSelectionId,
  indicatorPickOf,
  indicatorSelectionId,
  questionPickOf,
  type IndicatorPick,
} from '../lib/planDraft'
import type { IndicatorDimension, IndicatorQuestion, PlanSubjectOption } from '../types'

interface IndicatorPickerProps {
  /** Matrix of the teacher, or of the subject in the filter. */
  dimensions: IndicatorDimension[]
  /** Institutional threshold under which an indicator counts as weak. */
  threshold: number
  /** Student comments grouped by the dimension they talk about. */
  comments: GroupedComments
  /** `selection_id` of everything already in the draft, indicators and comments. */
  selectedIds: Set<string>
  onToggleIndicator: (pick: IndicatorPick) => void
  onToggleComment: (comment: TeacherComment) => void
  /** Maps a dimension name to its aspect number (1-4). */
  aspectByDimension: Record<string, number>
  onlyWeak: boolean
  onOnlyWeakChange: (value: boolean) => void
  subjectOptions: PlanSubjectOption[]
  subjectKey: string
  onSubjectChange: (value: string) => void
  /**
   * Whether the subjects, the scores and the comments of the teacher are still
   * being fetched. Half-loaded, the matrix looks exactly like a teacher with
   * nothing below the threshold, so the picker waits before saying so.
   */
  isLoading?: boolean
  weakCount: number
  riskyCount: number
  /** Analysis state of the comments; they are only shown once `ANALYZED`. */
  aiStatus: string | null
}

/**
 * Indicator matrix of a teacher, grouped by the four evaluation dimensions and
 * followed, in each one, by the student comments the AI classified into it.
 *
 * Everything is listed — the director decides what justifies a plan — but with
 * "solo indicadores bajos" on, only what is below the institutional threshold
 * or commented with medium/high risk survives the filter.
 *
 * @example
 * <IndicatorPicker dimensions={dimensions} threshold={3.5} comments={comments}
 *   selectedIds={ids} onToggleIndicator={toggle} onToggleComment={toggleComment} />
 */
export function IndicatorPicker({
  dimensions,
  threshold,
  comments,
  selectedIds,
  onToggleIndicator,
  onToggleComment,
  aspectByDimension,
  onlyWeak,
  onOnlyWeakChange,
  subjectOptions,
  subjectKey,
  onSubjectChange,
  isLoading = false,
  weakCount,
  riskyCount,
  aiStatus,
}: IndicatorPickerProps) {
  const subjectLabel =
    subjectOptions.find((option) => option.key === subjectKey)?.label ??
    'General · todas las asignaturas'

  const uncategorized = visibleComments(comments.uncategorized, onlyWeak)

  // With the filter on, a dimension survives when its own score is low, when it
  // has questions below the threshold, or when its students commented on it
  // with medium/high risk — nothing else is worth showing.
  const blocks = dimensions
    .map((dimension) => ({
      dimension,
      questions: onlyWeak
        ? dimension.questions.filter((question) => question.below_threshold)
        : dimension.questions,
      comments: visibleComments(comments.byDimension[dimension.dimension], onlyWeak),
    }))
    .filter(
      (block) =>
        !onlyWeak ||
        block.dimension.below_threshold ||
        block.questions.length > 0 ||
        block.comments.length > 0,
    )

  const isEmpty = blocks.length === 0 && uncategorized.length === 0

  return (
    <div className="space-y-4">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" aria-hidden="true" />
          {isLoading ? (
            <Skeleton className="h-3.5 w-56" />
          ) : (
            <p className="text-sm">
              <span className="num font-semibold">{weakCount}</span>{' '}
              {weakCount === 1 ? 'indicador' : 'indicadores'} por debajo de{' '}
              <span className="num font-semibold">{threshold.toFixed(1)}</span>
              {riskyCount > 0 && (
                <>
                  {' · '}
                  <span className="num font-semibold">{riskyCount}</span>{' '}
                  {riskyCount === 1 ? 'comentario' : 'comentarios'} en riesgo
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={subjectKey}
            onValueChange={(value) => onSubjectChange(value as string)}
            disabled={isLoading || subjectOptions.length === 0}
          >
            <SelectTrigger
              size="sm"
              aria-label="Asignatura"
              aria-busy={isLoading}
              className={cn('w-64', isLoading && selectLoadingTriggerClass)}
            >
              {isLoading ? (
                <SelectLoadingLabel>Cargando asignaturas…</SelectLoadingLabel>
              ) : (
                <SelectValue>{subjectLabel}</SelectValue>
              )}
            </SelectTrigger>

            <SelectContent className="w-auto">
              <SelectItem value={SUBJECT_ALL}>General · todas las asignaturas</SelectItem>
              {subjectOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch id="only-weak" checked={onlyWeak} onCheckedChange={onOnlyWeakChange} />
            <Label htmlFor="only-weak" className="text-muted-foreground cursor-pointer font-normal">
              Solo indicadores bajos
            </Label>
            <WeakFilterHelp threshold={threshold} />
          </div>
        </div>
      </div>

      {aiStatus != null && aiStatus !== 'ANALYZED' && (
        <p className="text-muted-foreground border-border rounded-md border border-dashed px-3 py-2 text-sm">
          {aiStatus === 'FAILED'
            ? 'No fue posible analizar los comentarios de los estudiantes de este periodo.'
            : 'Los comentarios de los estudiantes aún se están analizando; vuelve más tarde para citarlos.'}
        </p>
      )}

      {isLoading ? (
        <div role="status" aria-busy="true">
          <span className="sr-only">Cargando los indicadores y comentarios del docente…</span>
          <IndicatorMatrixSkeleton />
        </div>
      ) : (
        <>
          {isEmpty && onlyWeak && (
            <div className="border-border flex flex-col items-center gap-3 rounded-md border border-dashed px-6 py-8 text-center">
              <CircleCheck className="size-8 text-emerald-500" aria-hidden="true" />

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {subjectKey === SUBJECT_ALL
                    ? 'Este docente no tiene calificaciones bajas'
                    : `Esta asignatura no tiene calificaciones bajas`}
                </p>
                <p className="text-muted-foreground mx-auto max-w-lg text-sm">
                  Ningún indicador quedó por debajo de{' '}
                  <span className="num">{threshold.toFixed(1)}</span> y no hay comentarios en
                  riesgo. Desactiva «Solo indicadores bajos» para ver todas las calificaciones y
                  elegir sobre cuáles construir el plan.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onOnlyWeakChange(false)}
              >
                Mostrar todas las calificaciones
              </Button>
            </div>
          )}

          {isEmpty && !onlyWeak && (
            <p className="text-muted-foreground border-border rounded-md border border-dashed px-3 py-4 text-sm">
              No hay calificaciones registradas para mostrar.
            </p>
          )}

          {blocks.map((block) => (
            <DimensionBlock
              key={block.dimension.target_ref}
              dimension={block.dimension}
              questions={block.questions}
              comments={block.comments}
              selectedIds={selectedIds}
              onToggleIndicator={onToggleIndicator}
              onToggleComment={onToggleComment}
              aspect={aspectByDimension[block.dimension.dimension] ?? null}
              subjectKey={subjectKey}
              showCourse={subjectKey === SUBJECT_ALL}
            />
          ))}

          {uncategorized.length > 0 && (
            <Collapsible className="border-border rounded-md border border-dashed">
              <CollapsibleTrigger className="group bg-muted/50 flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left">
                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
                  aria-hidden="true"
                />
                <DimensionDot />
                <span className="text-sm font-medium">Sin categoría</span>
                <span className="text-muted-foreground num text-xs">
                  {uncategorized.length} comentario{uncategorized.length === 1 ? '' : 's'}
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <p className="text-muted-foreground border-border border-t px-4 py-2 pl-10 text-xs">
                  Comentarios que el análisis no pudo ubicar en ninguna de las cuatro dimensiones.
                </p>

                <ul className="divide-border divide-y">
                  {uncategorized.map((comment) => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      picked={selectedIds.has(commentSelectionId(comment.id))}
                      onToggle={onToggleComment}
                      showCourse={subjectKey === SUBJECT_ALL}
                    />
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </div>
  )
}

/** Explains what the "solo indicadores bajos" filter actually keeps. */
function WeakFilterHelp({ threshold }: { threshold: number }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Qué se considera un indicador bajo"
            className="text-muted-foreground/70 hover:text-foreground hover:bg-muted inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
          />
        }
      >
        <HelpCircle className="size-3.5" aria-hidden="true" />
      </TooltipTrigger>

      <TooltipContent className="max-w-72">
        <span className="block">
          <strong>Indicador bajo:</strong> promedio por debajo del umbral institucional (
          <span className="num">{threshold.toFixed(1)}</span>).
        </span>
        <span className="mt-1 block">
          <strong>Comentario en riesgo:</strong> clasificado con riesgo medio o alto. Si una
          dimensión no tiene notas bajas pero sí comentarios en riesgo, se muestra igualmente con
          sus comentarios.
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

function DimensionBlock({
  dimension,
  questions,
  comments,
  selectedIds,
  onToggleIndicator,
  onToggleComment,
  aspect,
  subjectKey,
  showCourse,
}: {
  dimension: IndicatorDimension
  /** Already narrowed by the filter, so the block only lays them out. */
  questions: IndicatorQuestion[]
  comments: TeacherComment[]
  selectedIds: Set<string>
  onToggleIndicator: (pick: IndicatorPick) => void
  onToggleComment: (comment: TeacherComment) => void
  aspect: number | null
  subjectKey: string
  showCourse: boolean
}) {
  const scope = subjectKey === SUBJECT_ALL ? null : subjectKey

  return (
    <Collapsible className="border-border rounded-md border">
      <div className="bg-muted/50 flex items-center justify-between gap-3 px-4 py-3">
        <CollapsibleTrigger className="group flex flex-1 cursor-pointer items-center gap-2 text-left">
          <ChevronRight
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
            aria-hidden="true"
          />
          <DimensionDot dimension={dimension.dimension} />
          <span className="text-sm font-medium">{dimension.dimension}</span>
          {dimension.below_threshold && (
            <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Bajo
            </Badge>
          )}
        </CollapsibleTrigger>

        <div className="flex items-center gap-3">
          <ScoreBadge value={dimension.average ?? undefined} />
          <PickButton
            picked={selectedIds.has(indicatorSelectionId(scope, 'DIMENSION', dimension.target_ref))}
            onClick={() => onToggleIndicator(indicatorPickOf(dimension, aspect))}
          />
        </div>
      </div>

      <CollapsibleContent>
        <ul className="divide-border border-border bg-background divide-y border-t">
          {questions.map((question) => {
            const picked = selectedIds.has(
              indicatorSelectionId(scope, 'QUESTION', question.target_ref),
            )

            return (
              <li
                key={question.target_ref}
                className="flex items-center justify-between gap-3 px-4 py-2.5 pl-10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    <span className="text-muted-foreground num mr-1.5">{question.code}</span>
                    {question.text}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      'num text-sm font-semibold',
                      question.average != null
                        ? getScoreToneClass(question.average)
                        : 'text-muted-foreground',
                    )}
                  >
                    {question.average != null ? question.average.toFixed(2) : '—'}
                  </span>
                  <PickButton
                    picked={picked}
                    onClick={() => onToggleIndicator(questionPickOf(question, aspect))}
                  />
                </div>
              </li>
            )
          })}

          {questions.length === 0 && comments.length === 0 && (
            <li className="text-muted-foreground px-4 py-2.5 pl-10 text-sm">
              Sin preguntas por debajo del umbral.
            </li>
          )}

          {comments.length > 0 && (
            <li className="text-muted-foreground px-4 py-1.5 pl-10 text-xs tracking-wide uppercase">
              Comentarios de estudiantes <span className="num">({comments.length})</span>
            </li>
          )}

          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              picked={selectedIds.has(commentSelectionId(comment.id))}
              onToggle={onToggleComment}
              showCourse={showCourse}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** One student comment, laid out like the question rows above it. */
function CommentRow({
  comment,
  picked,
  onToggle,
  showCourse,
}: {
  comment: TeacherComment
  picked: boolean
  onToggle: (comment: TeacherComment) => void
  showCourse: boolean
}) {
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-1 pl-10">
      {/* Clicking the quote opens `CommentDetailDrawer`, same as in
          /comentarios: the text is clamped to three lines here, and a director
          deciding whether a comment justifies a commitment has to be able to
          read the whole thing. It doesn't compete with «Agregar», which sits
          outside the card — and the card's own handler ignores clicks that
          land on a button anyway. */}
      <CommentCard
        comment={comment}
        showGutter={false}
        showCourse={showCourse}
        showScores={false}
        clampLines={3}
        className="min-w-0 flex-1"
      />

      <div className="mt-3 shrink-0">
        <PickButton picked={picked} onClick={() => onToggle(comment)} />
      </div>
    </li>
  )
}

/** Adds the indicator or comment to the plan, and takes it back out. */
function PickButton({ picked, onClick }: { picked: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={picked ? 'secondary' : 'outline'}
      onClick={onClick}
      aria-pressed={picked}
      title={picked ? 'Quitar del plan' : 'Agregar al plan'}
      className="group/pick"
    >
      {picked ? (
        <>
          <Check className="size-3.5 group-hover/pick:hidden" aria-hidden="true" />
          <X className="hidden size-3.5 group-hover/pick:block" aria-hidden="true" />
          <span className="group-hover/pick:hidden">Agregado</span>
          <span className="hidden group-hover/pick:inline">Quitar</span>
        </>
      ) : (
        <>
          <Plus className="size-3.5" aria-hidden="true" />
          Agregar
        </>
      )}
    </Button>
  )
}

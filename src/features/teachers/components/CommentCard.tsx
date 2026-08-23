import { cn } from '@/lib/utils'
import { Maximize2, Pencil } from 'lucide-react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { useState } from 'react'
import { useSearchParams } from 'wouter'

import { PercentMeter } from '@/components/common/PercentMeter'
import { TransitionLink } from '@/components/common/TransitionLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/features/auth'
import type { TeacherComment } from '../types'
import { CategoryTag } from './CategoryTag'
import { COMMENT_ACTION_TRIGGER } from './commentActionStyles'
import { CommentAnalysisInfo } from './CommentAnalysisInfo'
import { CommentClassificationEditor } from './CommentClassificationEditor'
import { CommentDetailDrawer } from './CommentDetailDrawer'

/** Layout density of a `CommentCard`. */
export type CommentCardVariant = 'default' | 'compact'

export interface CommentCardProps {
  comment: TeacherComment
  /** `default` is the roomy editorial entry, `compact` a dense one-liner for sidebars. */
  variant?: CommentCardVariant
  /** Position in the list; rendered as a gutter numeral (`01`, `02`...). */
  index?: number
  /** Show the risk level. Defaults to `true`. */
  showRisk?: boolean
  /** Show the pedagogical category. Defaults to `true`. */
  showCategory?: boolean
  /** Show the risk / category percentages next to their labels. Defaults to `true`. */
  showScores?: boolean
  /** Show the course/group line. Defaults to `false` (lists usually group by course). */
  showCourse?: boolean
  /** Show the teacher's avatar and name. Defaults to `false`. */
  showTeacher?: boolean
  /** Show the gutter numeral + risk rail. Defaults to `true` on `default`. */
  showGutter?: boolean
  /** Clamp the comment body to N lines; `0` disables clamping. Defaults to `0`. */
  clampLines?: 0 | 2 | 3 | 4
  /**
   * Make the card open `CommentDetailDrawer` on click. Defaults to `true`;
   * turn it off where the card already sits inside its own interactive row
   * (a picker, a selectable list) and a second click target would compete.
   */
  showDetail?: boolean
  /** Slot rendered at the end of the meta line (buttons, menus...). */
  actions?: ReactNode
  className?: string
  style?: CSSProperties
}

const CLAMP_CLASS: Record<number, string> = {
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
}

/**
 * A single student comment set as an editorial entry: a gutter numeral and a
 * risk-colored rail on the left, the verbatim text as a pull quote, and a
 * hairline meta line with risk, category and date. Receives the comment
 * through props and never fetches — except for the director-only
 * classification editor, a popover that corrects the risk level and
 * pedagogical category through `useUpdateComment` (`PATCH /comments/{id}`),
 * shown only when the active role is `DIRECTOR DE DEPARTAMENTO`. An info
 * button in the meta line opens `CommentAnalysisInfo` with this comment's
 * provenance (models, analysis date, director edits), and the card itself
 * opens `CommentDetailDrawer` on click (see `showDetail`).
 *
 * @example
 * <CommentCard comment={comment} index={0} />
 *
 * @example
 * <CommentCard comment={comment} variant="compact" showCourse clampLines={3} />
 */
export function CommentCard({
  comment,
  variant = 'default',
  index,
  showRisk = true,
  showCategory = true,
  showScores = true,
  showCourse = false,
  showTeacher = false,
  showGutter,
  clampLines = 0,
  showDetail = true,
  actions,
  className,
  style,
}: CommentCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const isDirector = useAuthStore((state) => state.selectedRole) === 'DIRECTOR DE DEPARTAMENTO'
  const isCompact = variant === 'compact'
  const accent = comment.risk_level?.color_hex
  const withGutter = showGutter ?? !isCompact

  /**
   * Opens the detail drawer for plain clicks on the card's own surface only.
   *
   * The first guard is the load-bearing one: React bubbles events through the
   * component tree, not the DOM tree, so clicks inside the drawer and the
   * popovers this card renders — all portalled to `document.body` — still
   * arrive here. Without it, dismissing the drawer by clicking its backdrop
   * closed it and this handler reopened it in the same click.
   *
   * The rest: a click that landed on a nested link/control belongs to that
   * control, and a click that ends a text selection is the user copying the
   * quote, not asking for the drawer.
   */
  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (!showDetail) return

    const target = event.target as HTMLElement

    if (!event.currentTarget.contains(target)) return
    if (target.closest('a, button, input, label')) return
    if (window.getSelection()?.toString()) return

    setDetailOpen(true)
  }

  const [searchParams] = useSearchParams()
  const period = searchParams.get('period')
  const teacherHref = `/docentes/${comment.teacher_id}${period ? `?period=${encodeURIComponent(period)}` : ''}`

  return (
    <article
      className={cn(
        'group relative grid cursor-pointer gap-x-4 transition-colors duration-300',
        withGutter ? 'grid-cols-[1.5rem_1fr]' : 'grid-cols-1',
        isCompact ? 'py-3' : 'py-5',
        showDetail && 'hover:bg-muted/30',
        className,
      )}
      style={style}
      id={comment.id.toString()}
      onClick={showDetail ? handleCardClick : undefined}
    >
      {withGutter && (
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full"
            style={accent ? { backgroundColor: accent } : undefined}
          />

          <span
            aria-hidden="true"
            className="bg-border w-px flex-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={
              accent
                ? { backgroundColor: `color-mix(in srgb, ${accent} 45%, transparent)` }
                : undefined
            }
          />

          {index != null && (
            <span className="num text-muted-foreground/50 text-xs leading-none">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
        </div>
      )}

      <div className="min-w-0">
        {(showTeacher || showCourse) && (
          <header className="mb-2 flex items-center gap-2">
            {showTeacher && (
              <TransitionLink href={teacherHref}>
                <Avatar size="lg">
                  <AvatarFallback>{comment.teacher_name?.at(0)}</AvatarFallback>

                  <AvatarImage
                    src={comment.teacher_avatar_url}
                    alt={`Foto de ${comment.teacher_name}`}
                  />
                </Avatar>
              </TransitionLink>
            )}

            <div className="min-w-0">
              {showTeacher && (
                <TransitionLink href={teacherHref} className="hover:underline">
                  <p className="truncate text-sm font-medium">{comment.teacher_name}</p>
                </TransitionLink>
              )}

              {showCourse && (
                <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
                  {comment.course_name} · Grupo {comment.group_name}
                </p>
              )}
            </div>
          </header>
        )}

        <blockquote
          className={cn(
            'text-foreground/90 whitespace-pre-line',
            isCompact ? 'text-sm leading-relaxed' : 'text-base leading-relaxed text-pretty',
            clampLines ? CLAMP_CLASS[clampLines] : undefined,
          )}
        >
          {comment.original_text}
        </blockquote>

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-medium tracking-wide uppercase">
          {showRisk && comment.risk_level && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 opacity-80"
              style={
                accent
                  ? {
                      color: `color-mix(in srgb, ${accent} 60%, var(--color-foreground))`,
                      backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                    }
                  : undefined
              }
            >
              {comment.risk_level.name}

              {showScores && (
                <PercentMeter
                  value={comment.risk_score}
                  label={`Probabilidad de acierto del nivel de riesgo ${comment.risk_level.name}`}
                  showBar={false}
                />
              )}

              {comment.risk_level_modified_by_director && (
                <ModifiedMark label="Nivel de riesgo editado por el director" />
              )}
            </span>
          )}

          {showCategory && comment.pedagogical_categories.length > 0 && (
            <>
              {showRisk && <Divider />}

              {comment.pedagogical_categories.map((category) => (
                <CategoryTag
                  key={category.id}
                  category={category}
                  variant="soft"
                  short={isCompact}
                  showDot={false}
                  score={showScores ? category.score : undefined}
                  showScoreBar={false}
                  className="opacity-80"
                />
              ))}

              {comment.pedagogical_category_modified_by_director && (
                <ModifiedMark label="Categoría editada por el director" />
              )}
            </>
          )}

          <div className="ml-auto flex items-center gap-1">
            {showDetail && (
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                aria-label="Ver detalle del comentario"
                className={COMMENT_ACTION_TRIGGER}
              >
                <Maximize2 className="size-3.5" aria-hidden="true" />
              </button>
            )}

            <CommentAnalysisInfo comment={comment} />

            {isDirector && <CommentClassificationEditor comment={comment} />}

            {actions}
          </div>
        </div>
      </div>

      {/* Mounted while `showDetail`, not while open: Base UI needs the root to
          exist before and after the transition to animate the panel in and
          back out. Its portal renders nothing until opened, so a long list of
          closed cards costs no DOM. */}
      {showDetail && (
        <CommentDetailDrawer comment={comment} open={detailOpen} onOpenChange={setDetailOpen} />
      )}
    </article>
  )
}

function Divider() {
  return <span aria-hidden="true" className="bg-border h-5 w-0.5 shrink-0 rounded-full" />
}

function ModifiedMark({ label }: { label: string }) {
  return (
    <span
      title={label}
      className="text-muted-foreground inline-flex items-center gap-1 px-1.5 py-0.5 text-[0.65rem] font-medium tracking-normal normal-case"
    >
      <Pencil aria-hidden="true" className="size-2.5" />
      Editado
    </span>
  )
}

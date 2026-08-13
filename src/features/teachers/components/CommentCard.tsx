import type { ReactNode } from 'react'
import { useSearchParams } from 'wouter'

import { PercentMeter } from '@/components/common/PercentMeter'
import { TransitionLink } from '@/components/common/TransitionLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'
import type { TeacherComment } from '../types'
import { CategoryTag } from './CategoryTag'
import { CommentClassificationEditor } from './CommentClassificationEditor'

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
  /** Slot rendered at the end of the meta line (buttons, menus...). */
  actions?: ReactNode
  className?: string
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
 * shown only when the active role is `DIRECTOR DE DEPARTAMENTO`.
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
  actions,
  className,
}: CommentCardProps) {
  const isDirector = useAuthStore((state) => state.selectedRole) === 'DIRECTOR DE DEPARTAMENTO'
  const isCompact = variant === 'compact'
  const accent = comment.risk_level?.color_hex
  const withGutter = showGutter ?? !isCompact

  const [searchParams] = useSearchParams()
  const period = searchParams.get('period')
  const teacherHref = `/docentes/${comment.teacher_id}${period ? `?period=${encodeURIComponent(period)}` : ''}`

  return (
    <article
      className={cn(
        'group hover:bg-muted/30 relative grid gap-x-4 transition-colors duration-300',
        withGutter ? 'grid-cols-[1.5rem_1fr]' : 'grid-cols-1',
        isCompact ? 'py-3' : 'py-5',
        className,
      )}
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

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium tracking-wide uppercase">
          {showRisk && comment.risk_level && (
            <span
              className="inline-flex items-center gap-1.5"
              style={accent ? { color: accent } : undefined}
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
                  short={isCompact}
                  showDot={false}
                  score={showScores ? category.score : undefined}
                  showScoreBar={false}
                />
              ))}

              {comment.pedagogical_category_modified_by_director && (
                <ModifiedMark label="Categoría editada por el director" />
              )}
            </>
          )}

          {(actions || isDirector) && (
            <div className="ml-auto flex items-center gap-1">
              {isDirector && <CommentClassificationEditor comment={comment} />}

              {actions}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function Divider() {
  return <span aria-hidden="true" className="bg-border/80 h-3 w-px" />
}

function ModifiedMark({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      title={label}
      className="size-1 shrink-0 rounded-full bg-current opacity-60"
    />
  )
}

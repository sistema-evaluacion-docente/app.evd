import { Info, Pencil, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import formatDate from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import type { TeacherComment } from '../types'
import { COMMENT_ACTION_TRIGGER } from './commentActionStyles'

export interface CommentAnalysisInfoProps {
  comment: TeacherComment
  /** Popover side relative to the trigger. Defaults to `bottom`. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

/**
 * Per-comment provenance popover: which model assigned the risk level and the
 * pedagogical category, when the comment was analyzed, and whether a director
 * has since corrected the classification. Reads everything off the comment it
 * receives and never fetches.
 *
 * Sibling of `CategoryInfo`, which explains the classification scheme in
 * general — this one answers "what happened to *this* comment".
 *
 * @example
 * <CommentAnalysisInfo comment={comment} align="end" />
 */
export function CommentAnalysisInfo({
  comment,
  side = 'bottom',
  align = 'end',
  className,
}: CommentAnalysisInfoProps) {
  const riskEdited = comment.risk_level_modified_by_director === true
  const categoryEdited = comment.pedagogical_category_modified_by_director === true
  const wasEdited = riskEdited || categoryEdited

  const editedWhat =
    riskEdited && categoryEdited
      ? 'Nivel de riesgo y categoría'
      : riskEdited
        ? 'Nivel de riesgo'
        : 'Categoría pedagógica'

  return (
    <Popover>
      <PopoverTrigger
        className={cn(COMMENT_ACTION_TRIGGER, className)}
        aria-label="Detalles del análisis de este comentario"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        className="w-72 gap-0 p-0 tracking-normal normal-case"
        aria-label="Detalles del análisis de este comentario"
      >
        <div className="border-border border-b px-4 py-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Detalles del análisis
          </p>

          <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
            Cómo se clasificó este comentario en particular.
          </p>
        </div>

        <dl className="divide-border/70 divide-y px-4">
          <Row
            icon={<Sparkles aria-hidden="true" className="size-3 shrink-0" />}
            label="Modelo · nivel de riesgo"
            value={comment.risk_level_ai_model}
          />

          <Row
            icon={<Sparkles aria-hidden="true" className="size-3 shrink-0" />}
            label="Modelo · categoría"
            value={comment.pedagogical_category_ai_model}
          />

          <Row label="Analizado" value={formatDate(comment.created_at)} />

          {wasEdited ? (
            <>
              <Row
                icon={<Pencil aria-hidden="true" className="size-3 shrink-0" />}
                label="Editado por el director"
                value={editedWhat}
              />

              <Row label="Última modificación" value={formatDate(comment.updated_at)} />
            </>
          ) : (
            <Row label="Editado por el director" value="No" />
          )}
        </dl>
      </PopoverContent>
    </Popover>
  )
}

function Row({ icon, label, value }: { icon?: ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon}
        {label}
      </dt>

      <dd className="min-w-0 truncate text-right text-xs font-medium">{value || '—'}</dd>
    </div>
  )
}

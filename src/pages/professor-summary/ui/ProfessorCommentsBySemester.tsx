import { Badge } from '@/shared/ui'

import { professorRiskBadge, type PeriodComments } from '../model/data'

export interface ProfessorCommentsBySemesterProps {
  periods: PeriodComments[]
}

/** Student comments of each semester, laid out side by side for comparison. */
export function ProfessorCommentsBySemester({ periods }: ProfessorCommentsBySemesterProps) {
  const withComments = periods.filter((period) => period.comments.length > 0)

  if (withComments.length === 0) {
    return (
      <p className="text-[13.5px] text-ink-500">
        No hay comentarios en los semestres del historial.
      </p>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {withComments.map((period) => (
        <div
          key={period.periodId}
          className="flex w-72 shrink-0 flex-col rounded-lg border border-ink-100 bg-ink-50/40"
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
            <span className="text-[13px] font-semibold text-ink-800">{period.code}</span>
            <span className="num text-[12px] tabular-nums text-ink-500">
              {period.comments.length} comentario
              {period.comments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex max-h-96 flex-col gap-2.5 overflow-y-auto p-3">
            {period.comments.map((comment) => {
              const badge = professorRiskBadge(comment.risk)
              return (
                <div
                  key={comment.id}
                  className="rounded-md border border-ink-100 bg-white p-2.5"
                >
                  <p
                    className="text-[12.5px] leading-relaxed text-ink-700"
                    style={{ textWrap: 'pretty' }}
                  >
                    <span className="text-ink-400">“</span>
                    {comment.text}
                    <span className="text-ink-400">”</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant={badge.variant} className="text-[10px]">
                      {badge.label}
                    </Badge>
                    <span className="truncate text-[10.5px] text-ink-400">
                      {comment.subject}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

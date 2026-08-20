import { Link } from 'wouter'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreLegend } from '@/components/common/ScoreLegend'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { TeacherComparisonEntry } from '@/features/stats'
import { courseTeacherHref } from '@/features/teachers'
import { comparisonEntryKey } from '../config'

export interface TeacherComparisonRankingProps {
  entries: TeacherComparisonEntry[]
  colorByKey: Map<string, string>
  courseCode: string
  period: string
  className?: string
}

/**
 * Ranked list of every teacher who taught a subject in a period, sorted by
 * overall average — highest first, `null` averages last. Each row shows the
 * teacher's fixed identity color (a small dot, consistent across every other
 * card on the page), their respondent count (so the average is read with its
 * statistical weight in mind), and a "Ver detalle" link into their own
 * materia report.
 *
 * @example
 * <TeacherComparisonRanking
 *   entries={entries}
 *   colorByKey={colorByKey}
 *   courseCode="1155304"
 *   period="2025-1"
 * />
 */
export function TeacherComparisonRanking({
  entries,
  colorByKey,
  courseCode,
  period,
  className,
}: TeacherComparisonRankingProps) {
  const ranked = [...entries].sort((a, b) => {
    if (a.overall_average == null) return 1
    if (b.overall_average == null) return -1
    return b.overall_average - a.overall_average
  })

  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Ranking por promedio general
        </h2>

        <ScoreLegend />
      </div>

      <div className="border-border bg-background divide-border divide-y rounded-md border">
        {ranked.map((entry) => {
          const color = colorByKey.get(comparisonEntryKey(entry))

          return (
            <div
              key={comparisonEntryKey(entry)}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />

                <Avatar size="lg">
                  <AvatarFallback className="uppercase">
                    {entry.teacher_name.at(0) ?? '?'}
                  </AvatarFallback>
                  <AvatarImage
                    src={entry.teacher_avatar_url ?? undefined}
                    alt={entry.teacher_name}
                  />
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {entry.teacher_name}{' '}
                    <span className="text-muted-foreground font-normal">
                      · Grupo {entry.group_name}
                    </span>
                  </p>

                  <p className="text-muted-foreground text-xs">
                    {entry.respondent_count} estudiante{entry.respondent_count === 1 ? '' : 's'}{' '}
                    encuestado{entry.respondent_count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <ScoreBadge size="lg" value={entry.overall_average ?? undefined} />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  className="hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                  render={
                    <Link
                      href={courseTeacherHref(
                        courseCode,
                        entry.teacher_id,
                        period,
                        entry.group_name,
                      )}
                    />
                  }
                >
                  Ver detalle
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

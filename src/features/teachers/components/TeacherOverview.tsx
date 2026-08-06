import { CalendarRange } from 'lucide-react'

import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { dimensionColor, shortenDimensionLabel } from '@/lib/dimensionLabel'
import { getScoreToneClass } from '@/lib/scoreTone'
import type { TeacherDetail } from '../types'

interface TeacherOverviewProps {
  teacher: TeacherDetail
}

/**
 * Flat, typographic hero for a teacher's evaluation: a context strip naming
 * the academic period every figure below belongs to, the overall average as
 * the single large figure, and the four dimension averages as plain numeric
 * columns color-matched to the charts — sections separated by 1px hairlines
 * instead of cards.
 *
 * @example
 * <TeacherOverview teacher={teacher} />
 */
export function TeacherOverview({ teacher }: TeacherOverviewProps) {
  return (
    <section className="divide-border border-border bg-background divide-y overflow-hidden rounded-md border">
      <div className="bg-brand-50 dark:bg-brand-900/20 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-3">
        <p className="text-brand-700 dark:text-brand-200 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <CalendarRange
            className="text-brand-600 dark:text-brand-300 size-4 shrink-0"
            aria-hidden="true"
          />

          <span className="text-brand-700/80 dark:text-brand-300/80 text-xs font-medium tracking-wide uppercase">
            Datos del periodo
          </span>

          <Badge>{teacher.period_name}</Badge>
        </p>

        {teacher.group_count > 0 && (
          <p className="text-brand-700/70 dark:text-brand-300/70 text-xs tracking-wide uppercase">
            <span className="num text-brand-700 dark:text-brand-200 font-bold">
              {teacher.group_count}
            </span>{' '}
            {teacher.group_count === 1 ? 'grupo evaluado' : 'grupos evaluados'}
          </p>
        )}
      </div>

      <div className="relative flex flex-wrap items-start justify-between gap-6 overflow-hidden p-6">
        <div
          aria-hidden="true"
          className="from-brand-500/10 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-radial to-transparent blur-2xl"
        />

        <div className="relative flex items-start gap-2">
          <div>
            <Avatar size="lg">
              <AvatarFallback>{teacher.name.at(0)}</AvatarFallback>
              <AvatarImage src={teacher.avatar_url} alt={`Foto de ${teacher.name}`} />
            </Avatar>
          </div>

          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {teacher.institutional_code}
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{teacher.name}</h2>
          </div>
        </div>

        <div className="relative text-right">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Promedio general del periodo
          </p>

          <p
            className={`text-5xl leading-none font-bold tabular-nums ${getScoreToneClass(teacher.overall_average)}`}
          >
            {teacher.overall_average.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="divide-border grid grid-cols-2 divide-x sm:grid-cols-4">
        {teacher.dimensions.map((dimension) => (
          <div key={dimension.dimension} className="px-6 py-4">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: dimensionColor(dimension.dimension) }}
              />
              {shortenDimensionLabel(dimension.dimension)}
            </p>

            <p
              className={`mt-1 text-2xl font-semibold tabular-nums ${getScoreToneClass(dimension.average)}`}
            >
              {dimension.average.toFixed(2)}
            </p>

            <ScoreProgress
              value={dimension.average}
              tone="auto"
              size="md"
              className="mt-0.5"
              label={dimension.dimension}
              detailsTitle={dimension.dimension}
              details={
                dimension.questions.length > 0 && (
                  <ScrollArea className="h-56 px-4">
                    {dimension.questions.map((question) => (
                      <li key={question.code} className="flex items-start gap-3 py-2">
                        <span className="text-muted-foreground min-w-0 flex-1">
                          <span className="num text-muted-foreground/70 mr-1.5">
                            {question.code}
                          </span>
                          {question.text}
                        </span>

                        <span
                          className={`num shrink-0 font-semibold tabular-nums ${getScoreToneClass(question.score)}`}
                        >
                          {question.score.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ScrollArea>
                )
              }
            />
          </div>
        ))}
      </div>
    </section>
  )
}

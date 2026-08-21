import { CalendarRange, FileText, TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreLegend } from '@/components/common/ScoreLegend'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { TransitionLink } from '@/components/common/TransitionLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { dimensionColor } from '@/lib/dimensionLabel'
import { getScoreToneClass } from '@/lib/scoreTone'
import type { TeacherDetail } from '../types'
import { TeacherReportDownloadButton } from './TeacherReportDownloadButton'

interface TeacherOverviewProps {
  teacher: TeacherDetail
  /** Extra action(s) rendered next to "Descargar evaluación", e.g. the director's custom PDF report button. */
  extraActions?: ReactNode
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
export function TeacherOverview({ teacher, extraActions }: TeacherOverviewProps) {
  const dimensionDeltas = teacher.previous_period
    ? teacher.dimensions
        .map((dimension) => {
          const previous = teacher.previous_period?.dimensions.find(
            (item) => item.dimension === dimension.dimension,
          )
          return previous?.average != null
            ? { dimension: dimension.dimension, delta: dimension.average - previous.average }
            : null
        })
        .filter((item): item is { dimension: string; delta: number } => item != null)
    : []

  const bestMover = dimensionDeltas.reduce<{ dimension: string; delta: number } | null>(
    (best, current) => (best == null || current.delta > best.delta ? current : best),
    null,
  )
  const worstMover = dimensionDeltas.reduce<{ dimension: string; delta: number } | null>(
    (worst, current) => (worst == null || current.delta < worst.delta ? current : worst),
    null,
  )
  const showBestMover = bestMover != null && bestMover.delta > 0
  const showWorstMover =
    worstMover != null && worstMover.delta < 0 && worstMover.dimension !== bestMover?.dimension

  return (
    <>
      <p className="text-foreground mb-2 text-sm font-medium">
        Tomado de: Evaluación docente generado por DIVISIST (División de Sistemas)
      </p>

      <section className="border-border bg-background divide-y overflow-hidden rounded-md border">
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

          <div className="flex items-center gap-4">
            {teacher.group_count > 0 && (
              <p className="text-brand-700/70 dark:text-brand-300/70 text-xs tracking-wide uppercase">
                <span className="num text-brand-700 dark:text-brand-200 font-bold">
                  {teacher.group_count}
                </span>{' '}
                {teacher.group_count === 1 ? 'grupo evaluado' : 'grupos evaluados'}
              </p>
            )}

            <TeacherReportDownloadButton
              teacherId={teacher.teacher_id}
              evaluationId={teacher.evaluation_id}
              className="bg-background"
            />

            {extraActions}
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <TransitionLink
                  href={`/evaluaciones/${teacher.evaluation_id}/pdf?profesor=${teacher.teacher_id}`}
                />
              }
            >
              <FileText className="size-4" aria-hidden="true" />
              Ver evaluación en PDF
            </Button>
          </div>
        </div>

        <div>
          <div className="relative flex flex-wrap items-start justify-between gap-6 overflow-hidden p-6">
            <div
              aria-hidden="true"
              className="from-brand-500/10 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-radial to-transparent blur-2xl"
            />

            <div className="relative flex items-center gap-2">
              <div>
                <Avatar className="size-20">
                  <AvatarFallback>{teacher.name.at(0)}</AvatarFallback>
                  <AvatarImage src={teacher.avatar_url} alt={`Foto de ${teacher.name}`} />
                </Avatar>
              </div>

              <div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {teacher.name}
                </h2>
                <p className="text-muted-foreground tracking-wide uppercase">
                  {teacher.institutional_code}
                </p>
              </div>
            </div>

            <div className="relative text-right">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Promedio general del periodo
              </p>

              <ScoreBadge
                value={teacher.overall_average}
                previousValue={teacher.previous_period?.overall_average}
                previousLabel="periodo anterior"
                tone="auto"
                size="5xl"
                decimals={2}
                className="leading-none"
              />

              {(showBestMover || showWorstMover) && (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {showBestMover && bestMover && (
                    <Badge className="gap-1 bg-emerald-50 text-emerald-700">
                      <TrendingUp className="size-3.5" aria-hidden="true" />
                      Mayor mejora: {bestMover.dimension} (+{bestMover.delta.toFixed(2)})
                    </Badge>
                  )}

                  {showWorstMover && worstMover && (
                    <Badge className="gap-1 bg-red-50 text-red-700">
                      <TrendingDown className="size-3.5" aria-hidden="true" />
                      Requiere atención: {worstMover.dimension} ({worstMover.delta.toFixed(2)})
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end px-6 py-2">
            <ScoreLegend />
          </div>
        </div>

        <div className="divide-border grid grid-cols-2 divide-x sm:grid-cols-4">
          {teacher.dimensions.map((dimension) => {
            const previousDimension = teacher.previous_period?.dimensions.find(
              (previous) => previous.dimension === dimension.dimension,
            )

            return (
              <div key={dimension.dimension} className="px-6 py-4">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: dimensionColor(dimension.dimension) }}
                  />
                  {dimension.dimension}
                </p>

                <p
                  className={`mt-1 text-2xl font-semibold tabular-nums ${getScoreToneClass(dimension.average)}`}
                >
                  {dimension.average.toFixed(2)}
                </p>

                <ScoreProgress
                  value={dimension.average}
                  previousValue={previousDimension?.average}
                  previousLabel="periodo anterior"
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
            )
          })}
        </div>
      </section>
    </>
  )
}

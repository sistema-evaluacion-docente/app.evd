import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { dimensionColor, shortenDimensionLabel } from '@/lib/dimensionLabel'
import { getScoreToneClass } from '@/lib/scoreTone'
import type { TeacherDetail } from '../types'

interface TeacherOverviewProps {
  teacher: TeacherDetail
}

/**
 * Flat, typographic hero for a teacher's evaluation: the overall average as
 * the single large figure, the four dimension averages as plain numeric
 * columns color-matched to the charts below, and group/respondent/course
 * counts — sections separated by 1px hairlines instead of cards.
 *
 * @example
 * <TeacherOverview teacher={teacher} />
 */
export function TeacherOverview({ teacher }: TeacherOverviewProps) {
  return (
    <section className="divide-border border-border bg-background divide-y overflow-hidden rounded-md border">
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
            Promedio general
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

            <Progress value={dimension.average} max={5} className="mt-2 h-1.5" />
          </div>
        ))}
      </div>
    </section>
  )
}

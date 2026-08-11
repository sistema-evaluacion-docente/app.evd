import { CalendarRange, Inbox, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Stagger } from '@/components/common/stagger'
import EvaluationDimensionsDetailSkeleton from '@/components/skeletons/EvaluationDimensionsDetailSkeleton'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { CourseSelect } from '@/features/courses'
import { TeacherSelect } from '@/features/teachers'
import { useGetEvaluationDimensionsDetail } from '../api'
import { EvaluationDimensionDetailCard, EvaluationDimensionsChart } from '../components'

/**
 * Full page with the per-dimension breakdown of an evaluation: each
 * pedagogical dimension's average, its questions, the best/worst performing
 * teacher, and the full teacher ranking on that dimension. Optionally scoped
 * to one teacher and/or one course.
 * Route: `/evaluaciones/:id/dimensiones` where `:id` is the evaluation id.
 */
export default function EvaluationDimensionsPage() {
  const [, params] = useRoute('/evaluaciones/:id/dimensiones')
  const evaluationId = params?.id ? Number(params.id) : undefined

  const [teacherId, setTeacherId] = useState<number | undefined>(undefined)
  const [courseId, setCourseId] = useState<number | undefined>(undefined)

  const { data, isLoading, isFetching } = useGetEvaluationDimensionsDetail(evaluationId, {
    teacherId,
    courseId,
  })
  const detail = data?.data

  const overall = detail?.overall
  const averageLabel = !overall
    ? 'Promedio del departamento'
    : teacherId && courseId
      ? 'Promedio del docente en la asignatura'
      : teacherId
        ? 'Promedio del docente'
        : 'Promedio de la asignatura'

  if (isLoading) return <EvaluationDimensionsDetailSkeleton />

  if (!detail) {
    return (
      <>
        <PageTitle>Detalle por dimensiones</PageTitle>

        <div className="py-16 text-center">
          <Inbox aria-hidden="true" className="text-muted-foreground/40 mx-auto mb-3 size-8" />
          <p className="text-muted-foreground text-sm">No se encontró la evaluación.</p>
        </div>

        <div className="flex justify-center">
          <BackButton href="/evaluaciones" label="Volver a evaluaciones" />
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <BackButton
        href={`/evaluaciones/${detail.evaluation_id}`}
        label="Volver a la evaluación"
        className="mb-4"
      />

      <Stagger>
        <section className="divide-border border-border bg-background divide-y overflow-hidden rounded-md border">
          <div className="bg-brand-50 dark:bg-brand-900/20 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
            <p className="text-brand-700 dark:text-brand-200 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <CalendarRange
                className="text-brand-600 dark:text-brand-300 size-4 shrink-0"
                aria-hidden="true"
              />

              <span className="text-brand-700/80 dark:text-brand-300/80 text-xs font-medium tracking-wide uppercase">
                Evaluación del periodo
              </span>

              <Badge className="text-sm font-bold">
                {detail.period_name || detail.period_code}
              </Badge>
            </p>
          </div>

          <div className="relative flex flex-wrap items-start justify-between gap-6 overflow-hidden p-6">
            <div
              aria-hidden="true"
              className="from-brand-500/10 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-radial to-transparent blur-2xl"
            />

            <div className="relative min-w-0">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Desglose por dimensión pedagógica
              </h2>
            </div>

            <div className="relative text-right">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {averageLabel}
              </p>

              <ScoreBadge
                value={detail.department_average}
                previousValue={overall?.department_average}
                previousLabel="promedio del departamento"
                tone="auto"
                size="5xl"
                className="leading-none"
              />
            </div>
          </div>
        </section>
      </Stagger>

      <Stagger delay={60}>
        <section className="border-border bg-background rounded-md border">
          <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
            Perfil general de la evaluación
          </h2>

          <div className="px-6 py-4">
            <EvaluationDimensionsChart
              dimensionAverages={detail.dimensions}
              compareAverages={overall?.dimensions}
              referenceValue={overall ? undefined : detail.department_average}
              referenceLabel="Promedio del departamento"
            />
          </div>
        </section>
      </Stagger>

      <Stagger delay={120}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
            <SlidersHorizontal aria-hidden="true" className="size-3.5" />
            Filtrar
          </span>

          <TeacherSelect
            idValue={teacherId}
            onIdChange={setTeacherId}
            placeholder="Docente"
            size="sm"
          />

          <CourseSelect
            value={courseId}
            onValueChange={setCourseId}
            placeholder="Asignatura"
            size="sm"
          />

          {isFetching && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Spinner className="size-3.5" />
              Actualizando…
            </span>
          )}
        </div>
      </Stagger>

      <Stagger delay={180}>
        <section className="border-border bg-background rounded-md border">
          <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
            Detalle por dimensión
          </h2>

          {detail.dimensions.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox aria-hidden="true" className="text-muted-foreground/40 mx-auto mb-3 size-8" />
              <p className="text-muted-foreground text-sm">
                No hay resultados para los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="divide-border divide-y">
              {detail.dimensions.map((dimension) => (
                <EvaluationDimensionDetailCard
                  key={dimension.dimension}
                  dimension={dimension}
                  overallDimension={overall?.dimensions.find(
                    (item) => item.dimension === dimension.dimension,
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </Stagger>
    </div>
  )
}

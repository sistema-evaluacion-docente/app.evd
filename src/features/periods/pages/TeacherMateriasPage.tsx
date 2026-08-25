import { Layers } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { BackButton } from '@/components/common/BackButton'
import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { PageTitle } from '@/components/common/PageTitle'
import { PeriodSelect, type PeriodSelectOption } from '@/components/common/PeriodSelect'
import TeacherMateriasSkeleton from '@/components/skeletons/TeacherMateriasSkeleton'
import { useAuthStore } from '@/features/auth'
import { TeacherCourseResults, useGetTeacherDetail } from '@/features/teachers'
import { useGetTeacherHistory } from '../api'
import { courseHref } from '../config'

/** Chart axis labels have limited room — long materia names get cut off past this. */
function shortenCourseName(name: string, maxLength = 24): string {
  return name.length > maxLength ? `${name.slice(0, maxLength - 1)}…` : name
}

/**
 * What the page says when it has no materias to show.
 *
 * Same shape the rest of the app already uses for an empty page — the icon of
 * the section, a headline and a line explaining what would fill it — so a
 * teacher without evaluations does not land on a bare sentence that reads like
 * something broke. The icon is the one the sidebar puts next to "Materias".
 */
function MateriasEmpty({ headline, children }: { headline: string; children: ReactNode }) {
  return (
    <div className="border-border text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed py-16 text-center">
      <Layers className="size-8" aria-hidden="true" />
      <p className="font-medium">{headline}</p>
      <p className="max-w-prose px-6 text-sm">{children}</p>
    </div>
  )
}

/**
 * Dedicated "Materias" view for the authenticated teacher: a period selector
 * (defaults to the most recent) and the subjects taught in that period —
 * reached from the "Materias" sidebar sub-item, which now navigates here
 * instead of expanding inline. Doesn't duplicate the full period report
 * already at `/periodos/:period` (dimensions, comments, evolution) — this
 * page is specifically for browsing materias.
 * Route: `/periodos/materias?period=<name>`
 */
export default function TeacherMateriasPage() {
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined

  const { data: historyData, isPending: isHistoryPending } = useGetTeacherHistory({
    limit: 50,
    sort_by: 'period_code_desc',
  })
  const periods = historyData?.data ?? []

  const periodOptions: PeriodSelectOption[] = periods.map((period) => ({
    id: period.period_id,
    name: period.period_name ?? period.period_code,
    code: period.period_code,
  }))

  const [periodId, setPeriodId] = useState<number | undefined>(undefined)
  const selectedOption = periodOptions.find((option) => option.id === periodId)

  const { data, isLoading } = useGetTeacherDetail({
    teacherId,
    periodName: selectedOption?.code,
  })
  const teacher = data?.data

  if (!teacherId) {
    return (
      <>
        <PageTitle>Mis materias</PageTitle>

        <MateriasEmpty headline="Su usuario no está vinculado a un registro de docente.">
          Sin ese vínculo no hay materias que mostrar. Contacte al administrador del sistema para
          que lo asocie a su registro.
        </MateriasEmpty>

        <div className="mt-6 flex justify-center">
          <BackButton href="/home" label="Volver a mi resumen" />
        </div>
      </>
    )
  }

  return (
    <>
      {isHistoryPending ? (
        <TeacherMateriasSkeleton withHeader />
      ) : periods.length === 0 ? (
        <>
          <PageTitle>Mis materias</PageTitle>

          <MateriasEmpty headline="Aún no tiene evaluaciones registradas.">
            Cuando la dirección de su departamento cargue la evaluación de un periodo, las materias
            que dictó aparecerán aquí con su promedio.
          </MateriasEmpty>

          <div className="mt-6 flex justify-center">
            <BackButton href="/home" label="Volver a mi resumen" />
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <PageTitle className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>Mis materias</p>
            <div className="flex items-center gap-3">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Periodo
              </h2>

              <PeriodSelect
                className="font-normal"
                options={periodOptions}
                value={selectedOption?.id}
                onValueChange={setPeriodId}
                searchParam="period"
                ariaLabel="Periodo"
              />
            </div>
          </PageTitle>

          {isLoading ? (
            <TeacherMateriasSkeleton />
          ) : !teacher ? (
            /* The title and the period selector are already on screen here, so
               this only needs to say what is missing — changing the period is
               the way out, not going back. */
            <MateriasEmpty headline="No se encontraron materias para este periodo.">
              Elija otro periodo en el selector de arriba para ver las materias que dictó.
            </MateriasEmpty>
          ) : (
            <>
              {teacher.courses.length > 0 && (
                <section className="border-border bg-background rounded-md border">
                  <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
                    Promedio por materia
                  </h2>

                  <div className="px-6 py-4">
                    <DimensionComparisonChart
                      series={[
                        {
                          id: 'promedio',
                          label: 'Promedio',
                          scores: teacher.courses.map((course) => ({
                            dimension: `${course.course_code}-${course.group_name}`,
                            value: course.overall_average,
                          })),
                        },
                      ]}
                      dimensions={teacher.courses.map((course) => ({
                        key: `${course.course_code}-${course.group_name}`,
                        label: shortenCourseName(course.course_name),
                      }))}
                      orientation="vertical"
                      referenceValue={teacher.overall_average}
                      referenceLabel="Promedio general"
                    />
                  </div>
                </section>
              )}

              <TeacherCourseResults
                teacher={teacher}
                getCourseHref={(course) =>
                  courseHref(teacher.period_code, course.course_code, course.group_name)
                }
              />
            </>
          )}
        </div>
      )}
    </>
  )
}

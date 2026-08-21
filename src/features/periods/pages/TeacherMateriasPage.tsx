import { useState } from 'react'

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
        <PageTitle>Materias</PageTitle>

        <p className="text-muted-foreground py-10 text-center text-sm">
          Su usuario no está vinculado a un registro de docente. Contacte al administrador del
          sistema.
        </p>
      </>
    )
  }

  return (
    <>
      {isHistoryPending ? (
        <TeacherMateriasSkeleton withHeader />
      ) : periods.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Aún no tiene evaluaciones registradas.
        </p>
      ) : (
        <div className="space-y-6">
          <PageTitle className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>Mis materias</p>

            <PeriodSelect
              className="font-normal"
              options={periodOptions}
              value={selectedOption?.id}
              onValueChange={setPeriodId}
              searchParam="period"
              ariaLabel="Periodo"
            />
          </PageTitle>

          {isLoading ? (
            <TeacherMateriasSkeleton />
          ) : !teacher ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              No se encontraron materias para este periodo.
            </p>
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

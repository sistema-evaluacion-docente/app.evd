import { useRoute, useSearchParams } from 'wouter'

import { PageTitle } from '@/components/common/PageTitle'
import { Stagger } from '@/components/common/stagger'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetTeacherDetail } from '../api'
import {
  TeacherComments,
  TeacherCourseResults,
  TeacherGroupAverageChart,
  TeacherOverview,
} from '../components'

/**
 * Full page displaying the detail of a single teacher for a specific academic period.
 * Route: `/docentes/:id?period=<period_name>`
 */
export default function TeacherDetailPage() {
  const [, params] = useRoute('/docentes/:id')
  const [searchParams] = useSearchParams()

  const teacherId = params?.id ? Number(params.id) : undefined
  const periodName = searchParams.get('period') ?? undefined

  const { data, isLoading } = useGetTeacherDetail({ teacherId, periodName })
  const teacher = data?.data

  if (isLoading) {
    return (
      <>
        <PageTitle>Detalle del docente</PageTitle>

        <div className="space-y-6">
          <Skeleton className="h-56 rounded-md" />
          <Skeleton className="h-72 rounded-md" />
          <Skeleton className="h-80 rounded-md" />
        </div>
      </>
    )
  }

  if (!teacher) {
    return (
      <>
        <PageTitle>Detalle del docente</PageTitle>
        <p className="text-muted-foreground text-center">No se encontró el docente.</p>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Stagger animation="animate-rise">
          <TeacherOverview teacher={teacher} />
        </Stagger>

        <Stagger animation="animate-rise" delay={80}>
          <section className="border-border bg-card rounded-md border">
            <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
              Dimensiones por asignatura
            </h2>

            <div className="px-6 py-4">
              <TeacherGroupAverageChart courses={teacher.courses} />
            </div>
          </section>
        </Stagger>

        <Stagger animation="animate-rise" delay={160}>
          <TeacherCourseResults teacher={teacher} />
        </Stagger>

        <Stagger animation="animate-rise" delay={240}>
          <TeacherComments
            evaluationId={teacher.evaluation_id}
            teacherId={teacher.teacher_id}
            title="Comentarios de los estudiantes"
          />
        </Stagger>
      </div>
    </>
  )
}

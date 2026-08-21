import { useRoute, useSearchParams } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import TeacherDetailSkeleton from '@/components/skeletons/TeacherDetailSkeleton'
import { TeacherPlanAction } from '@/features/plans'
import { useGetTeacherDetail } from '../api'
import { TeacherEvaluationDetail } from '../components'
import { courseTeacherHref } from '../config'

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

  if (isLoading) return <TeacherDetailSkeleton />

  if (!teacher) {
    return (
      <>
        <PageTitle>Detalle del docente</PageTitle>
        <p className="text-muted-foreground text-center">No se encontró el docente.</p>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <BackButton href={`/docentes?period=${teacher.period_name}`} className="mb-4" />

      <TeacherEvaluationDetail
        teacher={teacher}
        getCourseHref={(course) =>
          courseTeacherHref(
            course.course_code,
            teacher.teacher_id,
            teacher.period_code,
            course.group_name,
          )
        }
      />

      <TeacherPlanAction
        teacherId={teacher.teacher_id}
        teacherName={teacher.name}
        periodCode={teacher.period_code}
      />
    </div>
  )
}

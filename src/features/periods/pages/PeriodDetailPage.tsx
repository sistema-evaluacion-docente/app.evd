import { FileText } from 'lucide-react'
import { Link, useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import TeacherDetailSkeleton from '@/components/skeletons/TeacherDetailSkeleton'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth'
import { TeacherEvaluationDetail, useGetTeacherDetail } from '@/features/teachers'
import { courseHref } from '../config'

/**
 * Full page with the authenticated teacher's own results for one academic
 * period — same report the director sees, scoped to the logged-in teacher.
 * Route: `/periodos/:period` (e.g. `/periodos/2025-1`).
 */
export default function PeriodDetailPage() {
  const [, params] = useRoute('/periodos/:period')
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined

  const periodName = params?.period ? decodeURIComponent(params.period) : undefined

  const { data, isLoading } = useGetTeacherDetail({ teacherId, periodName })
  const teacher = data?.data

  if (!teacherId) {
    return (
      <>
        <PageTitle>Resultados del periodo</PageTitle>

        <p className="text-muted-foreground py-10 text-center text-sm">
          Su usuario no está vinculado a un registro de docente. Contacte al administrador del
          sistema.
        </p>
      </>
    )
  }

  if (isLoading) return <TeacherDetailSkeleton />

  if (!teacher) {
    return (
      <>
        <PageTitle>Resultados del periodo</PageTitle>

        <p className="text-muted-foreground py-10 text-center text-sm">
          No se encontraron resultados para el periodo {periodName}.
        </p>

        <div className="flex justify-center">
          <BackButton href="/periodos" label="Volver a mis periodos" />
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/periodos" label="Volver a mis periodos" />

        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/evaluaciones/${teacher.evaluation_id}/pdf`} />}
        >
          <FileText className="size-4" aria-hidden="true" />
          Ver documento
        </Button>
      </div>

      <TeacherEvaluationDetail
        teacher={teacher}
        commentsTitle="Comentarios de sus estudiantes"
        getCourseHref={(course) =>
          courseHref(teacher.period_code, course.course_code, course.group_name)
        }
      />
    </div>
  )
}

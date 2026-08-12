import { useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { useAuthStore } from '@/features/auth'
import { useGetTeacherDetail } from '@/features/teachers'

/**
 * Placeholder detail page for a single subject ("materia") within one of the
 * authenticated teacher's periods, reached from the "Materias" sidebar
 * submenu. Full content (dimension breakdown, comments, historical
 * comparison against the last time this subject was taught) lands in a
 * later step — this only resolves and shows the subject's real name so the
 * navigation is fully usable end to end.
 * Route: `/periodos/:period/materias/:courseCode/:groupName`.
 */
export default function PeriodCourseDetailPage() {
  const [, params] = useRoute('/periodos/:period/materias/:courseCode/:groupName')
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined

  const period = params?.period ? decodeURIComponent(params.period) : undefined
  const courseCode = params?.courseCode ? decodeURIComponent(params.courseCode) : undefined
  const groupName = params?.groupName ? decodeURIComponent(params.groupName) : undefined

  const { data, isLoading } = useGetTeacherDetail({ teacherId, periodName: period })
  const course = data?.data.courses.find(
    (item) => item.course_code === courseCode && item.group_name === groupName,
  )

  return (
    <>
      <BackButton
        href={period ? `/periodos/${encodeURIComponent(period)}` : '/periodos'}
        label="Volver al periodo"
        className="mb-4"
      />

      <PageTitle backButton={false}>
        {isLoading ? 'Cargando…' : (course?.course_name ?? 'Materia')}
      </PageTitle>

      <div className="border-border bg-background text-muted-foreground rounded-md border px-6 py-10 text-center text-sm">
        {isLoading ? (
          'Cargando…'
        ) : course ? (
          <>
            Grupo {course.group_name} · {period}
            <br />
            El detalle de esta materia (dimensiones, comentarios y comparación histórica) está en
            construcción.
          </>
        ) : (
          'No se encontró información para esta materia en el periodo indicado.'
        )}
      </div>
    </>
  )
}

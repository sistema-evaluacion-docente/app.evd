import { useRoute, useSearchParams } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { CourseTeacherDetail } from '@/features/teachers'

/**
 * Director's read of one teacher's results in a single subject ("materia")
 * for one period — reached from the Materias list (when only one teacher
 * taught it) or from a "Ver detalle" link on one of the teacher's own course
 * rows in `/docentes/:id`. Thin wrapper around the shared
 * `CourseTeacherDetail`, showing the teacher's identity since the viewer
 * isn't the teacher themself.
 * Route: `/materias/:courseCode/docentes/:teacherId?period=<code>&group=<name>`
 */
export default function SubjectTeacherDetailPage() {
  const [, params] = useRoute('/materias/:courseCode/docentes/:teacherId')
  const [searchParams] = useSearchParams()

  const courseCode = params?.courseCode ? decodeURIComponent(params.courseCode) : undefined
  const teacherId = params?.teacherId ? Number(params.teacherId) : undefined
  const period = searchParams.get('period') ?? undefined
  const groupName = searchParams.get('group') ?? undefined

  const backHref =
    teacherId != null && period
      ? `/docentes/${teacherId}?period=${encodeURIComponent(period)}`
      : '/materias'

  if (!courseCode || teacherId == null || !period || !groupName) {
    return (
      <>
        <BackButton href={backHref} label="Volver al docente" className="mb-4" />
        <p className="text-muted-foreground py-10 text-center text-sm">
          No se encontró información para esta materia.
        </p>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <BackButton href={backHref} label="Volver al docente" className="mb-4" />

      <CourseTeacherDetail
        teacherId={teacherId}
        courseCode={courseCode}
        groupName={groupName}
        period={period}
        showTeacherIdentity
      />
    </div>
  )
}

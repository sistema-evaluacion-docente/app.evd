import { useRoute, useSearchParams } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { InlineError } from '@/components/common/InlineError'
import { PeriodBanner } from '@/components/common/PeriodBanner'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetCourseTeachersComparison } from '@/features/stats'
import {
  TeacherCommentsComparison,
  TeacherComparisonRanking,
  TeacherDimensionComparison,
} from '../components'
import { buildTeacherComparisonColorMap, comparisonEntryKey } from '../config'

/**
 * Director's side-by-side comparison of every teacher who taught a subject
 * ("materia") in a period — ranking, per-dimension breakdown, and comment
 * classification, all keyed to the same fixed identity color per teacher.
 * Reached from `SubjectsList`'s "Comparar" action when a subject had 2+
 * teachers.
 * Route: `/materias/:courseCode/comparar?period=<code>&name=<course_name>`
 */
export default function SubjectComparisonPage() {
  const [, params] = useRoute('/materias/:courseCode/comparar')
  const [searchParams] = useSearchParams()

  const courseCode = params?.courseCode ? decodeURIComponent(params.courseCode) : undefined
  const period = searchParams.get('period') ?? undefined
  const courseName = searchParams.get('name') ?? undefined

  const { data, isPending, error } = useGetCourseTeachersComparison({ courseCode, period })
  const rawEntries = Array.isArray(data?.data) ? data.data : []
  // The API can repeat the same (teacher, group) pair — every list below keys
  // rows by that pair, so a duplicate silently drops a row via a React key
  // collision instead of rendering it twice. Deduping once here, before any
  // child sees the data, keeps every section's count consistent.
  const seenEntryKeys = new Set<string>()
  const entries = rawEntries.filter((entry) => {
    const key = comparisonEntryKey(entry)
    if (seenEntryKeys.has(key)) return false
    seenEntryKeys.add(key)
    return true
  })
  const colorByKey = buildTeacherComparisonColorMap(entries)

  if (!courseCode || !period) {
    return (
      <>
        <BackButton fallbackHref="/materias" label="Volver" className="mb-4" />
        <p className="text-muted-foreground py-10 text-center text-sm">
          No se encontró información para esta comparación.
        </p>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/materias" label="Volver" className="mb-4" />

      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Comparación de docentes{courseName ? `: ${courseName}` : ''}</h1>
        <PeriodBanner label="Periodo comparado" period={period} />
      </div>

      {error && <InlineError message={error.message} />}

      {isPending && !error && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      )}

      {!isPending && !error && entries.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No hay docentes para comparar en esta materia y periodo.
        </p>
      )}

      {!isPending && !error && entries.length > 0 && (
        <div className="space-y-6">
          <TeacherComparisonRanking
            entries={entries}
            colorByKey={colorByKey}
            courseCode={courseCode}
            period={period}
          />

          <TeacherDimensionComparison entries={entries} colorByKey={colorByKey} />

          <TeacherCommentsComparison
            entries={entries}
            colorByKey={colorByKey}
            courseCode={courseCode}
          />
        </div>
      )}
    </div>
  )
}

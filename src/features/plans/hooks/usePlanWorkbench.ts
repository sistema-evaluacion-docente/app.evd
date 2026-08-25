import { useCallback, useMemo } from 'react'

// Imported from the api module instead of the feature root on purpose:
// `features/teachers` imports `features/plans` for `TeacherPlanAction`, so
// going through the barrel would close an import cycle between the two.
import { useGetTeacherComments, useGetTeacherDetail } from '@/features/teachers/api'
import type { CourseDetail, TeacherComment } from '@/features/teachers/types'
import { useGetTeacherCourses } from '../api'
import { countRisky, groupComments, type GroupedComments } from '../lib/commentGroups'
import {
  buildDimensionsFromDetail,
  countWeak,
  courseKey,
  courseLabel,
  SUBJECT_ALL,
} from '../lib/indicatorMatrix'
import type { IndicatorDimension, PlanCandidate, PlanIndicators, PlanSubjectOption } from '../types'

interface PlanWorkbenchArgs {
  teacherId?: number
  periodId?: number
  /** `AcademicPeriod.name` — what `/evaluations/teachers/{id}/detail` keys on. */
  periodName?: string
  candidate?: PlanCandidate
  catalogue?: PlanIndicators
  threshold: number
  /** Narrows both the matrix and the comment list to the weak/risky ones. */
  onlyWeak: boolean
  /** `SUBJECT_ALL` or a `courseKey`. */
  subjectKey: string
}

export interface PlanWorkbench {
  /** Every subject the teacher taught in the period, filter aside. */
  allSubjects: PlanSubjectOption[]
  /** "General" is not part of this list; the picker renders it apart. */
  subjectOptions: PlanSubjectOption[]
  /**
   * The asignaturas with something below the threshold or a comment in risk,
   * independent of the filter — what the empty state of "General" points at.
   */
  subjectsWithFindings: PlanSubjectOption[]
  /** The subject in use, or `null` while looking at the teacher as a whole. */
  activeSubject: PlanSubjectOption | null
  /** Falls back to `SUBJECT_ALL` when the chosen subject is filtered out. */
  effectiveSubjectKey: string
  dimensions: IndicatorDimension[]
  /**
   * The scored matrix of any asignatura, or of the teacher when `null` —
   * independent of the filter `dimensions` follows. Seeding a selection made on
   * the profile needs the scores of every asignatura it touched, not only of
   * the one the picker happens to be showing.
   */
  matrixOf: (subjectKey: string | null) => IndicatorDimension[]
  comments: GroupedComments
  /** Every comment of the period, flat, for the ones cited by id. */
  allComments: TeacherComment[]
  weakCount: number
  riskyCount: number
  aiStatus: string | null
  hasCommentData: boolean
  /**
   * Whether the subject list and the comments are still on their way. Reads
   * `isLoading`, not `isPending`: both queries stay `pending` while disabled,
   * which would leave the flag stuck on with no teacher selected.
   */
  isLoading: boolean
}

/**
 * Joins everything section 2 of the creation page needs: the indicator matrix
 * (teacher-wide or for one subject), the student comments grouped by the
 * dimension they talk about, and the subjects that can be filtered by.
 *
 * @example
 * const workbench = usePlanWorkbench({ teacherId, periodId, periodName, candidate,
 *   catalogue, threshold, onlyWeak, subjectKey })
 */
export function usePlanWorkbench({
  teacherId,
  periodId,
  periodName,
  candidate,
  catalogue,
  threshold,
  onlyWeak,
  subjectKey,
}: PlanWorkbenchArgs): PlanWorkbench {
  const { data: detailResponse, isLoading: detailLoading } = useGetTeacherDetail({
    teacherId,
    periodName,
  })
  const detail = detailResponse?.data

  const { data: commentsResponse, isLoading: commentsLoading } = useGetTeacherComments({
    evaluationId: detail?.evaluation_id,
    teacherId,
  })

  const { data: coursesResponse } = useGetTeacherCourses(teacherId, periodId)

  /**
   * Course+group rows, with the `academic_group_id` and la carrera que sólo la
   * API de planes conoce — la resuelve desde el código de la asignatura, no
   * desde el departamento del docente.
   */
  const detailByKey = useMemo(() => {
    const entries = new Map<string, CourseDetail>()

    for (const course of detail?.courses ?? []) entries.set(courseKey(course), course)

    return entries
  }, [detail])

  const commentCourses = commentsResponse?.data?.courses

  /**
   * Every asignatura the teacher taught, each carrying how much is wrong with
   * it.
   *
   * The counts are computed here, once, rather than inside the filter that
   * used to drop them on the floor: they are what tells a reader looking at
   * the teacher's own average — which can clear the threshold while a single
   * course sits under it — that there is somewhere else to look.
   */
  const allSubjects = useMemo<PlanSubjectOption[]>(() => {
    const groups = coursesResponse?.data ?? []

    return (detail?.courses ?? []).map((course) => {
      const key = courseKey(course)

      const match = groups.find(
        (group) =>
          group.course_code === course.course_code && group.group_name === course.group_name,
      )

      return {
        key,
        label: courseLabel(course),
        course_name: course.course_name,
        course_code: course.course_code,
        group_name: course.group_name,
        academic_group_id: match?.academic_group_id ?? null,
        program_name: match?.program_name ?? null,
        weakCount: countWeak(
          buildDimensionsFromDetail(detailByKey.get(key)?.dimensions, catalogue, threshold),
        ),
        riskyCount: countRisky(groupComments(commentCourses, key)),
      }
    })
  }, [detail, coursesResponse, detailByKey, catalogue, threshold, commentCourses])

  /** Subjects worth offering: with the filter on, only the ones with findings. */
  const subjectOptions = useMemo(
    () =>
      onlyWeak
        ? allSubjects.filter((subject) => subject.weakCount > 0 || subject.riskyCount > 0)
        : allSubjects,
    [allSubjects, onlyWeak],
  )

  /**
   * What the teacher's own averages hide: the asignaturas that do have
   * something, whatever the filter is showing. `subjectOptions` cannot answer
   * this — with the filter off it holds every course, findings or not.
   */
  const subjectsWithFindings = useMemo(
    () => allSubjects.filter((subject) => subject.weakCount > 0 || subject.riskyCount > 0),
    [allSubjects],
  )

  const effectiveSubjectKey =
    subjectKey !== SUBJECT_ALL && subjectOptions.some((option) => option.key === subjectKey)
      ? subjectKey
      : SUBJECT_ALL

  const activeSubject = subjectOptions.find((option) => option.key === effectiveSubjectKey) ?? null

  const matrixOf = useCallback(
    (scope: string | null): IndicatorDimension[] => {
      if (scope != null) {
        return buildDimensionsFromDetail(detailByKey.get(scope)?.dimensions, catalogue, threshold)
      }

      // Teacher-wide the API already computed the matrix, thresholds included.
      if (candidate) return candidate.dimensions

      return buildDimensionsFromDetail(detail?.dimensions, catalogue, threshold)
    },
    [detailByKey, catalogue, threshold, candidate, detail],
  )

  const dimensions = useMemo(() => matrixOf(activeSubject?.key ?? null), [matrixOf, activeSubject])

  const comments = useMemo(
    () => groupComments(commentCourses, activeSubject?.key),
    [commentCourses, activeSubject],
  )

  const allComments = useMemo(
    () => (commentCourses ?? []).flatMap((course) => course.comments),
    [commentCourses],
  )

  return {
    allSubjects,
    subjectOptions,
    subjectsWithFindings,
    activeSubject,
    effectiveSubjectKey,
    dimensions,
    matrixOf,
    comments,
    allComments,
    weakCount: countWeak(dimensions),
    riskyCount: countRisky(comments),
    aiStatus: commentsResponse?.data?.ai_status ?? null,
    hasCommentData: (commentCourses?.length ?? 0) > 0,
    isLoading: detailLoading || commentsLoading,
  }
}

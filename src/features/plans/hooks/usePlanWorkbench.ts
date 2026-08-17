import { useMemo } from 'react'

// Imported from the api module instead of the feature root on purpose:
// `features/teachers` imports `features/plans` for `TeacherPlanAction`, so
// going through the barrel would close an import cycle between the two.
import { useGetTeacherComments, useGetTeacherDetail } from '@/features/teachers/api'
import type { CourseDetail } from '@/features/teachers/types'
import { useGetTeacherCourses } from '../api'
import { countRisky, groupComments, type GroupedComments } from '../lib/commentGroups'
import {
  buildDimensionsFromDetail,
  countWeak,
  courseKey,
  courseLabel,
  hasWeakIndicators,
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
  /** The subject in use, or `null` while looking at the teacher as a whole. */
  activeSubject: PlanSubjectOption | null
  /** Falls back to `SUBJECT_ALL` when the chosen subject is filtered out. */
  effectiveSubjectKey: string
  dimensions: IndicatorDimension[]
  comments: GroupedComments
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

  /** Course+group rows, with the `academic_group_id` only the plans API knows. */
  const allSubjects = useMemo<PlanSubjectOption[]>(() => {
    const groups = coursesResponse?.data ?? []

    return (detail?.courses ?? []).map((course) => {
      const match = groups.find(
        (group) =>
          group.course_code === course.course_code && group.group_name === course.group_name,
      )

      return {
        key: courseKey(course),
        label: courseLabel(course),
        course_name: course.course_name,
        course_code: course.course_code,
        group_name: course.group_name,
        academic_group_id: match?.academic_group_id ?? null,
      }
    })
  }, [detail, coursesResponse])

  const detailByKey = useMemo(() => {
    const entries = new Map<string, CourseDetail>()

    for (const course of detail?.courses ?? []) entries.set(courseKey(course), course)

    return entries
  }, [detail])

  const commentCourses = commentsResponse?.data?.courses

  /** Subjects worth offering: with the filter on, only the ones with findings. */
  const subjectOptions = useMemo(() => {
    if (!onlyWeak) return allSubjects

    return allSubjects.filter((subject) => {
      const dimensions = buildDimensionsFromDetail(
        detailByKey.get(subject.key)?.dimensions,
        catalogue,
        threshold,
      )

      return (
        hasWeakIndicators(dimensions) || countRisky(groupComments(commentCourses, subject.key)) > 0
      )
    })
  }, [allSubjects, onlyWeak, detailByKey, catalogue, threshold, commentCourses])

  const effectiveSubjectKey =
    subjectKey !== SUBJECT_ALL && subjectOptions.some((option) => option.key === subjectKey)
      ? subjectKey
      : SUBJECT_ALL

  const activeSubject = subjectOptions.find((option) => option.key === effectiveSubjectKey) ?? null

  const dimensions = useMemo(() => {
    if (activeSubject) {
      return buildDimensionsFromDetail(
        detailByKey.get(activeSubject.key)?.dimensions,
        catalogue,
        threshold,
      )
    }

    // Teacher-wide the API already computed the matrix, thresholds included.
    if (candidate) return candidate.dimensions

    return buildDimensionsFromDetail(detail?.dimensions, catalogue, threshold)
  }, [activeSubject, detailByKey, catalogue, threshold, candidate, detail])

  const comments = useMemo(
    () => groupComments(commentCourses, activeSubject?.key),
    [commentCourses, activeSubject],
  )

  return {
    allSubjects,
    subjectOptions,
    activeSubject,
    effectiveSubjectKey,
    dimensions,
    comments,
    weakCount: countWeak(dimensions),
    riskyCount: countRisky(comments),
    aiStatus: commentsResponse?.data?.ai_status ?? null,
    hasCommentData: (commentCourses?.length ?? 0) > 0,
    isLoading: detailLoading || commentsLoading,
  }
}

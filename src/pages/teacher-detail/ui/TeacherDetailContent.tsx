import { useMemo, useState } from 'react'

import { TeacherNoEvaluationState, TeacherProfileHeader, useGetTeacherEvaluationDetail } from '@/features/evaluations'
import {
  buildProfessorSummary,
  mapProfessorComments,
  ProfessorCategoryChart,
  ProfessorCategoryDetail,
  TeacherDetailSkeleton,
  useGetTeacherById
} from '@/features/teachers'
import { useSearchParams } from 'wouter'

type Props = {
  teacherId: number
}

function TeacherDetailContent({ teacherId }: Props) {
  const [searchParams] = useSearchParams()
  const period = searchParams.get('period') ?? undefined

  const [categoryId, setCategoryId] = useState<string | null>(null)

  console.log('period', period)

  const teacherQuery = useGetTeacherById(teacherId)
  const departmentId = teacherQuery.data?.data.department_id
  // const dashboardQuery = useGetTeacherDashboard(teacherId, departmentId, period)
  const detailQuery = useGetTeacherEvaluationDetail(teacherId, departmentId, period)

  const summary = useMemo(() => {
    const d = dashboardQuery.data?.data
    if (!d) return null

    const comments = mapProfessorComments(d.comments)
    return buildProfessorSummary(d.period_comparison, comments)
  }, [dashboardQuery.data])

  const selectedCategory =
    categoryId && summary ? (summary.categories.find((c) => c.id === categoryId) ?? null) : null

  const teacherData = teacherQuery.data
  const evaluationDetailData = dashboardQuery.data?.data?.evaluation_detail

  if (teacherQuery.isLoading || dashboardQuery.isLoading) {
    return <TeacherDetailSkeleton />
  }

  return (
    <>
      <TeacherProfileHeader
        teacherId={teacherId}
        teacher={teacherData}
        evaluationDetail={evaluationDetailData}
      />

      {!summary ? (
        <TeacherNoEvaluationState />
      ) : (
        <>
          {selectedCategory ? (
            <ProfessorCategoryDetail
              category={selectedCategory}
              categories={summary.categories}
              comments={summary.comments}
              teacherId={teacherId}
              onBack={() => setCategoryId(null)}
              onSelect={setCategoryId}
            />
          ) : (
            <>
              <ProfessorCategoryChart categories={summary.categories} onSelect={setCategoryId} />
            </>
          )}
        </>
      )}
    </>
  )
}

export default TeacherDetailContent

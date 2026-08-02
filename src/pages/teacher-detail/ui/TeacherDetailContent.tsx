import { useState } from 'react'
import { useSearchParams } from 'wouter'

import TeacherDetailSkeleton from '@/components/skeletons/TeacherDetailSkeleton'
import {
  HistoricalEvolutionCard,
  MatrizCard,
  NoEvaluationState,
  TeacherProfileHeader,
  useCurrentTeacherEvaluation,
} from '@/features/evaluations'
import { TeacherPlanHistorySection } from '@/features/plans'
import {
  ProfessorCategoryChart,
  ProfessorCategoryDetail,
  ProfessorCommentsTable,
  useGetTeacherById,
  useProfessorSummary,
} from '@/features/teachers'

type Props = {
  teacherId: number
}

function TeacherDetailContent({ teacherId }: Props) {
  const { isLoading, isFetching, isFetched } = useGetTeacherById(teacherId)

  const { data: evaluation } = useCurrentTeacherEvaluation(teacherId)

  const [searchParams] = useSearchParams()
  const periodValue = searchParams.get('period')

  const [categoryId, setCategoryId] = useState<string | null>(null)

  const { summary, periods } = useProfessorSummary({
    teacherId,
    periodValue,
    commentsEnabled: true,
  })

  if ((isLoading || isFetching) && !isFetched) {
    return <TeacherDetailSkeleton />
  }

  const noData = !isLoading && !isFetching && !evaluation

  const selectedCategory =
    categoryId && summary ? (summary.categories.find((c) => c.id === categoryId) ?? null) : null

  return (
    <>
      <TeacherProfileHeader teacherId={teacherId} evaluation={evaluation} />

      {noData ? (
        <NoEvaluationState />
      ) : (
        <>
          {evaluation && summary && (
            <>
              {selectedCategory ? (
                <ProfessorCategoryDetail
                  category={selectedCategory}
                  categories={summary.categories}
                  comments={summary.comments}
                  periodValue={periodValue ?? ''}
                  teacherId={teacherId}
                  periods={periods}
                  onBack={() => setCategoryId(null)}
                  onSelect={setCategoryId}
                />
              ) : (
                <>
                  <ProfessorCategoryChart
                    categories={summary.categories}
                    onSelect={setCategoryId}
                  />

                  <MatrizCard teacherId={teacherId} evaluation={evaluation} />

                  <ProfessorCommentsTable
                    comments={summary.comments}
                    categories={summary.categories}
                  />

                  <HistoricalEvolutionCard teacherId={teacherId} evaluation={evaluation} />

                  <TeacherPlanHistorySection teacherId={teacherId} />
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

export default TeacherDetailContent

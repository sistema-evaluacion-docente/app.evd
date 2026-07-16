import { useGetDepartments } from '@/features/departments'
import {
  useGetDimensionAverages,
  useGetEvaluation,
  useGetEvaluationSummary,
} from '@/features/evaluations'

export function useEvaluationDetail(evaluationId: number) {
  const { data: evalRes, isLoading: evalLoading } = useGetEvaluation(evaluationId)
  const evaluation = evalRes?.data

  const { data: summaryRes, isLoading: summaryLoading } = useGetEvaluationSummary(evaluationId)
  const summary = summaryRes?.data

  const { data: dimensionsRes } = useGetDimensionAverages(evaluationId)
  const dimensions = dimensionsRes?.data ?? []

  const { data: deptRes } = useGetDepartments({
    page: 1,
    limit: 100,
  })
  const departments = deptRes?.data ?? []

  const department = departments.find((d) => d.id === evaluation?.department_id)
  const isLoading = evalLoading || summaryLoading
  const noData = !isLoading && !evaluation

  return {
    evaluation,
    summary,
    department,
    dimensions,
    isLoading,
    noData,
  }
}

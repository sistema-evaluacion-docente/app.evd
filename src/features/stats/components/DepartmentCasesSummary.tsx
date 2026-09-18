import { useGetDepartmentCases, useGetDepartmentUploads } from '@/features/departments'
import { CasesSummary } from './CasesSummary'

export interface DepartmentCasesSummaryProps {
  departmentId: number
  /** Academic period the cases are counted in. */
  periodId: number
  className?: string
}

/**
 * Reported cases of one department in one period (`GET /stats/departments/cases`):
 * high-risk comments, plans started and comments the director reclassified.
 * When the department uploaded but the evaluation isn't analysed yet, the
 * zero comments are explained instead of read as "no problems", using the
 * upload state from `GET /stats/departments/uploads`. Renders nothing until
 * both answer.
 *
 * @example
 * <DepartmentCasesSummary departmentId={4} periodId={12} />
 */
export function DepartmentCasesSummary({
  departmentId,
  periodId,
  className,
}: DepartmentCasesSummaryProps) {
  const { data: casesData } = useGetDepartmentCases(periodId)
  const { data: uploadsData } = useGetDepartmentUploads(periodId)

  const cases = casesData?.data?.find((row) => row.department_id === departmentId)
  const upload = uploadsData?.data?.find((row) => row.department_id === departmentId)

  if (!cases) return null

  const notAnalysedYet = upload?.has_uploaded && upload.global_average == null

  return (
    <CasesSummary
      className={className}
      highRiskComments={cases.high_risk_comments}
      plansTotal={cases.plans_total}
      reclassifiedByDirector={cases.risk_reclassified_by_director}
      note={
        notAnalysedYet
          ? 'La evaluación de este periodo aún no está analizada: los comentarios de riesgo se cuentan cuando termina el análisis.'
          : undefined
      }
    />
  )
}

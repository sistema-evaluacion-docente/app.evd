import { useGetDepartmentCases, useGetDepartmentUploads } from '@/features/departments'
import { CasesSummary } from './CasesSummary'

export interface FacultyCasesSummaryProps {
  facultyId: number
  /** Academic period the cases are counted in. */
  periodId: number
  className?: string
}

/**
 * Reported cases of one faculty in one period: the sum over its departments
 * of `GET /stats/departments/cases`. Departments that uploaded evaluations
 * not analysed yet are counted apart, so a low figure isn't read as "no
 * problems". Renders nothing until the answer arrives.
 *
 * @example
 * <FacultyCasesSummary facultyId={1} periodId={12} />
 */
export function FacultyCasesSummary({ facultyId, periodId, className }: FacultyCasesSummaryProps) {
  const { data: casesData } = useGetDepartmentCases(periodId)
  const { data: uploadsData } = useGetDepartmentUploads(periodId)

  const rows = (casesData?.data ?? []).filter((row) => row.faculty_id === facultyId)

  if (!casesData) return null

  const departmentIds = new Set(rows.map((row) => row.department_id))
  const notAnalysed = (uploadsData?.data ?? []).filter(
    (row) => departmentIds.has(row.department_id) && row.has_uploaded && row.global_average == null,
  ).length

  return (
    <CasesSummary
      className={className}
      highRiskComments={rows.reduce((sum, row) => sum + row.high_risk_comments, 0)}
      plansTotal={rows.reduce((sum, row) => sum + row.plans_total, 0)}
      reclassifiedByDirector={rows.reduce((sum, row) => sum + row.risk_reclassified_by_director, 0)}
      note={
        notAnalysed > 0
          ? `${notAnalysed} ${notAnalysed === 1 ? 'departamento subió' : 'departamentos subieron'} evaluaciones que aún no se analizan: sus comentarios de riesgo no se cuentan todavía.`
          : undefined
      }
    />
  )
}

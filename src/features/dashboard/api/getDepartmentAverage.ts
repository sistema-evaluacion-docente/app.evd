import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface DepartmentAverageData {
  global_average: number | null
  total_respondents: number
  evaluation_count: number
  previous_global_average: number | null
  previous_total_respondents: number
  previous_evaluation_count: number
}

/**
 * Fetches the average statistics for a specific department and academic period.
 *
 * @param departmentId - The ID of the department for which to fetch the average statistics.
 * @param academicPeriodId - The ID of the academic period for which to fetch the average statistics.
 * @returns A promise that resolves to a ResponseAPI object containing the DepartmentAverageData.
 */
export default function getDepartmentAverage(
  departmentId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<DepartmentAverageData>> {
  return api.get(`/stats/departments/${departmentId}/average`, {
    params: {
      academic_period_id: academicPeriodId,
    },
  })
}

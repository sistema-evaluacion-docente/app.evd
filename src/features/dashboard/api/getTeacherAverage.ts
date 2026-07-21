import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface TeacherAverageData {
  teacher_id: number
  academic_period_id: number
  academic_period_code: string
  academic_period_name: string | null
  overall_average: number | null
  group_count: number
  previous_academic_period_id: number | null
  previous_academic_period_code: string | null
  previous_academic_period_name: string | null
  previous_overall_average: number | null
  previous_group_count: number | null
}

/**
 * Fetches the average evaluation data for a specific teacher and academic period.
 *
 * @param teacherId - The ID of the teacher for whom to fetch the average evaluation data.
 * @param academicPeriodId - The ID of the academic period for which to fetch the average evaluation data.
 * @returns A promise that resolves to a ResponseAPI object containing the TeacherAverageData.
 */
export default function getTeacherAverage(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherAverageData>> {
  return api.get(`/stats/teachers/${teacherId}/average`, {
    params: {
      academic_period_id: academicPeriodId,
    },
  })
}

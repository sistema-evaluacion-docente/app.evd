import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface TeacherDimensionAverageItem {
  dimension: string
  average: number | null
  percentage: number | null
}

export interface TeacherDimensionAveragesData {
  teacher_id: number
  academic_period_id: number
  dimensions: TeacherDimensionAverageItem[]
}

/**
 * Fetches the average evaluation data for each dimension of a specific teacher and academic period.
 *
 * @param teacherId - The ID of the teacher for whom to fetch the dimension averages.
 * @param academicPeriodId - The ID of the academic period for which to fetch the dimension averages.
 * @returns A promise that resolves to a ResponseAPI object containing the TeacherDimensionAveragesData.
 */
export default function getTeacherDimensionAverages(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherDimensionAveragesData>> {
  return api.get(`/stats/teachers/${teacherId}/dimensions`, {
    params: {
      academic_period_id: academicPeriodId,
    },
  })
}

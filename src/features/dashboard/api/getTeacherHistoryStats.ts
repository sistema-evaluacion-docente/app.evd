import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface TeacherHistoryEntry {
  period_code: string
  period_name: string | null
  overall_average: number | null
}

/**
 * Fetches the historical evaluation data for a specific teacher.
 *
 * @param teacherId - The ID of the teacher for whom to fetch the historical evaluation data.
 * @returns A promise that resolves to a ResponseAPI object containing an array of TeacherHistoryEntry.
 */
export default function getTeacherHistoryStats(
  teacherId: number,
): Promise<ResponseAPI<TeacherHistoryEntry[]>> {
  return api.get(`/stats/teachers/${teacherId}/history`)
}

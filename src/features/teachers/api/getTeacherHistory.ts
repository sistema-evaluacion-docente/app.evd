import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { TeacherHistoryData } from '../types/Teacher'

/**
 * Fetches the history of a teacher by their ID.
 *
 * @param id - The ID of the teacher whose history is to be fetched.
 * @returns A promise that resolves to the teacher's history data wrapped in a ResponseAPI object.
 */
export default function getTeacherHistory(id: number): Promise<ResponseAPI<TeacherHistoryData>> {
  return api.get(`/teachers/${id}/history`)
}

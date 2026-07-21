import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface TeacherCommentSubjectItem {
  course_code: string
  course_name: string | null
  faculty_name: string | null
  comment_count: number
}

export interface TeacherCommentsBySubjectData {
  teacher_id: number
  academic_period_id: number
  total_comments: number
  subjects: TeacherCommentSubjectItem[]
}

/**
 * Fetches the comments data for a specific teacher and academic period, grouped by subject.
 * @param teacherId - The ID of the teacher for whom to fetch the comments data.
 * @param academicPeriodId - The ID of the academic period for which to fetch the comments data.
 * @returns A promise that resolves to a ResponseAPI object containing the TeacherCommentsBySubjectData.
 */
export default function getTeacherCommentsBySubject(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherCommentsBySubjectData>> {
  return api.get(`/stats/teachers/${teacherId}/comments`, {
    params: {
      academic_period_id: academicPeriodId,
    },
  })
}

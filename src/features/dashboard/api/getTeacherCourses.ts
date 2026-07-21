import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface TeacherCourseItem {
  course_code: string
  course_name: string | null
  group_name: string | null
  overall_average: number | null
}

/**
 * Fetches the courses taught by a specific teacher during a given academic period.
 *
 * @param teacherId - The ID of the teacher for whom to fetch the courses.
 * @param academicPeriodId - The ID of the academic period for which to fetch the courses.
 * @returns A promise that resolves to a ResponseAPI object containing an array of TeacherCourseItem.
 */
export default function getTeacherCourses(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherCourseItem[]>> {
  return api.get(`/stats/teachers/${teacherId}/courses`, {
    params: {
      academic_period_id: academicPeriodId,
    },
  })
}

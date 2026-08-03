import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { TeacherDashboardData } from '../types/Teacher'

export default function getTeacherDashboard(
  teacherId: number,
  departmentId?: number,
  period?: string,
): Promise<ResponseAPI<TeacherDashboardData>> {
  return api.get(`/teachers/${teacherId}/dashboard`, {
    params: departmentId ? { department_id: departmentId, period_name: period } : undefined,
  })
}

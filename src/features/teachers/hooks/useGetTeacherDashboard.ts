import { useQuery } from '@tanstack/react-query'
import getTeacherDashboard from '../api/getTeacherDashboard'

export default function useGetTeacherDashboard(
  teacherId: number,
  departmentId?: number,
  period?: string,
) {
  return useQuery({
    queryKey: ['teacher-dashboard', teacherId, departmentId, period],
    queryFn: () => getTeacherDashboard(teacherId, departmentId, period),
    enabled: !!teacherId && !!departmentId && !!period,
    staleTime: 2 * 60 * 1000,
  })
}

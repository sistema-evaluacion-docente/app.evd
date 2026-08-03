import { useQuery } from '@tanstack/react-query'
import { getTeacherVsPreviousPeriod } from '../api/evaluationService'

export default function useGetTeacherVsPreviousPeriod(
  teacherId: number,
  academicPeriodId: number | undefined,
) {
  return useQuery({
    queryKey: ['teacher-vs-previous-period', teacherId, academicPeriodId],
    queryFn: () => getTeacherVsPreviousPeriod(teacherId, academicPeriodId!),
    enabled: !!teacherId && !!academicPeriodId,
    staleTime: 5 * 60 * 1000,
  })
}

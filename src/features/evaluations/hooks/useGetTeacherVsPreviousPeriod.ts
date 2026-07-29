import { useQuery } from '@tanstack/react-query'
import { getTeacherVsPreviousPeriod } from '../api/evaluationService'

/**
 * Custom hook to fetch the comparison data between a teacher's current period and their previous period.
 *
 * @param teacherId - The ID of the teacher.
 * @param academicPeriodId - The ID of the current academic period.
 * @returns An object containing the query result, including data, loading state, and error state.
 */
export default function useGetTeacherVsPreviousPeriod(
  teacherId: number,
  academicPeriodId: number | undefined,
) {
  return useQuery({
    queryKey: ['teacher-vs-previous-period', teacherId, academicPeriodId],
    queryFn: () => getTeacherVsPreviousPeriod(teacherId, academicPeriodId!),
    enabled: !!teacherId && !!academicPeriodId,
  })
}

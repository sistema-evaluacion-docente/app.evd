import { useQuery } from '@tanstack/react-query'
import { getTeacherComments } from '../api/evaluationService'

interface UseGetTeacherCommentsOptions {
  enabled?: boolean
}

/**
 * Custom hook to fetch teacher comments for a specific evaluation and teacher.
 *
 * @param evaluationId - The ID of the evaluation to fetch comments for.
 * @param teacherId - The ID of the teacher whose comments are being fetched.
 * @param options - Optional configuration for the query, including whether it is enabled.
 * @returns The result of the query, including data, error, and loading state.
 */
export default function useGetTeacherComments(
  evaluationId: number | undefined,
  teacherId: number,
  options?: UseGetTeacherCommentsOptions,
) {
  return useQuery({
    queryKey: ['teacher-comments', evaluationId, teacherId],
    queryFn: () => getTeacherComments(evaluationId!, teacherId),
    enabled: !!evaluationId && !!teacherId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  })
}

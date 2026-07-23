import { useQuery } from '@tanstack/react-query'
import getTeacherHistory from '../api/getTeacherHistory'

/**
 * Custom hook to fetch the history of a teacher based on their ID.
 *
 * @param {number} id - The ID of the teacher whose history is to be fetched.
 * @returns {object} - The result of the query, including data, loading state, and error state.
 */
export default function useGetTeacherHistory(id: number) {
  return useQuery({
    queryKey: ['teacher-history', id],
    queryFn: () => getTeacherHistory(id),
    enabled: !!id && id > 0,
  })
}

import { useQuery } from '@tanstack/react-query'
import getTeacherHistory, { type HistorySortBy } from '../api/getTeacherHistory'

/**
 * Custom hook to fetch the history of a teacher based on their ID.
 *
 * @param id - The ID of the teacher whose history is to be fetched.
 * @param sortBy - Optional server-side sort order.
 * @returns {object} - The result of the query, including data, loading state, and error state.
 */
export default function useGetTeacherHistory(id: number, sortBy?: HistorySortBy) {
  return useQuery({
    queryKey: ['teacher-history', id, sortBy],
    queryFn: () => getTeacherHistory(id, sortBy),
    enabled: !!id && id > 0,
  })
}

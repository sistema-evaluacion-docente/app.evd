import { useQuery } from '@tanstack/react-query'
import getTeacherHistory, { type HistorySortBy } from '../api/getTeacherHistory'

export default function useGetTeacherHistory(id: number, sortBy?: HistorySortBy) {
  return useQuery({
    queryKey: ['teacher-history', id, sortBy],
    queryFn: () => getTeacherHistory(id, sortBy),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  })
}

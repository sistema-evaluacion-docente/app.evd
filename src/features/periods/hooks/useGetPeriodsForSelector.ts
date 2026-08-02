import { useQuery } from '@tanstack/react-query'
import getPeriods from '../api/getPeriods'

const FIVE_MINUTES = 5 * 60 * 1000

export default function useGetPeriodsForSelector() {
  return useQuery({
    queryKey: ['periods', 1, 100, ''],
    queryFn: () => getPeriods({ page: 1, limit: 100, search: '' }),
    staleTime: FIVE_MINUTES,
    refetchOnWindowFocus: false,
  })
}

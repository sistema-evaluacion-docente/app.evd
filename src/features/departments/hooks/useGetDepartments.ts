import { useQuery } from '@tanstack/react-query'
import getDepartments from '../api/getDepartments'

export default function useGetDepartments({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number
  limit?: number
  search?: string
}) {
  return useQuery({
    queryKey: ['departments', page, limit, search],
    queryFn: () => getDepartments({ page, limit, search }),
  })
}

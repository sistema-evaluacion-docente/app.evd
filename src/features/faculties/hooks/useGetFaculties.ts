import { useQuery } from '@tanstack/react-query'
import getFaculties from '../api/getFaculties'

export default function useGetFaculties({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number
  limit?: number
  search?: string
}) {
  return useQuery({
    queryKey: ['faculties', page, limit, search],
    queryFn: () => getFaculties({ page, limit, search }),
  })
}

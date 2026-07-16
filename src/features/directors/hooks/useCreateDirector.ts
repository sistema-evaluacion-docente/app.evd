import { useMutation, useQueryClient } from '@tanstack/react-query'

import createDirector from '../api/createDirector'
import type { CreateDirectorPayload } from '../api/createDirector'

/**
 * Custom hook to create a new director and invalidate the directors query upon success.
 * @returns A mutation object that can be used to trigger the creation of a director.
 */
export default function useCreateDirector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDirectorPayload) => createDirector(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directors'] })
    },
  })
}

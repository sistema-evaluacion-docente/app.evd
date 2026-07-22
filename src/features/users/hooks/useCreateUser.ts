import { useMutation, useQueryClient } from '@tanstack/react-query'
import createUser from '../api/createUser'

/**
 * Custom hook to create a new user.
 * Uses React Query's useMutation to handle the creation process and cache invalidation.
 *
 * @returns {object} - An object containing the mutation function and its state.
 */
export default function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import createPeriod from '../api/createPeriod'

/**
 * Custom hook to create a new period.
 *
 * This hook uses the `useMutation` hook from React Query to handle the creation of a new period.
 * It provides a mutation function that can be called to create a period and automatically invalidates
 * the 'periods' query upon successful creation, ensuring that the list of periods is updated.
 *
 * @returns {object} An object containing the mutation function and its state.
 */
export default function useCreatePeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
    },
  })
}

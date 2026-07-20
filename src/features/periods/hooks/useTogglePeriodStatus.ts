import { useMutation, useQueryClient } from '@tanstack/react-query'
import togglePeriodStatus from '../api/togglePeriodStatus'

/**
 * Custom hook to toggle the status of a period (active/inactive).
 * It uses React Query's useMutation to handle the mutation and cache invalidation.
 *
 * @returns An object containing the mutation function and its state.
 */
export default function useTogglePeriodStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: togglePeriodStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
    },
  })
}

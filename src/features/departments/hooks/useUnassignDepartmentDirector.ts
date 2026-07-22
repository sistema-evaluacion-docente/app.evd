import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import unassignDepartmentDirector from '../api/unassignDepartmentDirector'

/**
 * Hook to unassign a director from a department.
 *
 * @returns {Object} An object containing the mutation function and its state.
 */
export default function useUnassignDepartmentDirector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unassignDepartmentDirector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Director desasignado exitosamente')
    },
    onError: (error) => {
      toast.error(error.message || 'Error al desasignar el director')
    },
  })
}

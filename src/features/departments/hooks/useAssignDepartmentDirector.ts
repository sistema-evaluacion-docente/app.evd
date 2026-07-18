import { useMutation, useQueryClient } from '@tanstack/react-query'

import assignDepartmentDirector from '../api/assignDepartmentDirector'
import { toast } from 'sonner'

/**
 * Custom hook to assign a director to a department.
 * @returns A mutation object that can be used to trigger the assignment of a director to a department.
 */
export default function useAssignDepartmentDirector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignDepartmentDirector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Director asignado exitosamente')
    },
    onError: (error) => {
      toast.error(error.message || 'Error al asignar el director')
    },
  })
}

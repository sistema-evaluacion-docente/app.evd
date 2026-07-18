import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import deletePeriod from '../api/deletePeriod'

/**
 * Custom hook to delete a period by its ID.
 * @returns An object containing the mutation function and its state.
 */
export default function useDeletePeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePeriod,
    onSuccess: (data) => {
      if (data?.status !== 200) {
        toast.error(`${data?.message}`)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['periods'] })
      toast.success('Periodo eliminado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar el periodo: ${error.message}`)
    },
  })
}

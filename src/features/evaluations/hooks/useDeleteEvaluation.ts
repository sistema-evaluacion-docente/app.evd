import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteEvaluation } from '../api/evaluationService'

interface UseDeleteEvaluationOptions {
  onSettled?: () => void
}

/**
 * Custom hook for deleting an evaluation.
 *
 * @param {UseDeleteEvaluationOptions} options - Optional configuration for the mutation.
 * @returns {object} An object containing the mutation function and its state.
 */
export default function useDeleteEvaluation(options?: UseDeleteEvaluationOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (evaluationId: number) => deleteEvaluation(evaluationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      toast.success('Evaluación eliminada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar la evaluación: ${error.message}`)
    },
    onSettled: () => {
      options?.onSettled?.()
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { analyzeEvaluation } from '../api/evaluationService'

/**
 * Custom hook to analyze an evaluation with AI.
 *
 * @returns {object} - The result of the mutation, including the analysis function and related state.
 */
export default function useAnalyzeEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (evaluationId: number) => analyzeEvaluation(evaluationId),
    onSuccess: (_data, evaluationId) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation', evaluationId] })
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      toast.success('Análisis de IA iniciado correctamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al iniciar el análisis: ${error.message}`)
    },
  })
}

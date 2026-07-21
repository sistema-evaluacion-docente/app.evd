import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { EvaluationComment } from '../types/Comment'
import type { EvaluationRecord, EvaluationScore, EvaluationStatusUpdate } from '../types/Evaluation'
import type { QuestionItem, QuestionScore } from '../types/Question'
import type {
  EvaluationDimensionAverage,
  EvaluationSummary,
  TeacherCommentsData,
  TeacherEvaluationDetail,
} from '../types/TeacherEvaluation'

export type { AiStatus } from '../types/Evaluation'

export function uploadEvaluation(file: File): Promise<ResponseAPI<EvaluationRecord>> {
  const form = new FormData()
  form.append('file', file)
  return api.post('/evaluations/upload', form, {
    headers: { 'Content-Type': undefined },
  })
}

export function getEvaluation(id: number): Promise<ResponseAPI<EvaluationRecord>> {
  return api.get(`/evaluations/${id}`)
}

export function getEvaluationByPeriod(periodId: number): Promise<ResponseAPI<EvaluationRecord>> {
  return api.get(`/evaluations/by-period/${periodId}`)
}

export function getEvaluationScores(evaluationId: number): Promise<ResponseAPI<EvaluationScore[]>> {
  return api.get(`/evaluation-scores/by-evaluation/${evaluationId}`)
}

export function getEvaluationScoresPaginated(
  evaluationId: number,
  page: number,
  limit: number,
  search: string,
): Promise<ResponseAPI<EvaluationScore[]>> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (search) params.set('search', search)
  return api.get(`/evaluation-scores/by-evaluation/${evaluationId}?${params.toString()}`)
}

export function getQuestionScores(scoreId: number): Promise<ResponseAPI<QuestionScore[]>> {
  return api.get(`/evaluation-question-scores/by-evaluation-score/${scoreId}`)
}

export function getComments(evaluationId: number): Promise<ResponseAPI<EvaluationComment[]>> {
  return api.get(`/comments?evaluation_id=${evaluationId}`)
}

export function getCommentsPaginated(
  evaluationId: number,
  page: number,
  limit: number,
  search: string,
): Promise<ResponseAPI<EvaluationComment[]>> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (search) params.set('search', search)
  return api.get(`/comments?evaluation_id=${evaluationId}&${params.toString()}`)
}

export function getTeacherEvaluationDetail(
  evaluationId: number,
  teacherId: number,
): Promise<ResponseAPI<TeacherEvaluationDetail>> {
  return api.get(`/evaluations/${evaluationId}/teachers/${teacherId}`)
}

export function getTeacherComments(
  evaluationId: number,
  teacherId: number,
): Promise<ResponseAPI<TeacherCommentsData>> {
  return api.get(`/evaluations/${evaluationId}/teachers/${teacherId}/comments`)
}

export interface TeacherVsDeptQuestion {
  code: string
  text: string
  teacher_average: number
  department_average: number
}

export interface TeacherVsDeptDimension {
  dimension: string
  teacher_average: number
  department_average: number
  questions: TeacherVsDeptQuestion[]
}

export interface TeacherVsDeptData {
  teacher_id: number
  academic_period_id: number
  academic_period_code: string
  department_id: number
  department_name: string
  department_overall_average: number
  dimensions: TeacherVsDeptDimension[]
}

/**
 * Fetches the comparison data between a specific teacher and their department for a given academic period.
 *
 * @param teacherId - The ID of the teacher for whom to fetch the comparison data.
 * @param academicPeriodId - The ID of the academic period for which to fetch the comparison data.
 * @returns A promise that resolves to a ResponseAPI object containing the TeacherVsDeptData.
 */
export function getTeacherVsDepartment(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherVsDeptData>> {
  return api.get(`/stats/teachers/${teacherId}/comparison`, {
    params: { academic_period_id: academicPeriodId },
  })
}

export interface TeacherMatrixCourseItem {
  course_name: string
  question_averages: Record<string, number>
  overall_average: number
}

export interface TeacherMatrixData {
  teacher_id: number
  evaluation_id: number
  courses: TeacherMatrixCourseItem[]
  column_averages: Record<string, number>
}

/**
 * Fetches the matrix data for a specific teacher and evaluation.
 *
 * @param teacherId - The ID of the teacher for whom to fetch the matrix data.
 * @param evaluationId - The ID of the evaluation for which to fetch the matrix data.
 * @returns A promise that resolves to a ResponseAPI object containing the TeacherMatrixData.
 */
export function getTeacherMatrix(
  teacherId: number,
  evaluationId: number,
): Promise<ResponseAPI<TeacherMatrixData>> {
  return api.get(`/stats/teachers/${teacherId}/matrix`, {
    params: { evaluation_id: evaluationId },
  })
}

/**
 * Exports the matrix data for a specific teacher and evaluation as a Blob.
 *
 * @param evaluationId - The ID of the evaluation for which to export the matrix data.
 * @param teacherId - The ID of the teacher for whom to export the matrix data.
 * @param includeComments - A boolean indicating whether to include comments in the exported data.
 * @returns A promise that resolves to a Blob containing the exported matrix data.
 */
export function exportTeacherMatrix(
  evaluationId: number,
  teacherId: number,
  includeComments: boolean,
): Promise<Blob> {
  const params = includeComments ? '?include_comments=true' : ''
  return api.get(`/evaluations/${evaluationId}/teachers/${teacherId}/export${params}`, {
    responseType: 'blob',
  }) as unknown as Promise<Blob>
}

export function analyzeEvaluation(id: number): Promise<ResponseAPI<{ message: string }>> {
  return api.post(`/evaluations/${id}/analyze`)
}

/**
 * Fetches the AI analysis result for a specific evaluation.
 *
 * @param evaluationId - The ID of the evaluation for which to fetch the AI analysis result.
 * @returns A promise that resolves to a ResponseAPI object containing the AI analysis result.
 */
export function updateEvaluationStatus(
  evaluationId: number,
  payload: EvaluationStatusUpdate,
): Promise<ResponseAPI<EvaluationRecord>> {
  return api.patch(`/evaluations/${evaluationId}/status`, payload)
}

/**
 * Fetches the summary data for a specific evaluation.
 *
 * @param evaluationId - The ID of the evaluation for which to fetch the summary data.
 * @returns A promise that resolves to a ResponseAPI object containing the EvaluationSummary.
 */
export function getEvaluationSummary(
  evaluationId: number,
): Promise<ResponseAPI<EvaluationSummary>> {
  return api.get(`/evaluations/${evaluationId}/summary`)
}

/**
 * Fetches the average scores for each dimension of a specific evaluation.
 *
 * @param evaluationId - The ID of the evaluation for which to fetch the dimension averages.
 * @returns A promise that resolves to a ResponseAPI object containing an array of EvaluationDimensionAverage.
 */
export function getDimensionAverages(
  evaluationId: number,
): Promise<ResponseAPI<EvaluationDimensionAverage[]>> {
  return api.get(`/evaluations/${evaluationId}/dimension-averages`)
}

/**
 * Fetches the list of questions for evaluations.
 *
 * @returns A promise that resolves to a ResponseAPI object containing an array of QuestionItem.
 */
export function getQuestions(): Promise<ResponseAPI<QuestionItem[]>> {
  return api.get('/evaluations/questions')
}

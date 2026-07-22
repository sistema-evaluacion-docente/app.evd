export type {
  AiStatus,
  EvaluationRecord,
  EvaluationScore,
  EvaluationStatusUpdate,
} from './types/Evaluation'

export type { QuestionDetail, QuestionItem, QuestionScore } from './types/Question'

export type {
  CommentItem,
  EvaluationComment,
  PedagogicalCategory,
  RiskLevel,
} from './types/Comment'

export type {
  EvaluationDimensionAverage,
  EvaluationDimensionScore,
  EvaluationSummary,
  TeacherCommentCourse,
  TeacherCommentsData,
  TeacherCourse,
  TeacherEvaluationDetail,
  TeacherRankItem,
} from './types/TeacherEvaluation'

export {
  analyzeEvaluation,
  deleteEvaluation,
  exportTeacherMatrix,
  getComments,
  getCommentsPaginated,
  getDimensionAverages,
  getEvaluation,
  getEvaluationByPeriod,
  getEvaluationScores,
  getEvaluationScoresPaginated,
  getEvaluationSummary,
  getQuestions,
  getQuestionScores,
  getTeacherComments,
  getTeacherEvaluationDetail,
  getTeacherMatrix,
  getTeacherVsDepartment,
  updateEvaluationStatus,
  uploadEvaluation,
} from './api/evaluationService'

export type {
  TeacherMatrixCourseItem,
  TeacherMatrixData,
  TeacherVsDeptData,
  TeacherVsDeptDimension,
  TeacherVsDeptQuestion,
} from './api/evaluationService'

export { default as CourseAveragesCard } from './components/CourseAveragesCard'
export { default as DimensionAveragesCard } from './components/DimensionAveragesCard'
export { default as HistoricalEvolutionCard } from './components/HistoricalEvolutionCard'
export { default as MatrizCard } from './components/MatrizCard'
export { default as NoEvaluationState } from './components/NoEvaluationState'
export { default as TeacherCommentsCard } from './components/TeacherCommentsCard'
export { default as TeacherProfileHeader } from './components/TeacherProfileHeader'
export { default as useAnalyzeEvaluation } from './hooks/useAnalyzeEvaluation'
export { default as useCurrentTeacherEvaluation } from './hooks/useCurrentTeacherEvaluation'
export { default as useDeleteEvaluation } from './hooks/useDeleteEvaluation'
export { default as useEvaluationColumns } from './hooks/useEvaluationColumns'
export { useEvaluationWebSocket } from './hooks/useEvaluationWebSocket'
export type {
  EvaluationLogEvent,
  EvaluationProgressEvent,
  EvaluationWsEvent,
  WsConnectionStatus,
} from './hooks/useEvaluationWebSocket'
export { default as useGetComments } from './hooks/useGetComments'
export { default as useGetCommentsPaginated } from './hooks/useGetCommentsPaginated'
export { default as useGetDimensionAverages } from './hooks/useGetDimensionAverages'
export { default as useGetEvaluation } from './hooks/useGetEvaluation'
export { default as useGetEvaluationByPeriod } from './hooks/useGetEvaluationByPeriod'
export { default as useGetEvaluations } from './hooks/useGetEvaluations'
export { default as useGetEvaluationScores } from './hooks/useGetEvaluationScores'
export { default as useGetEvaluationScoresPaginated } from './hooks/useGetEvaluationScoresPaginated'
export { default as useGetEvaluationSummary } from './hooks/useGetEvaluationSummary'
export { default as useGetQuestions } from './hooks/useGetQuestions'
export { default as useGetTeacherComments } from './hooks/useGetTeacherComments'
export { default as useGetTeacherEvaluationDetail } from './hooks/useGetTeacherEvaluationDetail'
export { default as useGetTeacherMatrix } from './hooks/useGetTeacherMatrix'
export { default as useGetTeacherVsDepartment } from './hooks/useGetTeacherVsDepartment'
export { default as useUpdateEvaluationStatus } from './hooks/useUpdateEvaluationStatus'
export { useUploadEvaluation, type UploadStatus } from './hooks/useUploadEvaluation'

export { ActiveBadge } from './components/ActiveBadge'
export { CommentsTable } from './components/CommentsTable'
export { DeleteEvaluationDialog } from './components/DeleteEvaluationDialog'
export { DimensionOverview } from './components/DimensionOverview'
export { FloatingLogs } from './components/FloatingLogs'
export { GeneralInfoCard } from './components/GeneralInfoCard'
export { NotFoundState } from './components/NotFoundState'
export { ScoreBarInline, ScoreColor } from './components/ScoreBarInline'
export { ScoresByGroup } from './components/ScoresByGroup'
export { StatusBadge } from './components/StatusBadge'
export { SummaryStats } from './components/SummaryStats'
export { TeacherRankingTable } from './components/TeacherRankingTable'
export { UploadDropzone } from './components/UploadDropzone'
export { UploadStats } from './components/UploadStats'
export { UploadStatusCard } from './components/UploadStatusCard'
export { EvaluationLogsProvider, useEvaluationLogsContext } from './context/EvaluationLogsContext'

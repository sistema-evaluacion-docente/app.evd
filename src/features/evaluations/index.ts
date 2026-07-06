export type {
  EvaluationRecord,
  EvaluationScore,
  EvaluationStatusUpdate,
} from "./types/Evaluation";

export type {
  QuestionItem,
  QuestionScore,
  QuestionDetail,
} from "./types/Question";

export type { EvaluationComment } from "./types/Comment";

export type {
  TeacherRankItem,
  EvaluationSummary,
  EvaluationDimensionScore,
  EvaluationDimensionAverage,
  TeacherCourse,
  TeacherEvaluationDetail,
  TeacherCommentCourse,
  TeacherCommentsData,
} from "./types/TeacherEvaluation";

export {
  uploadEvaluation,
  getEvaluation,
  getEvaluationScores,
  getEvaluationScoresPaginated,
  getQuestionScores,
  getComments,
  getCommentsPaginated,
  updateEvaluationStatus,
  getTeacherEvaluationDetail,
  getTeacherComments,
  exportTeacherMatrix,
  getEvaluationSummary,
  getDimensionAverages,
  getQuestions,
} from "./api/evaluationService";

export {
  useUploadEvaluation,
  type UploadStatus,
} from "./hooks/useUploadEvaluation";
export { default as useGetEvaluations } from "./hooks/useGetEvaluations";
export { default as useGetEvaluation } from "./hooks/useGetEvaluation";
export { default as useGetEvaluationSummary } from "./hooks/useGetEvaluationSummary";
export { default as useGetEvaluationScores } from "./hooks/useGetEvaluationScores";
export { default as useGetEvaluationScoresPaginated } from "./hooks/useGetEvaluationScoresPaginated";
export { default as useGetQuestions } from "./hooks/useGetQuestions";
export { default as useEvaluationColumns } from "./hooks/useEvaluationColumns";
export { default as useUpdateEvaluationStatus } from "./hooks/useUpdateEvaluationStatus";
export { default as useGetTeacherEvaluationDetail } from "./hooks/useGetTeacherEvaluationDetail";
export { default as useGetComments } from "./hooks/useGetComments";
export { default as useGetCommentsPaginated } from "./hooks/useGetCommentsPaginated";
export { default as useGetDimensionAverages } from "./hooks/useGetDimensionAverages";
export { default as useGetTeacherComments } from "./hooks/useGetTeacherComments";
export { default as useCurrentTeacherEvaluation } from "./hooks/useCurrentTeacherEvaluation";

export { default as TeacherProfileHeader } from "./components/TeacherProfileHeader";
export { default as DimensionAveragesCard } from "./components/DimensionAveragesCard";
export { default as CourseAveragesCard } from "./components/CourseAveragesCard";
export { default as TeacherCommentsCard } from "./components/TeacherCommentsCard";
export { default as HistoricalEvolutionCard } from "./components/HistoricalEvolutionCard";
export { default as ImprovementPlanCard } from "./components/ImprovementPlanCard";
export { default as NoEvaluationState } from "./components/NoEvaluationState";

export { ActiveBadge } from "./components/ActiveBadge";
export { CommentsTable } from "./components/CommentsTable";
export { DimensionOverview } from "./components/DimensionOverview";
export { GeneralInfoCard } from "./components/GeneralInfoCard";
export { NotFoundState } from "./components/NotFoundState";
export { ScoreBarInline, ScoreColor } from "./components/ScoreBarInline";
export { ScoresByGroup } from "./components/ScoresByGroup";
export { StatusBadge } from "./components/StatusBadge";
export { SummaryStats } from "./components/SummaryStats";
export { TeacherRankingTable } from "./components/TeacherRankingTable";

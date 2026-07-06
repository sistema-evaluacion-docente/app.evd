export type {
  EvaluationRecord,
  EvaluationScore,
  QuestionScore,
  EvaluationComment,
  QuestionDetail,
  QuestionItem,
  TeacherRankItem,
  EvaluationSummary,
  EvaluationDimensionScore,
  EvaluationDimensionAverage,
  TeacherCourse,
  TeacherEvaluationDetail,
  TeacherCommentCourse,
  TeacherCommentsData,
} from "./api/evaluationService";

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

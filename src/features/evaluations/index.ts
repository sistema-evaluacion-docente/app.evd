export type {
  EvaluationRecord,
  EvaluationScore,
  QuestionScore,
  EvaluationComment,
  QuestionDetail,
  EvaluationDimensionScore,
  TeacherCourse,
  TeacherEvaluationDetail,
  TeacherCommentCourse,
  TeacherCommentsData,
} from "./api/evaluationService";

export {
  uploadEvaluation,
  getEvaluation,
  getEvaluationScores,
  getQuestionScores,
  getComments,
  updateEvaluationStatus,
  getTeacherEvaluationDetail,
  getTeacherComments,
  exportTeacherMatrix,
  getTeacherVsDepartment,
} from "./api/evaluationService";

export type {
  TeacherVsDeptData,
  TeacherVsDeptDimension,
  TeacherVsDeptQuestion,
} from "./api/evaluationService";

export {
  useUploadEvaluation,
  type UploadStatus,
} from "./hooks/useUploadEvaluation";
export { default as useGetEvaluations } from "./hooks/useGetEvaluations";
export { default as useEvaluationColumns } from "./hooks/useEvaluationColumns";
export { default as useUpdateEvaluationStatus } from "./hooks/useUpdateEvaluationStatus";
export { default as useGetTeacherEvaluationDetail } from "./hooks/useGetTeacherEvaluationDetail";
export { default as useGetComments } from "./hooks/useGetComments";
export { default as useGetTeacherComments } from "./hooks/useGetTeacherComments";
export { default as useGetTeacherVsDepartment } from "./hooks/useGetTeacherVsDepartment";

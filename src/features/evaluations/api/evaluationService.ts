import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface EvaluationRecord {
  id: number;
  user_id: string;
  academic_period_id: number;
  department_id: number;
  pdf_url: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  count: number | null;
  academic_period_name?: string;
  active: boolean;
}

export interface EvaluationStatusUpdate {
  active: boolean;
}

export interface EvaluationScore {
  id: number;
  evaluation_id: number;
  academic_group_id: number;
  respondent_count: number;
  overall_average: string;
}

export interface QuestionScore {
  evaluation_score_id: number;
  question_code: string;
  score: string;
}

export interface EvaluationComment {
  teacher_id: number;
  evaluation_id: number;
  academic_groups_id: number;
  original_text: string;
}

export function uploadEvaluation(
  file: File,
): Promise<ResponseAPI<EvaluationRecord>> {
  const form = new FormData();
  form.append("file", file);
  // Content-Type: undefined removes the default 'application/json' header so
  // the browser can set 'multipart/form-data; boundary=...' automatically.
  return api.post("/evaluations/upload", form, {
    headers: { "Content-Type": undefined },
  });
}

export function getEvaluation(
  id: number,
): Promise<ResponseAPI<EvaluationRecord>> {
  return api.get(`/evaluations/${id}`);
}

export function getEvaluationScores(
  evaluationId: number,
): Promise<ResponseAPI<EvaluationScore[]>> {
  return api.get(`/evaluation-scores/by-evaluation/${evaluationId}`);
}

export function getQuestionScores(
  scoreId: number,
): Promise<ResponseAPI<QuestionScore[]>> {
  return api.get(`/evaluation-question-scores/by-evaluation-score/${scoreId}`);
}

export function getComments(
  evaluationId: number,
): Promise<ResponseAPI<EvaluationComment[]>> {
  return api.get(`/comments/by-evaluation/${evaluationId}`);
}

export interface EvaluationDimensionScore {
  dimension: string;
  average: number;
}

export interface TeacherCourse {
  course_code: string;
  course_name: string;
  group_name: string;
  respondent_count: number;
  overall_average: number;
  dimensions: EvaluationDimensionScore[];
}

export interface TeacherEvaluationDetail {
  teacher_id: number;
  institutional_code: string;
  name: string;
  contract_type: string;
  evaluation_id: number;
  period_code: string;
  period_name: string;
  overall_average: number;
  group_count: number;
  courses: TeacherCourse[];
  dimensions: EvaluationDimensionScore[];
}

export function getTeacherEvaluationDetail(
  evaluationId: number,
  teacherId: number,
): Promise<ResponseAPI<TeacherEvaluationDetail>> {
  return api.get(`/evaluations/${evaluationId}/teachers/${teacherId}`);
}

export function updateEvaluationStatus(
  evaluationId: number,
  payload: EvaluationStatusUpdate,
): Promise<ResponseAPI<EvaluationRecord>> {
  return api.patch(`/evaluations/${evaluationId}/status`, payload);
}

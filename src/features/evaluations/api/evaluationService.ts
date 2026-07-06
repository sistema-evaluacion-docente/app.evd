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
  group_name: string | null;
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
  group_name: string | null;
  teacher_name: string | null;
  teacher_avatar_url: string | null;
  course_name: string | null;
  original_text: string;
}

export interface QuestionItem {
  code: string;
  text: string;
  dimension: string;
}

export interface TeacherRankItem {
  rank: number;
  teacher_id: number;
  institutional_code: string;
  name: string | null;
  contract_type: string | null;
  group_count: number;
  overall_average: number | null;
}

export interface EvaluationSummary {
  evaluation_id: number;
  period_code: string | null;
  period_name: string | null;
  department_average: number | null;
  teacher_count: number;
  best_teacher: TeacherRankItem | null;
  worst_teacher: TeacherRankItem | null;
  ranking: TeacherRankItem[];
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

export function getEvaluationScoresPaginated(
  evaluationId: number,
  page: number,
  limit: number,
  search: string,
): Promise<ResponseAPI<EvaluationScore[]>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search) params.set("search", search);
  return api.get(
    `/evaluation-scores/by-evaluation/${evaluationId}?${params.toString()}`,
  );
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

export function getCommentsPaginated(
  evaluationId: number,
  page: number,
  limit: number,
  search: string,
): Promise<ResponseAPI<EvaluationComment[]>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search) params.set("search", search);
  return api.get(
    `/comments/by-evaluation/${evaluationId}/paginated?${params.toString()}`,
  );
}

export interface QuestionDetail {
  id: number;
  code: string;
  text: string;
  score: number;
}

export interface EvaluationDimensionScore {
  dimension: string;
  average: number;
  questions?: QuestionDetail[];
}

export interface EvaluationDimensionAverage {
  dimension: string;
  average: number | null;
  question_count: number;
  questions: { code: string; text: string; score: number }[];
}

export interface TeacherCourse {
  course_code: string;
  course_name: string;
  group_name: string;
  respondent_count: number;
  overall_average: number;
  dimensions: EvaluationDimensionScore[];
}

export interface TeacherCommentCourse {
  course_code: string;
  course_name: string;
  group_name: string;
  comments: string[];
}

export interface TeacherCommentsData {
  teacher_id: number;
  evaluation_id: number;
  courses: TeacherCommentCourse[];
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

export function getTeacherComments(
  evaluationId: number,
  teacherId: number,
): Promise<ResponseAPI<TeacherCommentsData>> {
  return api.get(`/evaluations/${evaluationId}/teachers/${teacherId}/comments`);
}

export function exportTeacherMatrix(
  evaluationId: number,
  teacherId: number,
  includeComments: boolean,
): Promise<Blob> {
  const params = includeComments ? '?include_comments=true' : '';
  return api.get(
    `/evaluations/${evaluationId}/teachers/${teacherId}/export${params}`,
    { responseType: 'blob' },
  ) as unknown as Promise<Blob>;
}

export function updateEvaluationStatus(
  evaluationId: number,
  payload: EvaluationStatusUpdate,
): Promise<ResponseAPI<EvaluationRecord>> {
  return api.patch(`/evaluations/${evaluationId}/status`, payload);
}

export function getEvaluationSummary(
  evaluationId: number,
): Promise<ResponseAPI<EvaluationSummary>> {
  return api.get(`/evaluations/${evaluationId}/summary`);
}

export function getDimensionAverages(
  evaluationId: number,
): Promise<ResponseAPI<EvaluationDimensionAverage[]>> {
  return api.get(`/evaluations/${evaluationId}/dimension-averages`);
}

export function getQuestions(): Promise<ResponseAPI<QuestionItem[]>> {
  return api.get("/evaluations/questions");
}

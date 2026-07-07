import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { EvaluationComment } from "../types/Comment";
import type {
  EvaluationRecord,
  EvaluationScore,
  EvaluationStatusUpdate,
} from "../types/Evaluation";
import type { QuestionItem, QuestionScore } from "../types/Question";
import type {
  EvaluationDimensionAverage,
  EvaluationSummary,
  TeacherCommentsData,
  TeacherEvaluationDetail,
} from "../types/TeacherEvaluation";

export function uploadEvaluation(
  file: File,
): Promise<ResponseAPI<EvaluationRecord>> {
  const form = new FormData();
  form.append("file", file);
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
  const params = includeComments ? "?include_comments=true" : "";
  return api.get(
    `/evaluations/${evaluationId}/teachers/${teacherId}/export${params}`,
    { responseType: "blob" },
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

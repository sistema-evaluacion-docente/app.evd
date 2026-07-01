import api from "@/config/axios";

import type { ResponseAPI } from "@/shared/types/Response";
import type { CommentPeriod } from "../types/CommentPeriod";

export default function getCommentsByPeriod({
  periodId,
  page = 1,
  limit = 10,
  search = "",
  riskLevel = null,
  pedagogical_category_id,
  teacher_id,
}: {
  periodId: number;
  page: number;
  limit: number;
  search: string;
  riskLevel?: number | null;
  pedagogical_category_id?: string;
  teacher_id?: string;
}): Promise<ResponseAPI<CommentPeriod[]>> {
  const params: Record<string, string | number> = {};

  if (search) params.search = search;

  if (riskLevel !== null && riskLevel !== undefined)
    params.risk_level = riskLevel;

  if (pedagogical_category_id)
    params.pedagogical_category_id = pedagogical_category_id;

  if (teacher_id) params.teacher_id = teacher_id;

  return api.get(`/comments/by-period/${periodId}`, {
    params: { ...params, page, limit },
  });
}

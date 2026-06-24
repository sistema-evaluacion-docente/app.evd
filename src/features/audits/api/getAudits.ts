import api from "@/config/axios";
import type { AuditResponse } from "../types/Audit";

export interface GetAuditsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export default function getAudits({
  page = 1,
  limit = 100,
  search,
}: GetAuditsParams = {}): Promise<AuditResponse> {
  return api.get("/audits", { params: { page, limit, search } });
}

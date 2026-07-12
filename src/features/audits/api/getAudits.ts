import api from "@/config/axios";
import type { AuditResponse } from "../types/Audit";

export interface GetAuditsParams {
  page?: number;
  limit?: number;
  search?: string;
  table_name?: string;
  operation?: string;
  start_date?: string;
  end_date?: string;
}

export default function getAudits({
  page = 1,
  limit = 100,
  search,
  table_name,
  operation,
  start_date,
  end_date,
}: GetAuditsParams = {}): Promise<AuditResponse> {
  return api.get("/audits", {
    params: {
      page,
      limit,
      search,
      table_name,
      operation,
      start_date,
      end_date,
    },
  });
}

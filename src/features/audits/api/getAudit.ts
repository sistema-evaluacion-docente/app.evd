import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Audit } from "../types/Audit";

export default function getAudit(id: number): Promise<ResponseAPI<Audit>> {
  return api.get(`/audits/${id}`);
}

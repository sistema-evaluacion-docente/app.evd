import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Plan } from "../types/Plan";

export interface UploadActaInput {
  planId: number;
  file?: File | null;
  description?: string;
}

/** Attach/replace the acta de compromiso PDF and/or update its description. */
export default function uploadActa({
  planId,
  file,
  description,
}: UploadActaInput): Promise<ResponseAPI<Plan>> {
  const form = new FormData();
  if (file) form.append("file", file);
  if (description != null) form.append("description", description);

  return api.post(`/improvement-plans/${planId}/acta`, form, {
    headers: { "Content-Type": undefined },
  });
}

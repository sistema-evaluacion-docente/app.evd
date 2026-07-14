import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Plan } from "../types/Plan";

export interface AddEvidenceInput {
  planId: number;
  file: File;
  description?: string;
  itemId?: number | null;
}

/** Attach an evidence PDF to a plan, optionally tied to one of its items. */
export function addEvidence({
  planId,
  file,
  description,
  itemId,
}: AddEvidenceInput): Promise<ResponseAPI<Plan>> {
  const form = new FormData();
  form.append("file", file);
  if (description) form.append("description", description);
  if (itemId != null) form.append("item_id", String(itemId));

  return api.post(`/improvement-plans/${planId}/evidences`, form, {
    headers: { "Content-Type": undefined },
  });
}

export interface DeleteEvidenceInput {
  planId: number;
  evidenceId: number;
}

export function deleteEvidence({
  planId,
  evidenceId,
}: DeleteEvidenceInput): Promise<ResponseAPI<Plan>> {
  return api.delete(`/improvement-plans/${planId}/evidences/${evidenceId}`);
}

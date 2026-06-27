import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface TeacherBulkRow {
  nombre: string;
  email: string;
  codigo_institucional: string;
  tipo_contrato: string | null;
}

export interface TeacherBulkError {
  fila: TeacherBulkRow;
  razon: string;
}

export interface TeacherBulkResult {
  created: TeacherBulkRow[];
  skipped: TeacherBulkError[];
  errors: TeacherBulkError[];
}

export function uploadTeachersExcel(
  file: File,
): Promise<ResponseAPI<TeacherBulkResult>> {
  const form = new FormData();
  form.append("file", file);
  return api.post("/teachers/upload", form, {
    headers: { "Content-Type": undefined },
  });
}

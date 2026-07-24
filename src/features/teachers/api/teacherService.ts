import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface TeacherBulkRow {
  nombre: string
  email: string
  codigo_institucional: string
  tipo_contrato: string | null
}

export interface TeacherBulkError {
  fila: TeacherBulkRow
  razon: string
}

export interface TeacherBulkResult {
  created: TeacherBulkRow[]
  skipped: TeacherBulkError[]
  errors: TeacherBulkError[]
}

/**
 * Uploads an Excel file containing teacher data to the server.
 *
 * @param {File} file - The Excel file to be uploaded.
 * @returns {Promise<ResponseAPI<TeacherBulkResult>>} A promise that resolves to the server's response, which includes the result of the upload operation.
 */
export function uploadTeachersExcel(file: File): Promise<ResponseAPI<TeacherBulkResult>> {
  const form = new FormData()

  form.append('file', file)

  return api.post('/teachers/upload', form, {
    headers: { 'Content-Type': undefined },
  })
}

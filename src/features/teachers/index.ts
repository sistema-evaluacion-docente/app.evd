export type {
  TeacherBulkError,
  TeacherBulkResult,
  TeacherBulkRow,
} from "./api/teacherService";

export { uploadTeachersExcel } from "./api/teacherService";

export {
  useUploadTeachers,
  type UploadStatus,
} from "./hooks/useUploadTeachers";

export type { Teacher } from "./types/Teacher";

export { default as TeachersContent } from "./componentes/TeachersContent";

export { default as useGetTeachers } from "./hooks/useGetTeachers";

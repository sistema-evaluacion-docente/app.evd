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

export type {
  Teacher,
  TeacherCreatePayload,
  UpdateTeacherPayload,
} from "./types/Teacher";

export { default as TeachersContent } from "./componentes/TeachersContent";
export { default as CreateTeacherDrawer } from "./componentes/CreateTeacherDrawer";
export { default as EditTeacherDrawer } from "./componentes/EditTeacherDrawer";

export { default as useGetTeachers } from "./hooks/useGetTeachers";
export { default as useCreateTeacher } from "./hooks/useCreateTeacher";
export { default as useUpdateTeacher } from "./hooks/useUpdateTeacher";
export { default as useDeleteTeacher } from "./hooks/useDeleteTeacher";

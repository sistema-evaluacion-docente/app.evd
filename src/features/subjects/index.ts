export type {
  SubjectAnalytics,
  SubjectTeacher,
  SubjectTeacherDimension,
  SubjectTeachersData,
} from "./api/subjectsService";

export { getSubjects, getSubjectTeachers } from "./api/subjectsService";

export { default as useGetSubjects } from "./hooks/useGetSubjects";
export { default as useGetSubjectTeachers } from "./hooks/useGetSubjectTeachers";

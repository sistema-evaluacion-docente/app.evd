export type { TeacherBulkError, TeacherBulkResult, TeacherBulkRow } from './api/teacherService'

export { uploadTeachersExcel } from './api/teacherService'

export { useUploadTeachers, type UploadStatus } from './hooks/useUploadTeachers'

export type {
  Teacher,
  TeacherCreatePayload,
  TeacherHistoryData,
  TeacherHistoryEntry,
  TeacherSemesterComparisonComments,
  TeacherSemesterComparisonCourse,
  TeacherSemesterComparisonData,
  TeacherSemesterComparisonDimension,
  TeacherSemesterComparisonQuestion,
  UpdateTeacherPayload,
} from './types/Teacher'

export { default as CreateTeacherDrawer } from './componentes/CreateTeacherDrawer'
export { default as EditTeacherDrawer } from './componentes/EditTeacherDrawer'
export { default as TeacherComparisonContent } from './componentes/TeacherComparisonContent'
export { default as TeachersContent } from './componentes/TeachersContent'
export { default as TeacherSemesterComparisonCard } from './componentes/TeacherSemesterComparisonCard'

export { default as useCreateTeacher } from './hooks/useCreateTeacher'
export { default as useDeleteTeacher } from './hooks/useDeleteTeacher'
export { default as useGetTeacherById } from './hooks/useGetTeacherById'
export { default as useGetTeacherHistory } from './hooks/useGetTeacherHistory'
export { default as useGetTeachers } from './hooks/useGetTeachers'
export { default as useGetTeacherSemesterComparison } from './hooks/useGetTeacherSemesterComparison'
export { default as useUpdateTeacher } from './hooks/useUpdateTeacher'

export { useCategoryHistory } from './hooks/useCategoryHistory'
export { useProfessorSummary } from './hooks/useProfessorSummary'

export type {
  CategoryHistory,
  CategoryHistoryPoint,
  CategoryItemHistory,
  CategoryItemPeriodScore,
  ProfessorCategory,
  ProfessorComment,
  ProfessorHistoryPoint,
  ProfessorLevel,
  ProfessorPeriod,
  ProfessorQuestion,
  ProfessorRiskLevel,
  ProfessorSummary,
} from './model/professorSummary'

export {
  buildCategoryHistory,
  buildProfessorSummary,
  mapProfessorComments,
  mapProfessorHistory,
  mapProfessorPeriods,
  normalize,
  PROFESSOR_RISK_BADGE,
  professorRiskBadge,
  professorScoreTone,
} from './model/professorSummary'

export { ProfessorSummaryContent } from './components/professor-summary/ProfessorSummaryContent'

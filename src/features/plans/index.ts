export { default as CreatePlanPage } from './pages/CreatePlanPage'
export { default as MyPlansPage } from './pages/MyPlansPage'
export { default as PlanDetailPage } from './pages/PlanDetailPage'
export { default as PlansPage } from './pages/PlansPage'

export { TeacherPlanAction } from './components/TeacherPlanAction'
export { PlanDocuments } from './components/PlanDocuments'
export { PlanEvidences } from './components/PlanEvidences'
export { PlanCheckpoints } from './components/PlanCheckpoints'
export {
  ActaStatusBadge,
  EvidenceRequestBadge,
  EvidenceStatusBadge,
  PlanStatusBadge,
} from './components/PlanStatusBadge'

export {
  plansKeys,
  useCreatePlan,
  useGetMyPlans,
  useGetPlan,
  useGetPlanCandidates,
  useGetPlanIndicators,
  useGetPlanPeriods,
  useGetPlans,
  useGetTeacherCourses,
  useGetTeacherPlanHistory,
} from './api'

export { ACADEMIC_FACULTIES, FACULTY_NAMES, PROGRAM_NAMES } from './config/academicCatalog'

export * from './types'

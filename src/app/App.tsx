import { AppLayout } from '@/components/common/AppLayout'
import { RouteFallback } from '@/components/common/RouteFallback'
import { EvaluationLogsPanel } from '@/features/evaluations/components/EvaluationLogsPanel'
import { lazy, Suspense } from 'react'
import { Route, Switch } from 'wouter'

import AboutPage from '@/features/about/pages/AboutPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import NotFoundPage from '@/features/not-found/pages/NotFoundPage'

/**
 * Every page is loaded on demand.
 */
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
const CommentsPage = lazy(() => import('@/features/comments/pages/CommentsPage'))
const AlertsPage = lazy(() => import('@/features/comments/pages/AlertsPage'))
const PeriodsPage = lazy(() => import('@/features/periods/pages/PeriodsPage'))
const PeriodDetailPage = lazy(() => import('@/features/periods/pages/PeriodDetailPage'))
const PeriodCourseDetailPage = lazy(() => import('@/features/periods/pages/PeriodCourseDetailPage'))
const TeacherMateriasPage = lazy(() => import('@/features/periods/pages/TeacherMateriasPage'))
const AdminPeriodsPage = lazy(() =>
  import('@/features/periods/pages/AdminPeriodsPage').then((module) => ({
    default: module.AdminPeriodsPage,
  })),
)
const TeachersPage = lazy(() => import('@/features/teachers/pages/TeachersPage'))
const TeacherDetailPage = lazy(() => import('@/features/teachers/pages/TeacherDetailPage'))
const TeacherUploadPage = lazy(() => import('@/features/teachers/pages/TeacherUploadPage'))
const SubjectsPage = lazy(() => import('@/features/subjects/pages/SubjectsPage'))
const SubjectComparisonPage = lazy(() => import('@/features/subjects/pages/SubjectComparisonPage'))
const SubjectTeacherDetailPage = lazy(
  () => import('@/features/subjects/pages/SubjectTeacherDetailPage'),
)
const PlansPage = lazy(() => import('@/features/plans/pages/PlansPage'))
const PlanDetailPage = lazy(() => import('@/features/plans/pages/PlanDetailPage'))
const PlanFormPage = lazy(() => import('@/features/plans/pages/PlanFormPage'))
const MyPlansPage = lazy(() => import('@/features/plans/pages/MyPlansPage'))
const MyPlanDetailPage = lazy(() => import('@/features/plans/pages/MyPlanDetailPage'))
const EvaluationsPage = lazy(() => import('@/features/evaluations/pages/EvaluationsPage'))
const EvaluationDetailPage = lazy(() => import('@/features/evaluations/pages/EvaluationDetailPage'))
const EvaluationCoursesPage = lazy(
  () => import('@/features/evaluations/pages/EvaluationCoursesPage'),
)
const EvaluationDimensionsPage = lazy(
  () => import('@/features/evaluations/pages/EvaluationDimensionsPage'),
)
const EvaluationPdfPage = lazy(() => import('@/features/evaluations/pages/EvaluationPdfPage'))
const EvaluationUploadPage = lazy(() => import('@/features/evaluations/pages/EvaluationUploadPage'))
const LogsPage = lazy(() => import('@/features/admin/pages/LogsPage'))
const SettingsPage = lazy(() => import('@/features/admin/pages/SettingsPage'))
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'))
const SuggestedActionsPage = lazy(
  () => import('@/features/suggested-actions/pages/SuggestedActionsPage'),
)
const DirectorsPage = lazy(() =>
  import('@/features/directors/pages/DirectorsPage').then((module) => ({
    default: module.DirectorsPage,
  })),
)
const FacultiesPage = lazy(() =>
  import('@/features/faculties/pages/FacultiesPage').then((module) => ({
    default: module.FacultiesPage,
  })),
)
const DepartmentsPage = lazy(() =>
  import('@/features/departments/pages/DepartmentsPage').then((module) => ({
    default: module.DepartmentsPage,
  })),
)

function App() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path="/login" component={LoginPage} />

          <Route path="/" component={AboutPage} />

          <Route path="/home">
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </Route>

          <Route path="/notificaciones">
            <AppLayout>
              <NotificationsPage />
            </AppLayout>
          </Route>

          <Route path="/periodos">
            <AppLayout>
              <PeriodsPage />
            </AppLayout>
          </Route>

          <Route path="/periodos/materias">
            <AppLayout>
              <TeacherMateriasPage />
            </AppLayout>
          </Route>

          <Route path="/periodos/:period">
            <AppLayout>
              <PeriodDetailPage />
            </AppLayout>
          </Route>

          <Route path="/periodos/:period/materias/:courseCode/:groupName">
            <AppLayout>
              <PeriodCourseDetailPage />
            </AppLayout>
          </Route>

          <Route path="/docentes/cargar">
            <AppLayout>
              <TeacherUploadPage />
            </AppLayout>
          </Route>

          <Route path="/docentes">
            <AppLayout>
              <TeachersPage />
            </AppLayout>
          </Route>

          <Route path="/docentes/:id">
            <AppLayout>
              <TeacherDetailPage />
            </AppLayout>
          </Route>

          <Route path="/materias/:courseCode/docentes/:teacherId">
            <AppLayout>
              <SubjectTeacherDetailPage />
            </AppLayout>
          </Route>

          <Route path="/materias/:courseCode/comparar">
            <AppLayout>
              <SubjectComparisonPage />
            </AppLayout>
          </Route>

          <Route path="/materias">
            <AppLayout>
              <SubjectsPage />
            </AppLayout>
          </Route>

          <Route path="/alertas/:teacherId">
            <AppLayout>
              <AlertsPage />
            </AppLayout>
          </Route>

          <Route path="/alertas">
            <AppLayout>
              <AlertsPage />
            </AppLayout>
          </Route>

          <Route path="/comentarios">
            <AppLayout>
              <CommentsPage />
            </AppLayout>
          </Route>

          <Route path="/mis-planes">
            <AppLayout>
              <MyPlansPage />
            </AppLayout>
          </Route>

          <Route path="/mis-planes/:id">
            <AppLayout>
              <MyPlanDetailPage />
            </AppLayout>
          </Route>

          <Route path="/planes/nuevo">
            <AppLayout>
              <PlanFormPage />
            </AppLayout>
          </Route>

          <Route path="/planes/:id/editar">
            <AppLayout>
              <PlanFormPage />
            </AppLayout>
          </Route>

          <Route path="/planes">
            <AppLayout>
              <PlansPage />
            </AppLayout>
          </Route>

          <Route path="/planes/:id">
            <AppLayout>
              <PlanDetailPage />
            </AppLayout>
          </Route>

          <Route path="/acciones">
            <AppLayout>
              <SuggestedActionsPage />
            </AppLayout>
          </Route>

          <Route path="/evaluaciones/cargar">
            <AppLayout>
              <EvaluationUploadPage />
            </AppLayout>
          </Route>

          <Route path="/evaluaciones">
            <AppLayout>
              <EvaluationsPage />
            </AppLayout>
          </Route>

          <Route path="/evaluaciones/:id/pdf">
            <AppLayout>
              <EvaluationPdfPage />
            </AppLayout>
          </Route>

          <Route path="/evaluaciones/:id/materias">
            <AppLayout>
              <EvaluationCoursesPage />
            </AppLayout>
          </Route>

          <Route path="/evaluaciones/:id/dimensiones">
            <AppLayout>
              <EvaluationDimensionsPage />
            </AppLayout>
          </Route>

          <Route path="/evaluaciones/:id">
            <AppLayout>
              <EvaluationDetailPage />
            </AppLayout>
          </Route>

          <Route path="/admin/logs">
            <AppLayout>
              <LogsPage />
            </AppLayout>
          </Route>

          <Route path="/admin/configuracion">
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </Route>

          <Route path="/admin/facultades">
            <AppLayout>
              <FacultiesPage />
            </AppLayout>
          </Route>

          <Route path="/admin/departamentos">
            <AppLayout>
              <DepartmentsPage />
            </AppLayout>
          </Route>

          <Route path="/admin/periodos">
            <AppLayout>
              <AdminPeriodsPage />
            </AppLayout>
          </Route>

          <Route path="/admin/usuarios">
            <AppLayout>
              <UsersPage />
            </AppLayout>
          </Route>

          <Route path="/admin/directores">
            <AppLayout>
              <DirectorsPage />
            </AppLayout>
          </Route>

          <Route>
            <NotFoundPage />
          </Route>
        </Switch>
      </Suspense>
      <EvaluationLogsPanel />
    </>
  )
}

export default App

import { Route, Switch } from 'wouter'

import { AppLayout } from '@/components/common/AppLayout'
import { LogsPage, SettingsPage } from '@/features/admin'
import { LoginPage } from '@/features/auth'
import { CommentsPage } from '@/features/comments'
import { DashboardPage } from '@/features/dashboard'
import { DepartmentsPage } from '@/features/departments'
import { DirectorsPage } from '@/features/directors'
import {
  EvaluationDetailPage,
  EvaluationDimensionsPage,
  EvaluationLogsPanel,
  EvaluationPdfPage,
  EvaluationsPage,
  EvaluationUploadPage,
} from '@/features/evaluations'
import { FacultiesPage } from '@/features/faculties'
import { NotFoundPage } from '@/features/not-found'
import {
  AdminPeriodsPage,
  PeriodCourseDetailPage,
  PeriodDetailPage,
  PeriodsPage,
  TeacherMateriasPage,
} from '@/features/periods'
import {
  MyPlanDetailPage,
  MyPlansPage,
  PlanDetailPage,
  PlanFormPage,
  PlansPage,
} from '@/features/plans'
import { SubjectComparisonPage, SubjectsPage, SubjectTeacherDetailPage } from '@/features/subjects'
import { TeacherDetailPage, TeachersPage, TeacherUploadPage } from '@/features/teachers'
import { UsersPage } from '@/features/users'

function App() {
  return (
    <>
      <Switch>
        <Route path="/login" component={LoginPage} />

        <Route path="/">
          <AppLayout>
            <DashboardPage />
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

        <Route component={NotFoundPage} />
      </Switch>

      <EvaluationLogsPanel />
    </>
  )
}

export default App

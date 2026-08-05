import { Route, Switch } from 'wouter'

import { AppLayout } from '@/components/common/AppLayout'
import { LogsPage } from '@/features/admin'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { DepartmentsPage } from '@/features/departments'
import {
  EvaluationDetailPage,
  EvaluationLogsPanel,
  EvaluationsPage,
  EvaluationUploadPage,
} from '@/features/evaluations'
import { FacultiesPage } from '@/features/faculties'
import { NotFoundPage } from '@/features/not-found'
import { AdminPeriodsPage, PeriodsPage } from '@/features/periods'
import { TeacherDetailPage, TeachersPage, TeacherUploadPage } from '@/features/teachers'

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

        <Route path="/admin/faculties">
          <AppLayout>
            <FacultiesPage />
          </AppLayout>
        </Route>

        <Route path="/admin/departments">
          <AppLayout>
            <DepartmentsPage />
          </AppLayout>
        </Route>

        <Route path="/admin/periods">
          <AppLayout>
            <AdminPeriodsPage />
          </AppLayout>
        </Route>

        <Route component={NotFoundPage} />
      </Switch>

      <EvaluationLogsPanel />
    </>
  )
}

export default App

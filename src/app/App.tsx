import { Route, Switch } from 'wouter'

import { AppLayout } from '@/components/common/AppLayout'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { EvaluationLogsPanel, EvaluationsPage, EvaluationUploadPage } from '@/features/evaluations'
import { NotFoundPage } from '@/features/not-found'
import { PeriodsPage } from '@/features/periods'
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

        <Route component={NotFoundPage} />
      </Switch>

      <EvaluationLogsPanel />
    </>
  )
}

export default App

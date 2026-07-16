import { Route, Switch } from "wouter";

import { SettingsPage } from "@/features/settings";
import { AdminDepartmentsPage } from "@/pages/admin-departments";
import { AdminDirectorsPage } from "@/pages/admin-directors";
import { AdminFacultiesPage } from "@/pages/admin-faculties";
import { AdminLogsPage } from "@/pages/admin-logs";
import { AdminPeriodsPage } from "@/pages/admin-periods";
import { DashboardPage } from "@/pages/dashboard";
import { DirectorsPage } from "@/pages/directors";
import { EvaluationsPage } from "@/pages/evaluations";
import { EvaluationCommentsPage } from "@/pages/evaluations/comments";
import { EvaluationDetailPage } from "@/pages/evaluations/detail";
import { EvaluationDimensionsPage } from "@/pages/evaluations/dimensions";
import { EvaluationGroupsPage } from "@/pages/evaluations/groups";
import { EvaluationTeachersPage } from "@/pages/evaluations/teachers";
import { UploadEvaluationsPage } from "@/pages/evaluations/upload";
import { MatrixIndexPage, MatrixPage, MatrixPageMock } from "@/pages/matrix";
import { MyHistoryPage } from "@/pages/my-history";
import { MyPlansPage } from "@/pages/my-plans";
import { MyProfilePage } from "@/pages/my-profile";
import { NotFoundPage } from "@/pages/not-found";
import { PlansPage } from "@/pages/plans";
import { PlanDetailPage } from "@/pages/plans/detail";
import { CreatePlanPage } from "@/pages/plans/new";
import { TeacherComparisonPage } from "@/pages/teacher-comparison";
import { TeacherDetailPage } from "@/pages/teacher-detail";
import { TeachersPage } from "@/pages/teachers";
import { UploadTeachersPage } from "@/pages/upload-teachers";

import LoginPage from "@/features/auth/pages/LoginPage";
import { PeriodsPage } from "@/features/periods";
import { SubjectDetailPage, SubjectsPage } from "@/pages/subjects";
import { SummaryPage } from "@/pages/summary/ui/SummaryPage";
import UsersPage from "@/pages/users";

function App() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      {/* Director */}
      <Route path="/dashboard" component={DashboardPage} />

      <Route path="/directors" component={DirectorsPage} />
      <Route path="/teachers" component={TeachersPage} />
      <Route path="/teachers/upload" component={UploadTeachersPage} />
      <Route path="/teachers/:id/comparison" component={TeacherComparisonPage} />
      <Route path="/teachers/:id" component={TeacherDetailPage} />

      <Route path="/matrix" component={MatrixIndexPage} />
      <Route path="/matrix/:id" component={MatrixPage} />
      <Route path="/matrix-mock" component={MatrixPageMock} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/plans/new" component={CreatePlanPage} />
      <Route path="/plans/:id" component={PlanDetailPage} />
      <Route path="/subjects" component={SubjectsPage} />
      <Route path="/subjects/:id" component={SubjectDetailPage} />

      <Route path="/evaluations" component={EvaluationsPage} />
      <Route
        path="/evaluations/:id/dimensions"
        component={EvaluationDimensionsPage}
      />
      <Route
        path="/evaluations/:id/teachers"
        component={EvaluationTeachersPage}
      />
      <Route
        path="/evaluations/:id/groups"
        component={EvaluationGroupsPage}
      />
      <Route
        path="/evaluations/:id/comments"
        component={EvaluationCommentsPage}
      />
      <Route path="/evaluations/upload" component={UploadEvaluationsPage} />
      <Route path="/evaluations/:id" component={EvaluationDetailPage} />

      <Route path="/upload-evaluations" component={UploadEvaluationsPage} />
      <Route path="/periods" component={PeriodsPage} />

      {/* Super Admin */}
      <Route path="/users" component={UsersPage} />
      <Route path="/admin/directors" component={AdminDirectorsPage} />
      <Route path="/admin/periods" component={AdminPeriodsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/faculties" component={AdminFacultiesPage} />
      <Route path="/departments" component={AdminDepartmentsPage} />
      <Route path="/logs" component={AdminLogsPage} />

      {/* Docente */}
      <Route path="/summary" component={SummaryPage} />
      <Route path="/my-plans" component={MyPlansPage} />
      <Route path="/me/history" component={MyHistoryPage} />
      <Route path="/me/profile" component={MyProfilePage} />

      {/* Default: 404 */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;

import { Redirect, Route, Switch } from "wouter";

import { AdminDirectorsPage } from "@/pages/admin-directors";
import { AdminLogsPage } from "@/pages/admin-logs";
import { AdminPeriodsPage } from "@/pages/admin-periods";
import { DashboardPage } from "@/pages/dashboard";
import { MatrixPage } from "@/pages/matrix";
import { MyHistoryPage } from "@/pages/my-history";
import { MyProfilePage } from "@/pages/my-profile";
import { MySummaryPage } from "@/pages/my-summary";
import { PlansPage } from "@/pages/plans";
import { TeacherDetailPage } from "@/pages/teacher-detail";
import { TeachersPage } from "@/pages/teachers";
import { UploadEvaluationsPage } from "@/pages/upload-evaluations";
import { UploadTeachersPage } from "@/pages/upload-teachers";

import LoginPage from "@/features/auth/pages/LoginPage";

function App() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      {/* Director */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/teachers" component={TeachersPage} />
      <Route path="/teachers/:id" component={TeacherDetailPage} />
      <Route path="/matrix" component={MatrixPage} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/upload-evaluations" component={UploadEvaluationsPage} />
      <Route path="/upload-teachers" component={UploadTeachersPage} />

      {/* Super Admin */}
      <Route path="/admin/directors" component={AdminDirectorsPage} />
      <Route path="/admin/periods" component={AdminPeriodsPage} />
      <Route path="/admin/logs" component={AdminLogsPage} />

      {/* Docente */}
      <Route path="/me/summary" component={MySummaryPage} />
      <Route path="/me/history" component={MyHistoryPage} />
      <Route path="/me/profile" component={MyProfilePage} />

      {/* Default: redirect to login */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}

export default App;

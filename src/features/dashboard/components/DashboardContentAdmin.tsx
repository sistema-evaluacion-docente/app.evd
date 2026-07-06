import { PageHeader } from "@/shared/ui";

import useGetAdminDashboard from "../hooks/useGetAdminDashboard";
import AdminPeriodsCard from "./admin/AdminPeriodsCard";
import AdminRecentLogs from "./admin/AdminRecentLogs";
import AdminStatsCards from "./admin/AdminStatsCards";
import AdminUsersSummary from "./admin/AdminUsersSummary";

function DashboardContentAdmin() {
  const { data, isLoading, isFetched } = useGetAdminDashboard();

  const counts = data?.data?.counts ?? {
    departments: 0,
    faculties: 0,
    users: 0,
    active_users: 0,
    teachers: 0,
    evaluations: 0,
    academic_periods: 0,
    active_periods: 0,
  };
  const recentAudits = data?.data?.recent_audits ?? [];
  const periods = data?.data?.periods ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="Administracion" />

      <section className="space-y-4">
        <AdminStatsCards
          counts={counts}
          isLoading={isLoading}
          isFetched={isFetched}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_0.5fr] items-start">
          <div className="w-full space-y-4">
            <AdminRecentLogs audits={recentAudits} isLoading={isLoading} />
          </div>

          <div className="w-full space-y-4">
            <AdminUsersSummary
              counts={counts}
              isLoading={isLoading}
              isFetched={isFetched}
            />

            <AdminPeriodsCard periods={periods} isLoading={isLoading} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardContentAdmin;

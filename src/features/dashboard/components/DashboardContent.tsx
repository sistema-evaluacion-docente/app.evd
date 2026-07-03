import useAuth from "@/shared/hooks/useAuth";
import DashboardContentDirector from "./DashboardContentDirector";
import DashboardContentTeacher from "./DashboardContentTeacher";

function DashboardContent() {
  const { selectedRole } = useAuth();

  if (selectedRole === "DIRECTOR DE DEPARTAMENTO") {
    return <DashboardContentDirector />;
  }

  if (selectedRole === "DOCENTE") {
    return <DashboardContentTeacher />;
  }

  return <span>ADMIN</span>;
}

export default DashboardContent;

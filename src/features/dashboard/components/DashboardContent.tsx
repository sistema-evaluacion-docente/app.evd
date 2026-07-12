import useAuth from "@/shared/hooks/useAuth";
import DashboardContentAdmin from "./DashboardContentAdmin";
import DashboardContentDirector from "./DashboardContentDirector";
import DashboardContentTeacher from "./DashboardContentTeacher";

function DashboardContent() {
  const { selectedRole } = useAuth();

  if (selectedRole === "ADMIN") {
    return <DashboardContentAdmin />;
  }

  if (selectedRole === "DIRECTOR DE DEPARTAMENTO") {
    return <DashboardContentDirector />;
  }

  if (selectedRole === "DOCENTE") {
    return <DashboardContentTeacher />;
  }

  return <span>Selecciona un rol</span>;
}

export default DashboardContent;

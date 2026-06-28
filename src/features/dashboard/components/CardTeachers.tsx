import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

import useGetTeacherCount from "../hooks/useGetTeacherCount";
import KpiCard from "./KpiCard";

function CardTeachers() {
  const { data, isLoading } = useGetTeacherCount();

  const teacherCount = data?.data?.current_count ?? 0;
  const previousTeacherCount = data?.data?.previous_count ?? 0;

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <KpiCard
      value={teacherCount}
      trend={
        previousTeacherCount ? `+${teacherCount - previousTeacherCount}` : "0"
      }
      progress={100}
      icon={<Users size={18} />}
      label="Docentes registrados"
      progressColor="bg-emerald-500"
    />
  );
}

export default CardTeachers;

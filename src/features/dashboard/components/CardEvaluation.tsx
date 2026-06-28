import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

import useGetEvaluationCount from "../hooks/useGetEvaluationCount";
import KpiCard from "./KpiCard";

function CardEvaluation() {
  const { data, isLoading, isFetching } = useGetEvaluationCount();

  const evaluationCount = data?.data?.count ?? 0;

  if (isLoading || isFetching) {
    return <Skeleton />;
  }

  return (
    <KpiCard
      value={evaluationCount}
      trend="+5.2%"
      progress={100}
      icon={<FileText size={18} />}
      label="Evaluaciones en curso"
      progressColor="bg-blue-500"
    />
  );
}

export default CardEvaluation;

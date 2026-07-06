import { useMemo } from "react";

import {
  useGetDimensionAverages,
  useGetEvaluation,
} from "@/features/evaluations";

export function useEvaluationDimensions(evaluationId: number) {
  const { data: evalRes, isLoading: evalLoading } =
    useGetEvaluation(evaluationId);
  const evaluation = evalRes?.data;

  const { data: dimensionsRes, isLoading: dimensionsLoading } =
    useGetDimensionAverages(evaluationId);
  const dimensions = useMemo(() => dimensionsRes?.data ?? [], [dimensionsRes]);

  const overallAverage = useMemo(() => {
    if (dimensions.length === 0) return null;
    const sum = dimensions.reduce(
      (acc, d) => acc + (d.average ?? 0),
      0,
    );
    return sum / dimensions.length;
  }, [dimensions]);

  const totalQuestions = useMemo(
    () => dimensions.reduce((acc, d) => acc + d.question_count, 0),
    [dimensions],
  );

  const isLoading = evalLoading || dimensionsLoading;
  const noData = !isLoading && !evaluation;

  return {
    evaluation,
    dimensions,
    overallAverage,
    totalQuestions,
    isLoading,
    noData,
  };
}

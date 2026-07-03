import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HistogramChart } from "@/shared/ui";

import useGetGradeDistribution from "../../hooks/useGetGradeDistribution";

function GradeDistributionSection() {
  const {
    data: distributionResponse,
    isLoading,
    isFetched,
  } = useGetGradeDistribution();

  const bins = distributionResponse?.data?.bins ?? [];

  const histogramData = bins.map((bin) => ({
    label: bin.range_label,
    value: bin.teacher_count,
  }));

  if (isLoading || !isFetched) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <Skeleton className="h-75 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="animate-fade-in">
      <Card className="pt-0">
        <CardHeader>
          <CardTitle>Distribución de Calificaciones</CardTitle>
        </CardHeader>

        <CardContent>
          {histogramData.length > 0 ? (
            <HistogramChart data={histogramData} />
          ) : (
            <p className="py-8 text-center text-sm text-ink-400">
              No hay datos disponibles para mostrar la distribución.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default GradeDistributionSection;

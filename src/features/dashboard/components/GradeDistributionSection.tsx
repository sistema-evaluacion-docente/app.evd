import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HistogramChart } from "@/shared/ui";

import useGetGradeDistribution from "../hooks/useGetGradeDistribution";

function GradeDistributionSection() {
  const { data: distributionResponse, isLoading } = useGetGradeDistribution();

  const bins = distributionResponse?.data?.bins ?? [];

  const histogramData = bins.map((bin) => ({
    label: bin.range_label,
    value: bin.teacher_count,
  }));

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <section>
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

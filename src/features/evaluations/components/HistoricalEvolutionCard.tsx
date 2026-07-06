import { useGetTeacherHistory } from "@/features/teachers";
import type { EvaluationRecord } from "@/features/evaluations";
import { AreaChart, Card } from "@/shared/ui";

interface HistoricalEvolutionCardProps {
  teacherId: number;
  evaluation?: EvaluationRecord;
}

export default function HistoricalEvolutionCard({
  teacherId,
}: HistoricalEvolutionCardProps) {
  const { data: historyRes } = useGetTeacherHistory(teacherId);
  const history = historyRes?.data?.history ?? [];

  const chartData = history.map((h) => ({
    label: h.period_code,
    value: h.overall_average,
  }));

  return (
    <Card className='p-5 sm:p-6'>
      <div className='mb-1 flex items-start justify-between'>
        <h2 className='text-[17px] font-semibold text-ink-900'>
          Evolución Histórica
        </h2>
        <div className='inline-flex items-center gap-1.5 text-[12px] text-ink-600'>
          <span className='h-2 w-2 rounded-full bg-brand-600' /> Promedio
          Global
        </div>
      </div>
      <p className='text-[12.5px] text-ink-500'>
        Últimos {chartData.length} periodos académicos
      </p>
      <div className='mt-4'>
        {chartData.length > 0 ? (
          <AreaChart
            data={chartData}
            yMin={1}
            yMax={5}
            yTicks={[2, 3, 4, 5]}
            width={640}
            height={160}
            formatValue={(value) => `${value.toFixed(1)}/5`}
          />
        ) : (
          <div className='flex h-40 items-center justify-center text-[13px] text-ink-400'>
            Sin historial disponible
          </div>
        )}
      </div>
    </Card>
  );
}

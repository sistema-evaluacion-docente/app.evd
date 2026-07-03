import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

function KpiCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend: number;
  trendColor?: string;
  progress?: number;
  progressColor?: string;
}) {
  return (
    <Card className="relative">
      <CardContent>
        <div className="flex items-center gap-2 mb-6 font-semibold">
          <div className="text-sm text-muted-foreground uppercase">{label}</div>
        </div>

        <div className="absolute right-6 top-6 text-muted-foreground opacity-30">
          {icon}
        </div>

        <div className="flex items-center gap-4">
          <div className="num text-3xl font-bold leading-none tabular-nums">
            <span>{value}</span>
          </div>

          {trend && (
            <span
              className={`flex items-center gap-2 text-xl text-muted-foreground`}
            >
              {trend > 0 ? (
                <ArrowUp size={16} className={`text-emerald-600`} />
              ) : trend < 0 ? (
                <ArrowDown size={16} className={`text-rose-600`} />
              ) : null}

              {trend > 0 ? `+${trend}` : trend < 0 ? `${trend}` : null}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default KpiCard;

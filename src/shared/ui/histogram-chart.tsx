import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { useId, useState } from "react";

export interface HistogramBin {
  label: string;
  value: number;
}

export interface HistogramChartProps {
  data: HistogramBin[];
  width?: number;
  height?: number;
}

export function HistogramChart({
  data,
  width = 600,
  height = 280,
}: HistogramChartProps) {
  const gradientId = useId();
  const pad = { t: 24, r: 24, b: 50, l: 46 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const [hover, setHover] = useState<number | null>(null);
  const [visibleLabels, setVisibleLabels] = useState<string[]>([]);

  if (data.length === 0) return null;

  const allLabels = data.map((d) => d.label);
  const filteredData =
    visibleLabels.length === 0
      ? data
      : data.filter((d) => visibleLabels.includes(d.label));

  const maxCount = Math.max(...filteredData.map((d) => d.value), 1);
  const barGap = 4;
  const barWidth =
    filteredData.length > 0
      ? (innerW - barGap * (filteredData.length + 1)) / filteredData.length
      : 0;

  const yTicks = [0, Math.ceil(maxCount / 2) * 2, Math.ceil(maxCount)];
  if (yTicks[1] === yTicks[2]) yTicks[1] = Math.ceil(maxCount / 2);

  const toggleLabel = (label: string) => {
    setVisibleLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <div />

        <Popover>
          <PopoverTrigger>
            <Button variant="outline" size="icon-xs">
              <Settings2 className="size-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80">
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium">Filtrar rangos</div>

              <div className="h-px bg-border" />

              <div className="text-xs text-muted-foreground">
                Rangos individuales:
              </div>

              <div className="flex flex-wrap gap-1.5">
                {allLabels.map((label) => {
                  const isActive =
                    visibleLabels.length === 0 || visibleLabels.includes(label);

                  return (
                    <button
                      key={label}
                      onClick={() => toggleLabel(label)}
                      className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                        isActive
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {visibleLabels.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setVisibleLabels([])}
                >
                  Restablecer filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Distribución de calificaciones"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand-600)"
              stopOpacity="0.85"
            />

            <stop
              offset="100%"
              stopColor="var(--color-brand-600)"
              stopOpacity="0.55"
            />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = pad.t + innerH - (tick / maxCount) * innerH;

          return (
            <g key={tick}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke="#E4E6EA"
                strokeDasharray="3 4"
              />
              <text
                x={pad.l - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#9AA0AB"
                fontFamily="Geist Mono, monospace"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <line
          x1={pad.l}
          x2={width - pad.r}
          y1={pad.t + innerH}
          y2={pad.t + innerH}
          stroke="#C4C8D0"
        />

        {filteredData.map((bin, i) => {
          const barH = (bin.value / maxCount) * innerH;
          const x = pad.l + barGap + i * (barWidth + barGap);
          const y = pad.t + innerH - barH;

          return (
            <g key={bin.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={`url(#${gradientId})`}
                rx={3}
                opacity={hover !== null && hover !== i ? 0.5 : 1}
              />

              <text
                x={x + barWidth / 2}
                y={height - 14}
                textAnchor="middle"
                fontSize="10"
                fill="#6A707D"
                fontFamily="Geist, sans-serif"
              >
                {bin.label}
              </text>

              <rect
                x={x - barGap / 2}
                y={pad.t}
                width={barWidth + barGap}
                height={innerH}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>

      {hover !== null && filteredData[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md bg-ink-900 px-2.5 py-1.5 text-[11.5px] text-ink-50 shadow-pop"
          style={{
            left: `${((pad.l + barGap + hover * (barWidth + barGap) + barWidth / 2) / width) * 100}%`,
            top: `${((pad.t + innerH - (filteredData[hover].value / maxCount) * innerH) / height) * 100}%`,
          }}
        >
          <div className="font-semibold">{filteredData[hover].label}</div>

          <div className="num text-ink-50/80 tabular-nums">
            {filteredData[hover].value} docente
            {filteredData[hover].value !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

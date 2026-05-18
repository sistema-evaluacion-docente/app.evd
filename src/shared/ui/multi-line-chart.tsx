export interface LineSeries {
  key: string
  label: string
  color: string
  values: number[]
}

export interface MultiLineChartProps {
  labels: string[]
  series: LineSeries[]
  yMin: number
  yMax: number
  yTicks: number[]
  tickSuffix?: string
  width?: number
  height?: number
}

/** SVG chart drawing several smooth lines with a legend (no area fill). */
export function MultiLineChart({
  labels,
  series,
  yMin,
  yMax,
  yTicks,
  tickSuffix = '',
  width = 1000,
  height = 360,
}: MultiLineChartProps) {
  const pad = { t: 30, r: 40, b: 50, l: 40 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b

  const xs = labels.map((_, i) =>
    labels.length === 1 ? pad.l + innerW / 2 : pad.l + (i / (labels.length - 1)) * innerW,
  )
  const toY = (value: number) =>
    pad.t + innerH - ((value - yMin) / (yMax - yMin)) * innerH

  const buildPath = (values: number[]) => {
    const points = values.map((value, i) => [xs[i], toY(value)] as const)
    if (points.length < 2) return ''
    let path = `M ${points[0][0]} ${points[0][1]}`
    for (let i = 1; i < points.length; i++) {
      const controlX = points[i - 1][0] + (points[i][0] - points[i - 1][0]) * 0.5
      path += ` C ${controlX} ${points[i - 1][1]}, ${controlX} ${points[i][1]}, ${points[i][0]} ${points[i][1]}`
    }
    return path
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico comparativo por dimensión"
      >
        {yTicks.map((tick) => {
          const y = toY(tick)
          return (
            <g key={tick}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke="#E4E6EA"
                strokeDasharray="3 5"
              />
              <text
                x={pad.l - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#9AA0AB"
                fontFamily="Geist Mono, monospace"
              >
                {tick}
                {tickSuffix}
              </text>
            </g>
          )
        })}

        <line
          x1={pad.l}
          x2={width - pad.r}
          y1={pad.t + innerH}
          y2={pad.t + innerH}
          stroke="#C4C8D0"
        />

        {labels.map((label, i) => (
          <text
            key={label}
            x={xs[i]}
            y={height - 16}
            textAnchor="middle"
            fontSize="11"
            fill="#6A707D"
            fontFamily="Geist, sans-serif"
          >
            {label}
          </text>
        ))}

        {series.map((line) => (
          <g key={line.key}>
            <path
              d={buildPath(line.values)}
              stroke={line.color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            {line.values.map((value, i) => (
              <circle
                key={labels[i]}
                cx={xs[i]}
                cy={toY(value)}
                r="3"
                fill="#fff"
                stroke={line.color}
                strokeWidth="1.5"
              />
            ))}
          </g>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap gap-3 px-1">
        {series.map((line) => (
          <span
            key={line.key}
            className="inline-flex items-center gap-1.5 text-[12px] text-ink-700"
          >
            <span
              className="h-2 w-6 rounded-sm"
              style={{ background: line.color }}
            />
            {line.label}
          </span>
        ))}
      </div>
    </div>
  )
}

import { useId, useMemo, useState } from 'react'

export interface ChartPoint {
  label: string
  value: number
}

export interface AreaChartProps {
  data: ChartPoint[]
  yMin: number
  yMax: number
  yTicks: number[]
  tickSuffix?: string
  /** Format the value shown in the hover tooltip. */
  formatValue?: (value: number) => string
  width?: number
  height?: number
}

/** Dependency-free SVG area chart with a smooth line and hover tooltip. */
export function AreaChart({
  data,
  yMin,
  yMax,
  yTicks,
  tickSuffix = '',
  formatValue,
  width = 720,
  height = 280,
}: AreaChartProps) {
  const gradientId = useId()
  const pad = { t: 24, r: 24, b: 40, l: 46 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const [hover, setHover] = useState<number | null>(null)

  const xs = data.map((_, i) =>
    data.length === 1 ? pad.l + innerW / 2 : pad.l + (i / (data.length - 1)) * innerW,
  )
  const ys = data.map(
    (point) => pad.t + innerH - ((point.value - yMin) / (yMax - yMin)) * innerH,
  )

  const linePath = useMemo(() => {
    if (xs.length < 2) return ''
    let path = `M ${xs[0]} ${ys[0]}`
    for (let i = 1; i < xs.length; i++) {
      const controlX = xs[i - 1] + (xs[i] - xs[i - 1]) * 0.5
      path += ` C ${controlX} ${ys[i - 1]}, ${controlX} ${ys[i]}, ${xs[i]} ${ys[i]}`
    }
    return path
  }, [xs, ys])

  const areaPath = linePath
    ? `${linePath} L ${xs[xs.length - 1]} ${pad.t + innerH} L ${xs[0]} ${pad.t + innerH} Z`
    : ''
  const format = formatValue ?? ((value: number) => value.toFixed(1))

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico de evolución"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = pad.t + innerH - ((tick - yMin) / (yMax - yMin)) * innerH
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

        {data.map((point, i) => (
          <text
            key={point.label}
            x={xs[i]}
            y={height - 14}
            textAnchor="middle"
            fontSize="11"
            fill="#6A707D"
            fontFamily="Geist, sans-serif"
            fontWeight={point.label === 'ACTUAL' ? 700 : 400}
          >
            {point.label}
          </text>
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          stroke="var(--color-brand-600)"
          strokeWidth="2.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {xs.map((x, i) => (
          <g key={data[i].label}>
            <circle
              cx={x}
              cy={ys[i]}
              r={hover === i ? 5.5 : 3.75}
              fill="#fff"
              stroke="var(--color-brand-600)"
              strokeWidth="2"
            />
            <rect
              x={x - innerW / (data.length * 2)}
              y={pad.t}
              width={innerW / data.length}
              height={innerH}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}

        {hover !== null && (
          <line
            x1={xs[hover]}
            x2={xs[hover]}
            y1={pad.t}
            y2={pad.t + innerH}
            stroke="var(--color-brand-600)"
            strokeDasharray="2 3"
            strokeOpacity="0.5"
          />
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md bg-ink-900 px-2.5 py-1.5 text-[11.5px] text-ink-50 shadow-pop"
          style={{
            left: `${(xs[hover] / width) * 100}%`,
            top: `${(ys[hover] / height) * 100}%`,
          }}
        >
          <div className="font-semibold">{data[hover].label}</div>
          <div className="num text-ink-50/80 tabular-nums">
            {format(data[hover].value)}
          </div>
        </div>
      )}
    </div>
  )
}

"use client";

// Gráficos SVG hechos a mano (sin librerías externas), alineados con los
// tokens de color del tema. Son componentes puramente presentacionales.

export const CHART_COLORS = {
  gold: "#d4a574",
  blue: "#7c9cc6",
  green: "#6fb8a8",
  red: "#e07856",
  violet: "#9b8ac9",
} as const;

interface GroupedBarSeries {
  name: string;
  color: string;
}

interface GroupedBarGroup {
  label: string;
  values: number[];
}

export function GroupedBars({
  groups,
  series,
  height = 240,
}: {
  groups: GroupedBarGroup[];
  series: GroupedBarSeries[];
  height?: number;
}) {
  const max = Math.max(1, ...groups.flatMap((g) => g.values));
  const groupWidth = 96;
  const width = Math.max(340, groups.length * groupWidth + 24);
  const top = 12;
  const bottom = height - 28;
  const plotHeight = bottom - top;
  const barWidth = 18;
  const gap = 6;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de barras agrupadas">
      {[0.25, 0.5, 0.75, 1].map((tick) => {
        const y = bottom - plotHeight * tick;
        return (
          <g key={tick}>
            <line x1={12} x2={width - 12} y1={y} y2={y} stroke="rgb(var(--border))" strokeWidth={1} strokeDasharray="3 4" />
            <text x={8} y={y + 3} fontSize={9} textAnchor="end" fill="rgb(var(--ink-faint-rgb))">
              {Math.round(max * tick)}
            </text>
          </g>
        );
      })}

      {groups.map((group, gi) => {
        const groupX = 12 + gi * groupWidth;
        const innerWidth = series.length * barWidth + (series.length - 1) * gap;
        const startX = groupX + (groupWidth - innerWidth) / 2;

        return (
          <g key={group.label}>
            {series.map((s, si) => {
              const value = group.values[si] ?? 0;
              const barHeight = max > 0 ? (Math.max(value, 0) / max) * plotHeight : 0;
              const x = startX + si * (barWidth + gap);
              const y = bottom - barHeight;
              return (
                <rect
                  key={s.name}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={s.color}
                  opacity={0.9}
                >
                  <title>{`${group.label} · ${s.name}: ${value}`}</title>
                </rect>
              );
            })}
            <text
              x={groupX + groupWidth / 2}
              y={height - 10}
              fontSize={10}
              textAnchor="middle"
              fill="rgb(var(--ink-faint-rgb))"
            >
              {group.label}
            </text>
          </g>
        );
      })}

      <line x1={12} x2={width - 12} y1={bottom} y2={bottom} stroke="rgb(var(--border-strong))" strokeWidth={1} />
    </svg>
  );
}

export interface DonutPart {
  label: string;
  value: number;
  color: string;
}

export function Donut({ parts, size = 168, thickness = 24 }: { parts: DonutPart[]; size?: number; thickness?: number }) {
  const total = Math.max(parts.reduce((suma, p) => suma + Math.max(p.value, 0), 0), 1);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Gráfico de anillo">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth={thickness}
        />
        {parts.map((part, i) => {
          const dash = (Math.max(part.value, 0) / total) * circumference;
          const element = (
            <circle
              key={`${part.label}-${i}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={part.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${center} ${center})`}
            >
              <title>{`${part.label}: ${part.value}`}</title>
            </circle>
          );
          offset += dash;
          return element;
        })}
      </svg>
      <div className="flex min-w-[140px] flex-1 flex-col gap-2">
        {parts.map((part) => (
          <div key={part.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: part.color }} />
            <span style={{ color: "rgb(var(--ink-muted-rgb))" }}>{part.label}</span>
            <span className="ml-auto font-semibold" style={{ color: "rgb(var(--ink-rgb))" }}>
              {part.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressBar({
  label,
  value,
  max,
  color,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const percent = max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span style={{ color: "rgb(var(--ink-muted-rgb))" }}>{label}</span>
        <span className="font-semibold" style={{ color: "rgb(var(--ink-rgb))" }}>
          {suffix ?? `${Math.round(percent)}%`}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgb(var(--bg-rgb))" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function ChartLegend({ series }: { series: GroupedBarSeries[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {series.map((s) => (
        <div key={s.name} className="flex items-center gap-2 text-xs" style={{ color: "rgb(var(--ink-muted-rgb))" }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
          {s.name}
        </div>
      ))}
    </div>
  );
}

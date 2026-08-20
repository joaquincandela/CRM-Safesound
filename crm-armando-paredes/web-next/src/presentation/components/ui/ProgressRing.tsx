import type { CSSProperties } from "react";

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({ value, max, size = 132, strokeWidth = 11, label, sublabel }: ProgressRingProps) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const pct = Math.round(ratio * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  const color = ratio >= 1 ? "rgb(var(--green-rgb))" : ratio >= 0.6 ? "rgb(var(--gold-rgb))" : "rgb(var(--red-rgb))";

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(var(--bg-rgb))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label ? (
          <span className="text-xl font-bold" style={{ color: "rgb(var(--ink-rgb))" }}>
            {label}
          </span>
        ) : (
          <span className="text-xl font-bold" style={{ color }}>
            {pct}%
          </span>
        )}
        {sublabel && (
          <span className="text-3xs uppercase tracking-[0.14em]" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

// Shared optimization progress block (ring, current operation, detail line, bar).
// Kept in its own module so RunModal and RestorePoint can both use it without an import cycle.
import { Badge, Bar } from "./kit";

/** Shared optimization progress block: ring, current operation, detail line and bar. */
export function OpProgress({
  value,
  title,
  detail,
  active,
}: {
  value: number;
  title: string;
  detail: string;
  active?: boolean | undefined;
}) {
  const r = 24;
  const len = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="eo-op">
      <div className="eo-op-head">
        <div className="eo-op-ring" aria-hidden="true">
          <svg viewBox="0 0 56 56" width="56" height="56">
            <defs>
              <linearGradient id="eo-op-grad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" />
                <stop offset="100%" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
            <circle className="eo-op-track" cx="28" cy="28" r={r} />
            <circle
              className="eo-op-arc"
              cx="28"
              cy="28"
              r={r}
              strokeDasharray={len.toFixed(2)}
              strokeDashoffset={(len * (1 - v / 100)).toFixed(2)}
            />
          </svg>
          <span>{Math.round(v)}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="eo-op-current">
            <span key={title}>{title}</span>
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">{detail}</div>
          <Badge tone="cyan" className="mt-1.5">
            SIMULATED
          </Badge>
        </div>
      </div>
      <Bar value={v} active={active} />
    </div>
  );
}

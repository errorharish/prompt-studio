// Title-bar chip: Auto Optimize state + countdown, visible on every page while enabled.
import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { useAutoOptimize, useNow } from "./autoOptimizeStore";
import { STATUS_TONE, engineStatus } from "./AutoOptimizePanel";
import { formatCountdown } from "@/lib/eo/autoOptimize";

export function AutoChip() {
  const s = useAutoOptimize();
  const now = useNow();
  const status = engineStatus(s);
  if (status === "Disabled") return null;
  const text =
    status === "Running"
      ? "RUNNING"
      : status === "Paused"
        ? "PAUSED"
        : status === "Suspended"
          ? "SUSPENDED"
          : s.nextAt && now
            ? formatCountdown(s.nextAt - now)
            : "—";
  return (
    <Link
      to="/$page"
      params={{ page: "auto-optimize" }}
      title="Auto Optimize (simulated) — open settings"
      aria-label={`Auto Optimize ${status}${status === "Enabled" ? `, next run in ${text}` : ""}. Simulated.`}
      className="eo-auto-chip"
      data-tone={STATUS_TONE[status]}
    >
      <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
      AUTO <span className="font-mono tabular-nums">{text}</span>
    </Link>
  );
}

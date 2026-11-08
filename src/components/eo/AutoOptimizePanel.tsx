// Dashboard Auto Optimize panel — control centre for the recurring maintenance engine.
// State comes from the shared simulated scheduler (autoOptimizeStore); configuration lives on
// the Auto Optimize page. Nothing on the real computer is changed.
import { Link } from "@tanstack/react-router";
import { CalendarClock, Pause, Play, Settings2, Square, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { Badge, Btn, Card, Label } from "./kit";
import { GuideTip } from "./Guide";
import { autoOptimize, useAutoOptimize, useNow, type AutoState } from "./autoOptimizeStore";
import { MAINT_TASKS, formatCountdown, formatInterval } from "@/lib/eo/autoOptimize";

export const clockTime = (t: number | null) =>
  t
    ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "—";

export function relTime(t: number | null, now: number) {
  if (!t) return "Never";
  if (!now) return clockTime(t);
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(t).toLocaleDateString();
}

export type EngineStatus = "Running" | "Enabled" | "Paused" | "Disabled" | "Suspended";
export function engineStatus(s: AutoState): EngineStatus {
  if (s.run) return "Running";
  if (!s.config.enabled) return "Disabled";
  if (s.config.paused) return "Paused";
  if (s.power === "app-closed" || s.power === "pc-off") return "Suspended";
  return "Enabled";
}
export const STATUS_TONE = {
  Running: "cyan",
  Enabled: "success",
  Paused: "warning",
  Disabled: "muted",
  Suspended: "warning",
} as const;

export function StatusPill({ status }: { status: EngineStatus }) {
  return (
    <span className="eo-status-pill" data-tone={STATUS_TONE[status]} role="status">
      <span aria-hidden="true" className="eo-status-dot" />
      {status}
    </span>
  );
}

/** Countdown block — the only part of the panel that re-renders every second. */
function Countdown({ s }: { s: AutoState }) {
  const now = useNow();
  const status = engineStatus(s);
  const total = s.config.intervalMin * 60_000;
  const remaining =
    s.nextAt !== null && now ? Math.max(0, s.nextAt - now) : (s.pausedRemaining ?? null);
  const frac = remaining === null ? 0 : 1 - Math.min(1, remaining / total);
  return (
    <div className="eo-countdown" data-state={status}>
      <Label className="text-[9.5px]">
        {status === "Running"
          ? "MAINTENANCE IN PROGRESS"
          : status === "Paused"
            ? "PAUSED · TIME LEFT"
            : status === "Disabled"
              ? "NOT SCHEDULED"
              : status === "Suspended"
                ? "SUSPENDED (SIMULATED)"
                : "NEXT MAINTENANCE IN"}
      </Label>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="eo-countdown-value font-mono tabular-nums">
          {status === "Disabled" || remaining === null || status === "Suspended"
            ? "--:--"
            : formatCountdown(remaining)}
        </span>
        {s.nextAt !== null && status === "Enabled" && (
          <span className="text-[11px] font-semibold text-muted-foreground">
            at {clockTime(s.nextAt)}
          </span>
        )}
      </div>
      <div
        className="eo-interval-track mt-2"
        role="progressbar"
        aria-label="Time elapsed in the current interval"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(frac * 100)}
      >
        <span style={{ "--v": frac } as CSSProperties} />
      </div>
      <div className="mt-1.5 text-[11px] font-semibold">{formatInterval(s.config.intervalMin)}</div>
    </div>
  );
}

function RunProgress({ s }: { s: AutoState }) {
  const run = s.run;
  if (!run) return null;
  const done = run.items.filter((i) => i.state !== "Pending" && i.state !== "Running").length;
  return (
    <div className="eo-swap">
      <div className="mb-1.5 flex items-center justify-between text-[10.5px] font-bold">
        <span className="text-cyan">
          {run.trigger.toUpperCase()} RUN · {done}/{run.items.length}
        </span>
        <Btn size="sm" variant="ghost" onClick={autoOptimize.cancel}>
          <Square aria-hidden="true" className="h-3 w-3" /> Cancel
        </Btn>
      </div>
      <ul className="space-y-1" aria-live="polite">
        {run.items.map((i) => (
          <li key={i.taskId} className="eo-run-row" data-state={i.state}>
            <span aria-hidden="true" className="eo-run-dot" />
            <span className="min-w-0 flex-1 truncate">{i.name}</span>
            <span className="eo-run-state">{i.state === "Running" ? "Working…" : i.state}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AutoOptimizePanel() {
  const s = useAutoOptimize();
  const now = useNow();
  const status = engineStatus(s);
  const c = s.config;
  const runs = s.history.filter((h) => h.kind === "run").slice(0, 3);
  const noTasks = !c.tasks.length;

  return (
    <Card className="eo-hero eo-auto flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="eo-auto-mark" aria-hidden="true">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-black uppercase">Auto Optimize</h2>
              <GuideTip id="dashboard.auto" />
              <StatusPill status={status} />
              <Badge tone="warning">SIMULATED</Badge>
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Recurring maintenance engine · runs the tasks you choose on your schedule.
            </p>
          </div>
        </div>
        <Link to="/$page" params={{ page: "auto-optimize" }}>
          <Btn size="sm">
            <Settings2 aria-hidden="true" className="h-3.5 w-3.5" /> Configure
          </Btn>
        </Link>
      </div>

      <div
        className="eo-auto-grid mt-3 grid flex-1 gap-3"
        style={{ gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr)" }}
      >
        <div className="flex flex-col gap-2.5">
          {s.run ? <RunProgress s={s} /> : <Countdown s={s} />}
          <dl className="eo-auto-facts">
            {(
              [
                ["Last run", relTime(s.lastRunAt, now)],
                ["Tasks", `${c.tasks.length} of ${MAINT_TASKS.length} selected`],
                ["Profile", c.profile],
                [
                  "Lifecycle",
                  [c.runOnLaunch && "On launch", c.runOnWindowsStartup && "Windows startup"]
                    .filter(Boolean)
                    .join(" · ") || "Schedule only",
                ],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section aria-labelledby="eo-recent-maint" className="eo-auto-recent">
          <Label as="h3" id="eo-recent-maint" className="mb-1.5 text-[9.5px]">
            RECENT MAINTENANCE
          </Label>
          {!runs.length ? (
            <p className="text-[11.5px] text-muted-foreground">
              No maintenance has run yet. Enable Auto Optimize or use Run now.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {runs.map(
                (r) =>
                  r.kind === "run" && (
                    <li key={r.id} className="eo-recent-row">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11.5px] font-bold">{r.trigger} run</span>
                        <Badge
                          tone={
                            r.summary.status === "Completed"
                              ? "success"
                              : r.summary.status === "Cancelled"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {r.summary.status}
                        </Badge>
                      </div>
                      <div className="text-[10.5px] text-muted-foreground">
                        {clockTime(r.at)} · {r.summary.completed} completed · {r.summary.skipped}{" "}
                        skipped
                      </div>
                    </li>
                  ),
              )}
            </ul>
          )}
          <Link
            to="/$page"
            params={{ page: "auto-optimize" }}
            hash="history"
            className="eo-link mt-2 inline-block text-[10.5px] font-bold"
          >
            View full history →
          </Link>
        </section>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-[10.5px] text-subtle">
          {noTasks
            ? "Select at least one maintenance task to enable Auto Optimize."
            : "Runs only while this tab is open · native background agent documented in Blueprint."}
        </span>
        <div className="flex flex-wrap gap-2">
          <Btn variant="ghost" disabled={!!s.run || noTasks} onClick={autoOptimize.runNow}>
            <Zap aria-hidden="true" className="h-3.5 w-3.5" /> Run now
          </Btn>
          {!c.enabled ? (
            <Btn variant="primary" size="lg" disabled={noTasks} onClick={autoOptimize.enable}>
              <Play aria-hidden="true" className="h-4 w-4" /> Enable Auto Optimize
            </Btn>
          ) : c.paused ? (
            <Btn variant="primary" size="lg" onClick={autoOptimize.resume}>
              <Play aria-hidden="true" className="h-4 w-4" /> Resume
            </Btn>
          ) : (
            <Btn size="lg" onClick={autoOptimize.pause}>
              <Pause aria-hidden="true" className="h-4 w-4" /> Pause
            </Btn>
          )}
        </div>
      </div>
    </Card>
  );
}

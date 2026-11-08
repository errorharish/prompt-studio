// System Telemetry — System Health Check. Scores a fixed SAMPLE snapshot with the documented
// rules in src/lib/eo/health.ts (same data → same score). Recommendations are informative and
// never start an optimization.
import { useMemo, useSyncExternalStore, type CSSProperties } from "react";
import { Activity, AlertTriangle, HeartPulse, Info } from "lucide-react";
import { Badge, Btn, Card, DemoBadge, Details, SectionTitle, useSimRun } from "./kit";
import { OpProgress } from "./OpProgress";
import { AnimatedNumber, CountUp, ScoreRing } from "./controls";
import {
  ATTENTION_BELOW,
  KIND_LABEL,
  MIN_COVERAGE,
  SAMPLE_HEALTH,
  evaluateHealth,
  metricScore,
} from "@/lib/eo/health";

const KEY = "eo-health-last";
let last: string | null | undefined;
const listeners = new Set<() => void>();
const readLast = () => {
  if (last === undefined) {
    try {
      last = window.localStorage.getItem(KEY);
    } catch {
      last = null;
    }
  }
  return last;
};
const writeLast = (v: string) => {
  last = v;
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    /* keep in memory */
  }
  listeners.forEach((l) => l());
};

const STAGES = [
  "Reading CPU readings…",
  "Reading memory readings…",
  "Reading GPU readings…",
  "Reading storage readings…",
  "Checking responsiveness…",
  "Calculating score…",
];

const FINDINGS: [status: "PASS" | "WARNING", area: string, text: string][] = [
  ["PASS", "HARDWARE", "CPU thermals within envelope"],
  ["PASS", "SECURITY", "UEFI Secure Boot enabled"],
  ["WARNING", "SECURITY", "Core Isolation (HVCI) is off"],
  ["PASS", "HARDWARE", "Memory running at EXPO speed"],
  ["PASS", "DRIVERS", "No driver problems reported"],
];

export function HealthCheck() {
  const lastCheck = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readLast,
    () => null,
  );
  const run = useSimRun(2600);
  const result = useMemo(() => evaluateHealth(SAMPLE_HEALTH), []);
  const has = Boolean(lastCheck) && !run.running;
  const stage =
    STAGES[Math.min(STAGES.length - 1, Math.floor(((run.progress ?? 0) / 100) * STAGES.length))];
  const tone =
    result.status === "Excellent" ? "success" : result.status === "Good" ? "cyan" : "warning";

  return (
    <Card className="eo-health">
      <SectionTitle
        title="SYSTEM HEALTH CHECK"
        guide="telemetry.health"
        badge={<DemoBadge label="SAMPLE DATA" />}
        sub="Scores the readings below · same data always gives the same score"
        right={
          <Btn
            variant="primary"
            size="sm"
            loading={run.running}
            onClick={() => run.start(() => writeLast(new Date().toLocaleString()))}
          >
            <HeartPulse aria-hidden="true" className="h-3.5 w-3.5" />
            {lastCheck ? "Run again" : "Run health check"}
          </Btn>
        }
      />

      <div className="eo-health-grid">
        <div className="eo-health-score">
          <ScoreRing
            size={132}
            stroke={10}
            value={has && result.overall !== null ? result.overall : 0}
            label={
              has && result.overall !== null
                ? `System health ${result.overall} out of 100, ${result.status}. Sample data.`
                : "No health score yet"
            }
          >
            {has && result.overall !== null ? (
              <CountUp value={result.overall} className="text-[34px] leading-none font-black" />
            ) : (
              <span className="text-[30px] leading-none font-black text-subtle">—</span>
            )}
            <span className="mt-0.5 text-[10px] font-bold text-subtle">/ 100</span>
          </ScoreRing>
          {has ? (
            <>
              <Badge tone={tone} className="mt-2">
                {result.status}
              </Badge>
              <dl className="eo-health-meta">
                <div>
                  <dt>Last check</dt>
                  <dd>{lastCheck}</dd>
                </div>
                <div>
                  <dt>Data coverage</dt>
                  <dd>{Math.round(result.coverage * 100)}% of weight measured</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {run.running ? "Analysing…" : "Run a check to calculate the score."}
            </p>
          )}
        </div>

        <div className="min-w-0">
          {run.running ? (
            <OpProgress
              value={run.progress ?? 0}
              title={stage ?? "Analysing…"}
              detail="Evaluating sample readings · nothing is measured on this PC"
              active
            />
          ) : (
            <ul className="eo-health-cats" aria-label="Category scores">
              {result.categories.map((c, i) => {
                const cat = SAMPLE_HEALTH.find((x) => x.key === c.key);
                const kinds = [...new Set(cat?.metrics.map((m) => KIND_LABEL[m.kind]))];
                const show = has && c.score !== null;
                return (
                  <li key={c.key} data-missing={has && c.score === null ? "true" : undefined}>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-bold">{c.label}</span>
                      <span className="block truncate text-[10.5px] text-subtle">
                        {kinds.join(" · ")} · weight {Math.round(c.weight * 100)}%
                      </span>
                    </span>
                    <span
                      className="eo-score-bar"
                      style={{ "--v": `${show ? c.score : 0}%`, "--i": i } as CSSProperties}
                    />
                    <span className="text-right text-[12px] font-bold tabular-nums">
                      {!has ? "—" : c.score === null ? "N/A" : <AnimatedNumber value={c.score} duration={850} />}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {has && (
        <div className="mt-3">
          <div className="eo-label mb-2 flex items-center gap-1.5 text-[10px] text-foreground">
            <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 text-warning" />
            ATTENTION AREAS · {result.attention.length}
          </div>
          {result.attention.length ? (
            <ul className="eo-health-attn">
              {result.attention.map((a) => (
                <li key={a.metric} data-missing={a.score === null ? "true" : undefined}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-bold">{a.finding}</span>
                    <Badge tone={a.score === null ? "muted" : "warning"}>
                      {a.score === null ? "NOT MEASURED" : `${a.score} / 100`}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-subtle">
                    {a.category} · {KIND_LABEL[a.kind]}
                  </span>
                  <span className="mt-1 block text-[11.5px] text-muted-foreground">{a.advice}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-muted-foreground">No areas need attention.</p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-subtle">
            <Info aria-hidden="true" className="h-3 w-3" />
            Recommendations are information only — nothing runs automatically. High load is resource
            use, not a hardware fault.
          </p>
        </div>
      )}

      <Details inline title="How the score is calculated" hint="Inputs, weights and missing data">
        <ol className="eo-rp-steps mb-3">
          <li>
            Each reading gets 0–100: load ≤ 60% = 100, then −1.75 per %; temperatures score 100 up
            to their warning point and fall to 40 at the critical point; drive use ≤ 75% = 100;
            drive health is used as reported.
          </li>
          <li>A category takes its worst reading, so one hot drive is not hidden by good ones.</li>
          <li>
            The overall score is the weighted average of measured categories. Missing readings are
            left out and shown as coverage — never counted as perfect.
          </li>
          <li>
            Below {Math.round(MIN_COVERAGE * 100)}% coverage there is no score. Readings under{" "}
            {ATTENTION_BELOW} are listed as attention areas.
          </li>
          <li>85+ Excellent · 70–84 Good · below 70 Needs Attention.</li>
        </ol>
        <table className="eo-health-table">
          <thead>
            <tr>
              <th>Reading</th>
              <th>Type</th>
              <th>Sample value</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_HEALTH.flatMap((c) =>
              c.metrics.map((m) => {
                const s = metricScore(m);
                return (
                  <tr key={m.key}>
                    <td>
                      {c.label} · {m.label}
                    </td>
                    <td>{KIND_LABEL[m.kind]}</td>
                    <td>{m.value === null ? "Not measured" : `${m.value}${m.unit}`}</td>
                    <td className="tabular-nums">{s === null ? "—" : s}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </Details>
      <Details inline title="Diagnostic findings" hint={`${FINDINGS.length} sample checks`}>
        <ul className="space-y-1.5">
          {FINDINGS.map(([st, area, text]) => (
            <li
              key={text}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-window px-3 py-1.5 text-[12px]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Activity aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-subtle" />
                <span className="truncate">{text}</span>
              </span>
              <span className="flex shrink-0 gap-1.5">
                <Badge>{area}</Badge>
                <Badge tone={st === "PASS" ? "success" : "warning"}>{st}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </Details>
    </Card>
  );
}

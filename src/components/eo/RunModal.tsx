// Mirrors UniversalOptimizationModal: Approve → Internal backup → staged run → summary.
// Every phase is simulated. The summary reports only what the prototype did (nothing on this PC).
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShieldCheck, Square, Zap, AlertTriangle } from "lucide-react";
import { Badge, Bar, Btn, Chips, Details, KV, Modal, RiskBadge, StatTiles, Stepper } from "./kit";
import type { Risk } from "@/lib/eo/data";
import { OpProgress } from "./OpProgress";
import { simulatedRunSummary, type SimulatedRunSummary } from "@/lib/eo/selection";
import { cn } from "@/lib/utils";

const STAGES = ["ANALYZING", "PREPARING", "APPLYING", "VERIFYING", "FINALIZING"];
const FLOW = ["Approve", "Internal backup", "Simulated run", "Summary"];
type Phase = "approve" | "backup" | "running" | "done" | "cancelled";

export interface RunItem {
  id: string;
  title: string;
  risk: Risk;
  restart?: boolean | undefined;
}

export function RunModal({
  open,
  onClose,
  profile,
  count,
  items,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  profile: string;
  count: number;
  items?: RunItem[] | undefined;
  onComplete?: ((summary: SimulatedRunSummary) => void) | undefined;
}) {
  const [phase, setPhase] = useState<Phase>("approve");
  const [p, setP] = useState(0);
  const [backupName, setBackupName] = useState(`Before ${profile} optimization`);
  const [backupCreated, setBackupCreated] = useState(true);
  const [tab, setTab] = useState("Kernel");
  const [summary, setSummary] = useState<SimulatedRunSummary | null>(null);
  const [highRiskAck, setHighRiskAck] = useState(false);
  const started = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const restartNoted = items?.filter((i) => i.restart).length ?? 0;
  const highRiskItems = items?.filter((i) => i.risk === "HIGH") ?? [];

  useEffect(() => {
    if (open) {
      setPhase("approve");
      setP(0);
      setSummary(null);
      setHighRiskAck(false);
      setBackupCreated(true);
      setBackupName(`Before ${profile} optimization`);
    }
  }, [open, profile]);

  useEffect(() => {
    if (phase !== "running" || !open) return;
    started.current = Date.now();
    const id = setInterval(() => setP((v) => Math.min(100, v + 2)), 60);
    return () => clearInterval(id);
  }, [phase, open]);

  useEffect(() => {
    if (phase !== "running" || p < 100) return;
    const s = simulatedRunSummary(count, restartNoted, Date.now() - started.current);
    setSummary(s);
    setPhase("done");
    completeRef.current?.(s);
  }, [p, phase, count, restartNoted]);

  const stageIdx = Math.min(4, Math.floor(p / 20));
  const flowIdx =
    phase === "approve"
      ? 0
      : phase === "backup"
        ? 1
        : phase === "running" || phase === "cancelled"
          ? 2
          : 4;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${profile} — Optimization`}
      sub="Simulated run. Nothing on this computer is changed."
      width="max-w-xl"
      icon={
        phase === "done" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : phase === "cancelled" ? (
          <Square className="h-4 w-4" />
        ) : phase === "approve" || phase === "backup" ? (
          <ShieldCheck className="h-4 w-4" />
        ) : (
          <Zap className="h-4 w-4" />
        )
      }
      tone={phase === "done" ? "success" : phase === "cancelled" ? "warning" : "cyan"}
      footer={
        phase === "approve" ? (
          <>
            <Btn variant="ghost" onClick={onClose}>
              Cancel optimization
            </Btn>
            <Btn
              variant="primary"
              disabled={!count || (highRiskItems.length > 0 && !highRiskAck)}
              onClick={() => setPhase("backup")}
            >
              Approve & proceed
            </Btn>
          </>
        ) : phase === "backup" ? (
          <>
            <Btn variant="ghost" onClick={() => setPhase("approve")}>
              Back
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => {
                setBackupCreated(false);
                setPhase("running");
              }}
            >
              Skip backup
            </Btn>
            <Btn
              variant="primary"
              disabled={!backupName.trim()}
              onClick={() => {
                setBackupCreated(true);
                setPhase("running");
              }}
            >
              Create backup & continue
            </Btn>
          </>
        ) : phase === "running" ? (
          <Btn variant="danger" onClick={() => setPhase("cancelled")}>
            Stop simulation
          </Btn>
        ) : (
          <>
            <Btn
              variant="ghost"
              onClick={() => {
                setP(0);
                setSummary(null);
                setPhase("running");
              }}
            >
              Run simulation again
            </Btn>
            <Btn variant="primary" onClick={onClose}>
              Close
            </Btn>
          </>
        )
      }
    >
      <div className="mb-4">
        <Stepper steps={FLOW} current={flowIdx} label="Optimization run progress" />
      </div>
      {phase === "approve" && (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {count} selected optimization{count === 1 ? "" : "s"} will be walked through the native
            app's analyze → apply → verify stages as a demonstration. No setting is read or changed.
          </p>
          <KV k="Profile" v={profile} />
          <KV k="Selected items" v={count} />
          {items && (
            <KV
              k="Restart noted in metadata"
              v={restartNoted ? `${restartNoted} item${restartNoted === 1 ? "" : "s"}` : "None"}
            />
          )}
          <KV k="Backup" v="Error Optimizer Application Vault snapshot" />
          <KV k="Rollback" v="Per-operation support in native app" />

          {/* High-Risk Acknowledgement Warning Banner */}
          {highRiskItems.length > 0 && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-warning">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>HIGH-RISK OPTIMIZATIONS INCLUDED ({highRiskItems.length})</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The selected configuration includes advanced kernel optimizations (e.g. CPU priority separation, core unparking, memory paging executive, or driver power states). Explicit acknowledgement is required before proceeding.
              </p>
              <label className="flex items-center gap-2 pt-1 font-semibold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={highRiskAck}
                  onChange={(e) => setHighRiskAck(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-cyan focus:ring-cyan"
                />
                <span>I understand and acknowledge the impact of these high-risk optimizations</span>
              </label>
            </div>
          )}

          {/* Detailed Selected Items List with Risk Badges */}
          {items && items.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
                Selected Operations ({items.length})
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-border bg-window/50 p-2 text-xs">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-2 rounded bg-window px-2.5 py-1.5"
                  >
                    <span className="truncate font-medium text-foreground">{it.title}</span>
                    <RiskBadge risk={it.risk} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {phase === "backup" && (
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border bg-window p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan/40 bg-cyan/10 text-cyan">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground">Application Configuration Backup</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Error Optimizer creates an application-managed configuration snapshot before applying changes. Targeted registry keys, services, and system configuration are snapshotted to Error Optimizer's secure local vault.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label htmlFor="eo-backup-name" className="block text-xs font-semibold text-foreground mb-1.5">
                BACKUP SNAPSHOT NAME
              </label>
              <input
                id="eo-backup-name"
                type="text"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="Enter backup snapshot name…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-cyan focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 border-t border-border/60 pt-3 text-xs">
              <KV k="Storage vault" v="Error Optimizer Application Vault" />
              <KV k="Scope" v={`${count} item${count === 1 ? "" : "s"} (${profile})`} />
              <KV k="Rollback method" v="Full per-operation restore via Backup & Restore" />
              <KV k="System Protection" v="Not required (independent internal snapshot)" />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Error Optimizer internal backup protects all modified settings independently of Windows System Restore.</span>
          </div>
        </div>
      )}
      {(phase === "running" || phase === "cancelled") && (
        <div className="space-y-4">
          <OpProgress
            value={p}
            title={phase === "running" ? `${STAGES[stageIdx]}…` : "Simulation stopped"}
            detail={
              phase === "running"
                ? `Stage ${stageIdx + 1} of ${STAGES.length} · ${Math.round((p / 100) * count)} of ${count} items walked through`
                : `${Math.round((p / 100) * count)} of ${count} items reached · nothing to revert`
            }
            active={phase === "running"}
          />
          <ol aria-label="Run stages" className="grid grid-cols-5 gap-1.5">
            {STAGES.map((s, i) => (
              <li
                key={s}
                aria-current={i === stageIdx && phase === "running" ? "step" : undefined}
                className={cn(
                  "rounded-md border py-1.5 text-center text-[10px] font-bold",
                  i < stageIdx
                    ? "border-success/40 text-success"
                    : i === stageIdx && phase === "running"
                      ? "border-cyan/60 bg-cyan/10 text-cyan"
                      : "border-border text-subtle",
                )}
              >
                {s}
              </li>
            ))}
          </ol>
          <p role="status" aria-live="polite" className="sr-only">
            {phase === "running"
              ? `${STAGES[stageIdx]} ${Math.round(p / 10) * 10}%`
              : "Simulation stopped"}
          </p>
          {phase === "cancelled" && (
            <div
              role="alert"
              className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning"
            >
              Simulation stopped at {p.toFixed(0)}%. Nothing was changed, so there is nothing to
              revert.
            </div>
          )}
        </div>
      )}
      {phase === "done" && summary && (
        <div className="space-y-4" role="status" aria-live="polite">
          <StatTiles
            items={[
              { label: "SELECTED", value: summary.selected },
              { label: "SIMULATED", value: summary.simulatedSteps, tone: "cyan" },
              {
                label: "RESTART NOTED",
                value: items ? summary.restartNoted : "—",
                tone: "warning",
              },
              { label: "CHANGES ON THIS PC", value: summary.realChanges, tone: "success" },
            ]}
          />
          <KV k="Simulation time" v={`${(summary.elapsedMs / 1000).toFixed(1)} s`} />
          <KV
            k="Internal backup"
            v={backupCreated ? `“${backupName}” (Application Vault)` : "Skipped"}
          />
          <KV k="Verification" v={summary.verification} />
          {items && items.length > 0 && (
            <ul
              aria-label="Simulated items"
              className="eo-scroll-fade max-h-44 space-y-1 overflow-y-auto"
            >
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-window px-3 py-1.5 text-[12px]"
                >
                  <span className="min-w-0 truncate">{i.title}</span>
                  <span className="flex shrink-0 gap-1.5">
                    <RiskBadge risk={i.risk} />
                    <Badge tone="cyan">SIMULATED</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Details inline title="ADVANCED DETAILS" hint="4 subsystems">
            <Chips
              label="Advanced details subsystem"
              options={["Kernel", "Network", "Interrupts", "Protected"]}
              value={tab}
              onChange={setTab}
            />
            <div className="mt-2 rounded-lg border border-border bg-window p-3 text-xs text-muted-foreground">
              The native app lists real {tab.toLowerCase()} results here. The prototype has none to
              show, and raw keys stay behind this view.
            </div>
          </Details>
        </div>
      )}
    </Modal>
  );
}

export { OpProgress };

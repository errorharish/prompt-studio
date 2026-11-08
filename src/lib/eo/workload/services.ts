// Service layer: InstalledApplicationDiscovery, RunningProcessMonitor, ApplicationLauncher,
// WorkloadOptimizer (plan application). Conflict resolution lives in optimizer.ts,
// custom app CRUD in customApps.ts, status summary in optimizer.ts (summarizeWorkloads).
import type { WorkloadBackend } from "./backend";
import {
  isCriticalExe,
  type EligibleApp,
  type OptimizationPlan,
  type ProcessEvent,
  type ResolvedWorkload,
  type RunningWorkload,
} from "./types";

export class InstalledApplicationDiscovery {
  constructor(private backend: WorkloadBackend) {}
  async scan(): Promise<EligibleApp[]> {
    const apps = await this.backend.discoverInstalledApps();
    const seen = new Set<string>();
    return apps.filter((a) => {
      const k = a.exe.toLowerCase();
      if (isCriticalExe(a.exe) || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
}

/** Matches a process to an eligible app by full path first, then by executable name. */
export function matchEligibleApp(
  e: Pick<ProcessEvent, "exe" | "path">,
  apps: EligibleApp[],
): EligibleApp | undefined {
  if (e.path) {
    const p = e.path.toLowerCase();
    const byPath = apps.find((a) => a.path.toLowerCase() === p);
    if (byPath) return byPath;
  }
  const exe = (e.exe ?? "").toLowerCase();
  return exe ? apps.find((a) => a.exe.toLowerCase() === exe) : undefined;
}

export interface MonitorState {
  running: RunningWorkload[];
  foregroundPid: number | null;
}

/** Pure reducer for process events — RunningProcessMonitor applies it per event (no polling). */
export function reduceProcessEvent(
  s: MonitorState,
  e: ProcessEvent,
  apps: EligibleApp[],
): MonitorState {
  if (e.type === "process-exit") {
    return {
      running: s.running.filter((w) => w.pid !== e.pid),
      foregroundPid: s.foregroundPid === e.pid ? null : s.foregroundPid,
    };
  }
  if (e.type === "foreground-change") return { ...s, foregroundPid: e.pid };
  if (s.running.some((w) => w.pid === e.pid)) return s;
  if (e.exe && isCriticalExe(e.exe)) return s;
  const app = matchEligibleApp(e, apps);
  if (!app) return s;
  const w: RunningWorkload = {
    pid: e.pid,
    appId: app.id,
    name: app.name,
    exe: app.exe,
    category: app.category,
    startedAt: e.at,
    origin: e.origin ?? "EXTERNAL",
    paused: false,
  };
  // A newly started app normally takes focus.
  return { running: [...s.running, w], foregroundPid: e.pid };
}

export class RunningProcessMonitor {
  private unsub: (() => void) | null = null;
  constructor(
    private backend: WorkloadBackend,
    private onEvent: (e: ProcessEvent) => void,
  ) {}
  start() {
    if (!this.unsub) this.unsub = this.backend.subscribe(this.onEvent);
  }
  stop() {
    this.unsub?.();
    this.unsub = null;
  }
}

export class ApplicationLauncher {
  constructor(private backend: WorkloadBackend) {}
  launch(app: EligibleApp) {
    return this.backend.launch(app);
  }
}

export type OptimizerPhase = "OPTIMIZING" | "OPTIMIZED" | "RESTORED" | "UNCONFIRMED" | "FAILED";

/** Serializes backend changes and checks the latest process state after every acknowledgement. */
export class WorkloadOptimizer {
  private applied = new Map<number, string>();
  private latest: ResolvedWorkload[] = [];
  private revision = 0;
  private pending: Promise<void> | null = null;
  constructor(
    private backend: WorkloadBackend,
    private onPhase: (pid: number, phase: OptimizerPhase, plan?: OptimizationPlan, error?: string) => void = () => {},
  ) {}
  sync(list: ResolvedWorkload[]): Promise<void> {
    this.latest = list;
    this.revision += 1;
    if (!this.pending) {
      this.pending = this.drain().finally(() => { this.pending = null; });
    }
    return this.pending;
  }
  private async drain() {
    let processed = -1;
    while (processed !== this.revision) {
      processed = this.revision;
      const active = new Map(this.latest.filter((w) => w.status !== "PAUSED").map((w) => [w.pid, w]));
      for (const pid of [...this.applied.keys()]) {
        if (active.has(pid)) continue;
        try {
          await this.backend.revertPlan(pid);
          this.applied.delete(pid);
          this.onPhase(pid, "RESTORED");
        } catch (e) {
          this.onPhase(pid, "FAILED", undefined, e instanceof Error ? e.message : "Restoration failed");
        }
      }
      for (const w of active.values()) {
        // A start/exit/stop may arrive while another app is being optimized.
        const current = this.latest.find((x) => x.pid === w.pid && x.status !== "PAUSED");
        if (!current) continue;
        const sig = JSON.stringify(current.plan);
        if (this.applied.get(w.pid) === sig) continue;
        this.onPhase(w.pid, "OPTIMIZING");
        try {
          const result = await this.backend.applyPlan(w.pid, current.plan);
          this.applied.set(w.pid, sig);
          // A legacy void acknowledgement proves request completion, not which methods succeeded.
          const confirmed = result && Array.isArray(result.actions) &&
            ["HIGH", "ABOVE_NORMAL", "NORMAL"].includes(result.priority);
          if (this.latest.some((x) => x.pid === w.pid && x.status !== "PAUSED")) {
            this.onPhase(w.pid, confirmed ? "OPTIMIZED" : "UNCONFIRMED", confirmed ? result : undefined);
          }
        } catch (e) {
          this.onPhase(w.pid, "FAILED", undefined, e instanceof Error ? e.message : "Optimization failed");
        }
      }
    }
  }
}

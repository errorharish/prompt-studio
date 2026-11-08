// Service layer: InstalledApplicationDiscovery, RunningProcessMonitor, ApplicationLauncher,
// WorkloadOptimizer (plan application). Conflict resolution lives in optimizer.ts,
// custom app CRUD in customApps.ts, status summary in optimizer.ts (summarizeWorkloads).
import type { WorkloadBackend } from "./backend";
import {
  isCriticalExe,
  type EligibleApp,
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

/** Applies only changed plans to the backend; reverts paused/exited ones. Never terminates processes. */
export class WorkloadOptimizer {
  private applied = new Map<number, string>();
  constructor(private backend: WorkloadBackend) {}
  async sync(list: ResolvedWorkload[]) {
    const live = new Set(list.map((w) => w.pid));
    for (const pid of [...this.applied.keys()]) {
      if (!live.has(pid)) this.applied.delete(pid); // process exited — nothing to revert
    }
    for (const w of list) {
      if (w.status === "PAUSED") {
        if (this.applied.has(w.pid)) {
          this.applied.delete(w.pid);
          await this.backend.revertPlan(w.pid);
        }
        continue;
      }
      const sig = JSON.stringify(w.plan);
      if (this.applied.get(w.pid) !== sig) {
        this.applied.set(w.pid, sig);
        await this.backend.applyPlan(w.pid, w.plan);
      }
    }
  }
}

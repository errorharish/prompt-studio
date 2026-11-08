// Wires the workload services into one shared, event-driven UI store.
// Custom apps persist in localStorage; running state comes only from process events.
import { useSyncExternalStore } from "react";
import {
  SimulatedWorkloadBackend,
  createWorkloadBackend,
  type WorkloadBackend,
} from "@/lib/eo/workload/backend";
import {
  addCustomApp,
  deleteCustomApp,
  makeCustomApp,
  parseStoredCustomApps,
  updateCustomApp,
  validateCustomApp,
  type CustomAppInput,
} from "@/lib/eo/workload/customApps";
import { resolveWorkloads } from "@/lib/eo/workload/optimizer";
import {
  ApplicationLauncher,
  InstalledApplicationDiscovery,
  RunningProcessMonitor,
  WorkloadOptimizer,
  reduceProcessEvent,
  type MonitorState,
} from "@/lib/eo/workload/services";
import type { EligibleApp, ProcessEvent, ResolvedWorkload } from "@/lib/eo/workload/types";

const CUSTOM_KEY = "eo-workload-custom-apps:v1";

export interface WorkloadView {
  mode: "NATIVE" | "SIMULATED";
  discovered: EligibleApp[];
  custom: EligibleApp[];
  inventory: EligibleApp[];
  workloads: ResolvedWorkload[];
  foregroundPid: number | null;
  launching: string[];
  scanning: boolean;
  lastScanAt: number | null;
  /** PIDs whose optimization profile is being applied right now. */
  optimizing: number[];
}

const EMPTY: WorkloadView = {
  mode: "SIMULATED",
  discovered: [],
  custom: [],
  inventory: [],
  workloads: [],
  foregroundPid: null,
  launching: [],
  scanning: false,
  lastScanAt: null,
  optimizing: [],
};

let view: WorkloadView = EMPTY;
let monitorState: MonitorState = { running: [], foregroundPid: null };
let backend: WorkloadBackend | null = null;
let discovery: InstalledApplicationDiscovery;
let launcher: ApplicationLauncher;
let optimizer: WorkloadOptimizer;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function set(patch: Partial<WorkloadView>) {
  const next = { ...view, ...patch };
  next.inventory = [...next.discovered, ...next.custom];
  view = next;
  emit();
}

function recompute() {
  const workloads = resolveWorkloads(monitorState.running, monitorState.foregroundPid);
  set({ workloads, foregroundPid: monitorState.foregroundPid });
  void optimizer.sync(workloads).catch(() => {});
}

function onProcessEvent(e: ProcessEvent) {
  monitorState = reduceProcessEvent(monitorState, e, view.inventory);
  if (e.type === "process-start" && e.exe) {
    set({ launching: view.launching.filter((x) => x.toLowerCase() !== e.exe!.toLowerCase()) });
  }
  recompute();
}

function saveCustom(list: EligibleApp[]) {
  try {
    window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

function init() {
  if (backend || typeof window === "undefined") return;
  backend = createWorkloadBackend();
  discovery = new InstalledApplicationDiscovery(backend);
  launcher = new ApplicationLauncher(backend);
  optimizer = new WorkloadOptimizer(backend, (pid, phase) => {
    const rest = view.optimizing.filter((p) => p !== pid);
    set({ optimizing: phase === "OPTIMIZING" ? [...rest, pid] : rest });
  });
  let custom: EligibleApp[] = [];
  try {
    custom = parseStoredCustomApps(JSON.parse(window.localStorage.getItem(CUSTOM_KEY) ?? "[]"));
  } catch {
    /* ignore */
  }
  set({ mode: backend.mode, custom });
  new RunningProcessMonitor(backend, onProcessEvent).start();
  void workloadActions.rescan();
}

function subscribe(l: () => void) {
  listeners.add(l);
  init();
  return () => {
    listeners.delete(l);
  };
}

export function useWorkloads(): WorkloadView {
  return useSyncExternalStore(
    subscribe,
    () => view,
    () => EMPTY,
  );
}

function sim(): SimulatedWorkloadBackend | null {
  return backend instanceof SimulatedWorkloadBackend ? backend : null;
}

export const workloadActions = {
  async rescan() {
    if (!backend) return;
    set({ scanning: true });
    try {
      const discovered = await discovery.scan();
      // Custom entries win over a discovered duplicate executable.
      const customExes = new Set(view.custom.map((c) => c.exe.toLowerCase()));
      set({
        discovered: discovered.filter((d) => !customExes.has(d.exe.toLowerCase())),
        lastScanAt: Date.now(),
      });
    } finally {
      set({ scanning: false });
    }
  },
  async launch(app: EligibleApp) {
    if (!backend || view.launching.includes(app.exe)) return;
    set({ launching: [...view.launching, app.exe] });
    try {
      await launcher.launch(app);
    } catch (e) {
      set({ launching: view.launching.filter((x) => x !== app.exe) });
      throw e;
    }
  },
  stopOptimization(pid: number) {
    monitorState = {
      ...monitorState,
      running: monitorState.running.map((w) => (w.pid === pid ? { ...w, paused: true } : w)),
    };
    recompute();
  },
  resumeOptimization(pid: number) {
    monitorState = {
      ...monitorState,
      running: monitorState.running.map((w) => (w.pid === pid ? { ...w, paused: false } : w)),
    };
    recompute();
  },
  custom: {
    validate(input: CustomAppInput, editingId?: string) {
      return validateCustomApp(input, view.inventory, editingId);
    },
    add(input: CustomAppInput) {
      const err = validateCustomApp(input, view.inventory);
      if (err) return err;
      const custom = addCustomApp(
        view.custom,
        makeCustomApp(input, `custom:${Date.now().toString(36)}`),
      );
      saveCustom(custom);
      set({ custom });
      return null;
    },
    update(id: string, input: CustomAppInput) {
      const err = validateCustomApp(input, view.inventory, id);
      if (err) return err;
      const custom = updateCustomApp(view.custom, id, input);
      saveCustom(custom);
      const app = custom.find((c) => c.id === id)!;
      monitorState = {
        ...monitorState,
        running: monitorState.running.map((w) =>
          w.appId === id ? { ...w, name: app.name, category: app.category } : w,
        ),
      };
      set({ custom });
      recompute();
      return null;
    },
    remove(id: string) {
      const custom = deleteCustomApp(view.custom, id);
      saveCustom(custom);
      // Stop tracking it; the process itself is left running.
      monitorState = {
        ...monitorState,
        running: monitorState.running.filter((w) => w.appId !== id),
      };
      set({ custom });
      recompute();
    },
    pickExecutable() {
      return backend?.mode === "NATIVE" ? backend.pickExecutable() : Promise.resolve(null);
    },
  },
  /** Browser-preview stand-ins for things that happen outside ERROR OPTIMIZER. */
  preview: {
    available() {
      return !!sim();
    },
    externalStart(app: EligibleApp) {
      sim()?.simulateExternalStart(app);
    },
    exit(pid: number) {
      sim()?.simulateExit(pid);
    },
    focus(pid: number) {
      sim()?.simulateForeground(pid);
    },
  },
};

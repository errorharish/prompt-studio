// WorkloadOptimizer rules + WorkloadConflictManager. Pure functions.
import type {
  CpuPriority,
  OptimizationPlan,
  ResolvedWorkload,
  RunningWorkload,
  WorkloadCategory,
} from "./types";

export interface CategoryRule {
  label: string;
  /** Exclusive logical cores requested. */
  cores: number;
  foregroundPriority: CpuPriority;
  backgroundPriority: CpuPriority;
  /** Higher weight claims cores first when several workloads compete. */
  weight: number;
  actions: string[];
  memory: string;
  gpu: string;
  /** Sample working set used for the preview RAM summary. */
  sampleMemMb: number;
}

export const CATEGORY_RULES: Record<WorkloadCategory, CategoryRule> = {
  GAMES: {
    label: "Gaming · low latency",
    cores: 6,
    foregroundPriority: "HIGH",
    backgroundPriority: "ABOVE_NORMAL",
    weight: 4,
    actions: [
      "CPU priority boost",
      "Exclusive core affinity",
      "Background updater throttle",
      "High timer resolution",
    ],
    memory: "Working set protected from RAM Limiter · standby refresh on launch",
    gpu: "High-performance GPU preference · hardware scheduling where supported",
    sampleMemMb: 4200,
  },
  CREATIVE: {
    label: "Creative · multi-thread",
    cores: 6,
    foregroundPriority: "HIGH",
    backgroundPriority: "ABOVE_NORMAL",
    weight: 3,
    actions: ["CPU priority boost", "Multi-thread core affinity", "Standby memory shield"],
    memory: "Working set protected · standby memory shield",
    gpu: "High-performance GPU preference for render/playback",
    sampleMemMb: 6200,
  },
  "VIDEO AI": {
    label: "Video AI · GPU compute",
    cores: 4,
    foregroundPriority: "ABOVE_NORMAL",
    backgroundPriority: "NORMAL",
    weight: 2,
    actions: ["GPU compute preference", "Background throttle", "Core affinity for data loading"],
    memory: "Working set protected · large-page friendly allocation",
    gpu: "High-performance GPU for compute (CUDA/DirectML) where supported",
    sampleMemMb: 5400,
  },
  EMULATORS: {
    label: "Emulator · virtualization",
    cores: 4,
    foregroundPriority: "HIGH",
    backgroundPriority: "ABOVE_NORMAL",
    weight: 3,
    actions: ["Virtualization thread isolation", "CPU priority boost", "High timer resolution"],
    memory: "Working set protected from RAM Limiter",
    gpu: "High-performance GPU preference for the emulator renderer",
    sampleMemMb: 3000,
  },
};

/** 8C/16T sample machine. Cores 0–1 always stay with Windows. */
export const DEFAULT_LOGICAL_CORES = 16;
export const RESERVED_CORES = [0, 1];
/** Above this many active workloads, background ones drop to NORMAL to avoid priority inflation. */
export const PRIORITY_INFLATION_LIMIT = 4;
export const MIN_EXCLUSIVE_CORES = 2;

const PAUSED_PLAN: OptimizationPlan = {
  priority: "NORMAL",
  affinity: null,
  memory: "Windows default",
  gpu: "Windows default",
  actions: [],
  notes: ["Optimization stopped · application still running"],
  risk: "Safe",
};

/**
 * WorkloadConflictManager: gives every running workload an independent plan.
 * - affinity sets never overlap and never include reserved Windows cores
 * - only the foreground workload may receive HIGH priority
 * - paused workloads release their cores
 */
export function resolveWorkloads(
  running: RunningWorkload[],
  foregroundPid: number | null,
  logicalCores = DEFAULT_LOGICAL_CORES,
): ResolvedWorkload[] {
  const active = running.filter((w) => !w.paused);
  const order = [...active].sort((a, b) => {
    const fa = a.pid === foregroundPid ? 1 : 0;
    const fb = b.pid === foregroundPid ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const wd = CATEGORY_RULES[b.category].weight - CATEGORY_RULES[a.category].weight;
    if (wd !== 0) return wd;
    return a.startedAt - b.startedAt;
  });

  const pool: number[] = [];
  for (let c = 0; c < logicalCores; c++) if (!RESERVED_CORES.includes(c)) pool.push(c);
  const requested = order.reduce((s, w) => s + CATEGORY_RULES[w.category].cores, 0);
  const contended = requested > pool.length;

  const plans = new Map<number, { plan: OptimizationPlan; contention: boolean }>();
  for (const w of order) {
    const rule = CATEGORY_RULES[w.category];
    const fg = w.pid === foregroundPid;
    const give = Math.min(rule.cores, pool.length);
    const affinity = give >= MIN_EXCLUSIVE_CORES ? pool.splice(0, give) : null;
    let priority: CpuPriority = fg ? rule.foregroundPriority : rule.backgroundPriority;
    if (!fg && active.length > PRIORITY_INFLATION_LIMIT) priority = "NORMAL";
    const notes: string[] = [];
    if (fg) notes.push("Foreground app · protected");
    if (affinity && give < rule.cores)
      notes.push(`Contention · ${give}/${rule.cores} cores available`);
    if (!affinity) notes.push("Contention · shared cores (no exclusive affinity)");
    plans.set(w.pid, {
      plan: {
        priority,
        affinity,
        memory: rule.memory,
        gpu: rule.gpu,
        actions: affinity
          ? rule.actions
          : rule.actions.filter((a) => !a.toLowerCase().includes("affinity")),
        notes,
        risk: priority === "HIGH" ? "Medium" : "Safe",
      },
      contention: contended && (!affinity || give < rule.cores),
    });
  }

  return running.map((w) => {
    const p = plans.get(w.pid);
    return {
      ...w,
      foreground: w.pid === foregroundPid,
      status: w.paused ? "PAUSED" : "OPTIMIZED",
      plan: p ? p.plan : PAUSED_PLAN,
      contention: p ? p.contention : false,
    };
  });
}

export function fmtAffinity(a: number[] | null): string {
  if (!a || a.length === 0) return "Shared (Windows default)";
  const first = a[0]!;
  const last = a[a.length - 1]!;
  return last - first === a.length - 1 ? `Cores ${first}–${last}` : `Cores ${a.join(",")}`;
}

export function fmtPriority(p: CpuPriority): string {
  return p === "ABOVE_NORMAL" ? "Above normal" : p === "HIGH" ? "High" : "Normal";
}

/** WorkloadStatusMonitor summary — feeds the page's summary tiles. */
export function summarizeWorkloads(list: ResolvedWorkload[]) {
  const optimized = list.filter((w) => w.status === "OPTIMIZED");
  return {
    running: list.length,
    optimized: optimized.length,
    paused: list.length - optimized.length,
    autoActions: optimized.reduce((s, w) => s + w.plan.actions.length, 0),
    safe: optimized.filter((w) => w.plan.risk === "Safe").length,
    medium: optimized.filter((w) => w.plan.risk === "Medium").length,
    high: optimized.filter((w) => w.plan.risk === "High").length,
    memMb: list.reduce((s, w) => s + CATEGORY_RULES[w.category].sampleMemMb, 0),
    contention: optimized.some((w) => w.contention),
  };
}

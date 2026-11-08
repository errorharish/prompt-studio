// Shared types for the Workload Optimization engine. No React, no browser APIs.

export type WorkloadCategory = "GAMES" | "CREATIVE" | "VIDEO AI" | "EMULATORS";
export const WORKLOAD_CATEGORIES: WorkloadCategory[] = [
  "GAMES",
  "CREATIVE",
  "VIDEO AI",
  "EMULATORS",
];

/** Where an eligible application was found. SAMPLE = browser-preview data only. */
export type DiscoverySource =
  "REGISTRY" | "INSTALL_DIR" | "KNOWN_PATH" | "RUNNING_PROCESS" | "CUSTOM" | "SAMPLE";

export interface EligibleApp {
  id: string;
  name: string;
  exe: string; // file name, e.g. cs2.exe
  path: string; // full executable path
  category: WorkloadCategory;
  source: DiscoverySource;
}

export type LaunchOrigin = "EO_LAUNCH" | "EXTERNAL";

/** A detected eligible process (raw monitor state, before conflict resolution). */
export interface RunningWorkload {
  pid: number;
  appId: string;
  name: string;
  exe: string;
  category: WorkloadCategory;
  startedAt: number;
  origin: LaunchOrigin;
  /** User pressed Stop Optimization. The process keeps running. */
  paused: boolean;
}

export type CpuPriority = "HIGH" | "ABOVE_NORMAL" | "NORMAL";
export type PlanRisk = "Safe" | "Medium" | "High";

export interface OptimizationPlan {
  priority: CpuPriority;
  /** Exclusive logical cores, or null = Windows default scheduling (shared). */
  affinity: number[] | null;
  memory: string;
  gpu: string;
  actions: string[];
  notes: string[];
  risk: PlanRisk;
}

export type WorkloadStatus = "OPTIMIZED" | "PAUSED";

export interface ResolvedWorkload extends RunningWorkload {
  foreground: boolean;
  status: WorkloadStatus;
  plan: OptimizationPlan;
  contention: boolean;
}

/** Raw event coming from the native process monitor (or the preview simulator). */
export interface ProcessEvent {
  type: "process-start" | "process-exit" | "foreground-change";
  pid: number;
  exe?: string;
  path?: string;
  origin?: LaunchOrigin;
  at: number;
}

export const SYSTEM_CRITICAL_EXES = [
  "explorer.exe",
  "dwm.exe",
  "csrss.exe",
  "svchost.exe",
  "winlogon.exe",
  "lsass.exe",
  "services.exe",
  "smss.exe",
  "wininit.exe",
  "system",
  "registry",
  "audiodg.exe",
  "fontdrvhost.exe",
];

export function isCriticalExe(exe: string): boolean {
  return SYSTEM_CRITICAL_EXES.includes(exe.trim().toLowerCase());
}

export function exeFromPath(path: string): string {
  const parts = path.trim().split(/[\\/]/);
  return parts[parts.length - 1] ?? "";
}

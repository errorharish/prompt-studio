// Dashboard actions, in two separate groups (user-directed):
// • Navigation Shortcuts open an existing page and never run anything.
// • Quick Optimize runs one single action in place on the Dashboard and never navigates.
// Steps reuse operations that already exist elsewhere in the prototype (Auto Optimize tasks,
// Storage, Network, Backup). Pure data + rules — every run is simulated and changes nothing.
import { MAINT_TASKS } from "./autoOptimize";

export type QuickOutcome = "Completed" | "Skipped" | "Failed";

export interface QuickStep {
  t: string;
  detail: string;
  outcome: QuickOutcome;
  /** Why a step was skipped or failed. */
  reason?: string;
}

export interface QuickAction {
  id: string;
  cat: string;
  title: string;
  desc: string;
  /** "navigate" opens `to`; "run" executes in place. */
  kind: "navigate" | "run";
  /** Page slug for navigation shortcuts. */
  to?: string;
  /** Where the underlying operation exists in the prototype. */
  source: string;
  steps: QuickStep[];
  /** Runs a dedicated workflow instead of the step list. */
  flow?: "restore-point";
}

const task = (id: string): QuickStep => {
  const t = MAINT_TASKS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown maintenance task ${id}`);
  return { t: t.name, detail: t.sample, outcome: "Completed" };
};

/** Group 1 — navigation shortcuts: open an existing page, never execute anything. */
export const NAV_SHORTCUTS: QuickAction[] = [
  {
    id: "one-click",
    cat: "FULL TUNE",
    title: "One-Click Optimize",
    desc: "Analyze, review and confirm recommended changes",
    kind: "navigate",
    to: "one-click",
    source: "1-Click Optimization",
    steps: [],
  },
  {
    id: "boost",
    cat: "PERFORMANCE",
    title: "Boost Performance",
    desc: "Maximum Performance profile for gaming and rendering",
    kind: "navigate",
    to: "max-performance",
    source: "Maximum Performance",
    steps: [],
  },
  {
    id: "startup",
    cat: "BOOT",
    title: "Startup Manager",
    desc: "Review apps that launch with Windows",
    kind: "navigate",
    to: "startup-manager",
    source: "Startup Manager",
    steps: [],
  },
  {
    id: "telemetry",
    cat: "DIAGNOSTICS",
    title: "View Telemetry",
    desc: "Live charts, hardware and the System Health Check",
    kind: "navigate",
    to: "system-info",
    source: "System Telemetry",
    steps: [],
  },
];

/** Group 2 — Quick Optimize: one action each, executed in place on the Dashboard. */
export const QUICK_OPTIMIZE: QuickAction[] = [
  {
    id: "ram",
    cat: "MEMORY",
    title: "Memory Cleanup",
    desc: "Empty the standby list and refresh idle working sets",
    kind: "run",
    source: "Auto Optimize · Free Standby Memory",
    steps: [
      task("mem-standby"),
      { t: "Idle working-set refresh", detail: "Background processes only", outcome: "Completed" },
      {
        t: "Active app working sets",
        detail: "Not trimmed",
        outcome: "Skipped",
        reason: "Running apps are never trimmed",
      },
    ],
  },
  {
    id: "temp",
    cat: "STORAGE",
    title: "Temporary File Cleanup",
    desc: "Windows and user temp folders and old crash reports",
    kind: "run",
    source: "Auto Optimize · Clean Temp Files / Storage",
    steps: [
      task("temp-windows"),
      task("temp-user"),
      task("temp-crash"),
      {
        t: "Files in use or modified in the last 24 h",
        detail: "Left in place",
        outcome: "Skipped",
        reason: "Locked and recent files are never forced",
      },
    ],
  },
  {
    id: "cache",
    cat: "CACHE",
    title: "Cache Cleanup",
    desc: "Shader cache and closed browsers' cache — cache only",
    kind: "run",
    source: "Auto Optimize · Browser cache / System caches",
    steps: [
      task("sys-shader"),
      task("browser-chrome"),
      task("browser-edge"),
      {
        t: "Mozilla Firefox cache",
        detail: "Firefox is open (sample)",
        outcome: "Skipped",
        reason: "Browser caches are cleared only while that browser is closed",
      },
    ],
  },
  {
    id: "network",
    cat: "NETWORK",
    title: "Network Boost",
    desc: "Remove multimedia throttling and calibrate TCP auto-tuning",
    kind: "run",
    source: "Network / Optimization catalog",
    steps: [
      {
        t: "Disable Multimedia Network Throttling Index",
        detail: "Throttling removed",
        outcome: "Completed",
      },
      {
        t: "TCP Window Auto-Tuning Calibration (Normal)",
        detail: "Set to Normal",
        outcome: "Completed",
      },
      task("sys-dns"),
    ],
  },
  {
    id: "restore",
    cat: "SAFETY",
    title: "Create Restore Point",
    desc: "Checks System Protection, then creates a restore point",
    kind: "run",
    source: "Backup & Restore",
    steps: [],
    flow: "restore-point",
  },
];

export const QUICK_ACTIONS: QuickAction[] = [...NAV_SHORTCUTS, ...QUICK_OPTIMIZE];

/** Navigation shortcuts leave the Dashboard; Quick Optimize actions never do. */
export const navigatesAway = (a: QuickAction) => a.kind === "navigate";

/** A new quick action may start only when none is running (no duplicate or parallel runs). */
export const canStartQuick = (runningId: string | null) => runningId === null;

/** Index of the step shown as "current" for a 0–100 progress value. */
export function quickStepAt(a: QuickAction, progress: number): number {
  if (!a.steps.length) return -1;
  return Math.min(a.steps.length - 1, Math.floor((progress / 100) * a.steps.length));
}

export interface QuickResult {
  completed: number;
  skipped: number;
  failed: number;
  /** Always 0: the prototype never changes the computer. */
  realChanges: 0;
  status: "Completed" | "Skipped" | "Failed";
}

export function quickResult(a: QuickAction): QuickResult {
  const n = (o: QuickOutcome) => a.steps.filter((s) => s.outcome === o).length;
  const completed = n("Completed");
  const skipped = n("Skipped");
  const failed = n("Failed");
  return {
    completed,
    skipped,
    failed,
    realChanges: 0,
    status: failed ? "Failed" : completed ? "Completed" : "Skipped",
  };
}

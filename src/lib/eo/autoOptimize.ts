// Auto Optimize — recurring maintenance engine (pure rules, no timers, no I/O).
// The original AutoOptimizeView exposes two actions (Clean Temp Files, Free Standby Memory).
// The other tasks below come from operations that already exist elsewhere in the project
// (Storage cleaner categories, System Tools, Recycle Bin). Nothing here touches the real system.

export type MaintCategory = "TEMP" | "MEMORY" | "BROWSER" | "RECYCLE" | "SYSTEM";
export type MaintRisk = "SAFE" | "LOW" | "CONFIRM";

export interface MaintTask {
  id: string;
  category: MaintCategory;
  name: string;
  desc: string;
  risk: MaintRisk;
  /** Where the operation already exists in the project. */
  source: string;
  details: string;
  /** Selected in a fresh configuration: every eligible task except ones needing confirmation. */
  recommended: boolean;
  browser?: "Chrome" | "Edge" | "Firefox";
  /** Sample amount shown in history — prototype data, never measured. */
  sample: string;
}

export const MAINT_CATEGORIES: { key: MaintCategory; title: string; sub: string }[] = [
  { key: "TEMP", title: "Temporary files", sub: "Leftover files Windows and apps no longer need" },
  { key: "MEMORY", title: "Memory maintenance", sub: "Release idle standby memory" },
  {
    key: "BROWSER",
    title: "Browser cache",
    sub: "Cache only — passwords, cookies, logins, autofill and history are never touched",
  },
  { key: "RECYCLE", title: "Recycle Bin", sub: "Permanently deletes items already in the bin" },
  { key: "SYSTEM", title: "System caches", sub: "Safe Windows cache maintenance" },
];

export const MAINT_TASKS: MaintTask[] = [
  {
    id: "temp-windows",
    category: "TEMP",
    name: "Windows temporary files",
    desc: "Clears C:\\Windows\\Temp. Files in use are skipped.",
    risk: "SAFE",
    source: "Auto Optimize · Clean Temp Files",
    details:
      "Only files older than the safe-age threshold are removed. Locked files are skipped, never forced.",
    recommended: true,
    sample: "412 MB · 1,284 files",
  },
  {
    id: "temp-user",
    category: "TEMP",
    name: "Current user temporary files",
    desc: "Clears %LOCALAPPDATA%\\Temp for the signed-in user.",
    risk: "SAFE",
    source: "Auto Optimize · Clean Temp Files",
    details: "Per-user temp folder only. Other users' folders are not touched.",
    recommended: true,
    sample: "268 MB · 932 files",
  },
  {
    id: "temp-crash",
    category: "TEMP",
    name: "Crash dumps & error reports",
    desc: "Removes old Windows Error Reporting files and minidumps.",
    risk: "SAFE",
    source: "Storage · Crash dumps & error reports",
    details: "Keeps the most recent dump so a fresh crash can still be investigated.",
    recommended: true,
    sample: "96 MB · 14 files",
  },
  {
    id: "mem-standby",
    category: "MEMORY",
    name: "Empty Standby List",
    desc: "Releases cached standby pages back to free memory.",
    risk: "SAFE",
    source: "Auto Optimize · Free Standby Memory",
    details: "Standby List Purge. Active working sets of running apps are not trimmed.",
    recommended: true,
    sample: "3.1 GB released",
  },
  {
    id: "browser-chrome",
    category: "BROWSER",
    name: "Google Chrome cache",
    desc: "Cached images and files for all Chrome profiles.",
    risk: "SAFE",
    browser: "Chrome",
    source: "Storage · Browser caches (logins preserved)",
    details:
      "Cache folders only. Skipped while Chrome is running — Chrome is never closed for you.",
    recommended: true,
    sample: "540 MB",
  },
  {
    id: "browser-edge",
    category: "BROWSER",
    name: "Microsoft Edge cache",
    desc: "Cached images and files for all Edge profiles.",
    risk: "SAFE",
    browser: "Edge",
    source: "Storage · Browser caches (logins preserved)",
    details: "Cache folders only. Skipped while Edge is running — Edge is never closed for you.",
    recommended: true,
    sample: "310 MB",
  },
  {
    id: "browser-firefox",
    category: "BROWSER",
    name: "Mozilla Firefox cache",
    desc: "cache2 folder for all Firefox profiles.",
    risk: "SAFE",
    browser: "Firefox",
    source: "Storage · Browser caches (logins preserved)",
    details:
      "Cache folders only. Skipped while Firefox is running — Firefox is never closed for you.",
    recommended: true,
    sample: "188 MB",
  },
  {
    id: "recycle-bin",
    category: "RECYCLE",
    name: "Empty Recycle Bin",
    desc: "Permanently deletes everything in the Recycle Bin on all drives.",
    risk: "CONFIRM",
    source: "Storage · Windows Recycle Bin",
    details:
      "Deleted items cannot be restored afterwards. Governed by the Recycle Bin confirmation setting.",
    recommended: false,
    sample: "1.4 GB · 61 items",
  },
  {
    id: "sys-shader",
    category: "SYSTEM",
    name: "DirectX shader cache",
    desc: "Clears the Direct3D shader cache; games rebuild it on next launch.",
    risk: "LOW",
    source: "Storage · DirectX shader cache / Tools",
    details: "First launch of a game afterwards may stutter briefly while shaders rebuild.",
    recommended: true,
    sample: "640 MB",
  },
  {
    id: "sys-dns",
    category: "SYSTEM",
    name: "Flush DNS resolver cache",
    desc: "Clears cached name lookups.",
    risk: "SAFE",
    source: "Tools · Flush DNS Resolver Cache",
    details: "Equivalent to ipconfig /flushdns. No network settings are changed.",
    recommended: true,
    sample: "212 entries",
  },
];

export const taskById = (id: string) => MAINT_TASKS.find((t) => t.id === id);

/* ── Schedule ── */
export const PRESET_INTERVALS = [1, 5, 10, 30, 60] as const;
export const MAX_INTERVAL_MIN = 24 * 60;
export type IntervalUnit = "minutes" | "hours";

export type IntervalCheck = { ok: true; minutes: number } | { ok: false; error: string };

/** Custom intervals: whole minutes, at least 1 minute, at most 24 hours. */
export function validateCustomInterval(raw: string | number, unit: IntervalUnit): IntervalCheck {
  const text = String(raw).trim().replace(",", ".");
  if (!text) return { ok: false, error: "Enter an interval." };
  const n = Number(text);
  if (!Number.isFinite(n)) return { ok: false, error: "Enter a number." };
  if (n <= 0) return { ok: false, error: "The interval must be greater than zero." };
  const minutes = unit === "hours" ? n * 60 : n;
  if (Math.abs(minutes - Math.round(minutes)) > 1e-9)
    return { ok: false, error: "Use whole minutes (for example 1.5 hours = 90 minutes)." };
  if (minutes < 1) return { ok: false, error: "The shortest interval is 1 minute." };
  if (minutes > MAX_INTERVAL_MIN) return { ok: false, error: "The longest interval is 24 hours." };
  return { ok: true, minutes: Math.round(minutes) };
}

export function formatInterval(min: number) {
  if (min < 60) return `Every ${min} minute${min === 1 ? "" : "s"}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hs = `${h} hour${h === 1 ? "" : "s"}`;
  return m ? `Every ${hs} ${m} min` : `Every ${hs}`;
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/* ── Configuration ── */
export type CloseBehavior = "stop" | "exit-run" | "background";
export type StartupPolicy = "after-delay" | "next-interval";
export type OverlapPolicy = "skip" | "queue";

export interface AutoConfig {
  enabled: boolean;
  paused: boolean;
  tasks: string[];
  intervalMin: number;
  runOnLaunch: boolean;
  closeBehavior: CloseBehavior;
  runOnWindowsStartup: boolean;
  startupPolicy: StartupPolicy;
  overlap: OverlapPolicy;
  /** Only SAFE tasks may run unattended; LOW-risk tasks are skipped by the scheduler. */
  safeOnly: boolean;
  /** Skip temporary files modified in the last 24 hours. */
  skipRecentTemp: boolean;
  /** Ask before emptying the Recycle Bin. Unattended runs then skip it (nobody to ask). */
  recycleConfirm: boolean;
  profile: "Balanced" | "Light" | "Thorough";
}

export const DEFAULT_CONFIG: AutoConfig = {
  enabled: false,
  paused: false,
  tasks: MAINT_TASKS.filter((t) => t.recommended).map((t) => t.id),
  intervalMin: 30,
  runOnLaunch: false,
  closeBehavior: "stop",
  runOnWindowsStartup: false,
  startupPolicy: "after-delay",
  overlap: "skip",
  safeOnly: true,
  skipRecentTemp: true,
  recycleConfirm: true,
  profile: "Balanced",
};

export const STARTUP_DELAY_MIN = 2;

/** Normalizes stored/partial config; unknown task ids are dropped, bad intervals fall back. */
export function sanitizeConfig(raw: Partial<AutoConfig> | null | undefined): AutoConfig {
  const c = { ...DEFAULT_CONFIG, ...(raw ?? {}) };
  const ids = new Set(MAINT_TASKS.map((t) => t.id));
  const iv = validateCustomInterval(c.intervalMin, "minutes");
  return {
    ...c,
    tasks: Array.isArray(c.tasks) ? c.tasks.filter((id) => ids.has(id)) : DEFAULT_CONFIG.tasks,
    intervalMin: iv.ok ? iv.minutes : DEFAULT_CONFIG.intervalMin,
  };
}

/* ── Execution plan ── */
export type Trigger = "Schedule" | "Manual" | "App launch" | "App exit" | "Windows startup";
export type TaskOutcome = "Completed" | "Skipped" | "Cancelled" | "Not run";

export interface PlanItem {
  task: MaintTask;
  run: boolean;
  /** Why a selected task will not run on this trigger. */
  reason?: string;
}

/** Only selected tasks are ever planned. Unselected tasks never appear. */
export function planRun(
  cfg: AutoConfig,
  trigger: Trigger,
  runningBrowsers: ReadonlySet<string> = new Set(),
): PlanItem[] {
  const unattended = trigger !== "Manual";
  return MAINT_TASKS.filter((t) => cfg.tasks.includes(t.id)).map((task) => {
    if (task.browser && runningBrowsers.has(task.browser))
      return { task, run: false, reason: `${task.browser} is running — skipped, not closed` };
    if (task.id === "recycle-bin" && cfg.recycleConfirm && unattended)
      return { task, run: false, reason: "Needs your confirmation — skipped on unattended runs" };
    if (cfg.safeOnly && unattended && task.risk === "LOW")
      return { task, run: false, reason: "Safe-only mode — LOW-risk task skipped" };
    return { task, run: true };
  });
}

/** What happens when the schedule fires while a run is still in progress. */
export function onScheduleDue(
  running: boolean,
  queued: boolean,
  policy: OverlapPolicy,
): "start" | "queue" | "skip" {
  if (!running) return "start";
  if (policy === "queue" && !queued) return "queue";
  return "skip";
}

export interface RunSummary {
  completed: number;
  skipped: number;
  cancelled: number;
  status: "Completed" | "Partial" | "Skipped" | "Cancelled";
  /** The prototype never changes the PC. */
  realChanges: 0;
}

export function summarizeOutcomes(outcomes: TaskOutcome[]): RunSummary {
  const completed = outcomes.filter((o) => o === "Completed").length;
  const skipped = outcomes.filter((o) => o === "Skipped").length;
  const cancelled = outcomes.filter((o) => o === "Cancelled" || o === "Not run").length;
  const status =
    cancelled > 0
      ? "Cancelled"
      : completed === 0
        ? "Skipped"
        : skipped > 0
          ? "Partial"
          : "Completed";
  return { completed, skipped, cancelled, status, realChanges: 0 };
}

/** Next run: interval after the reference time (enable time or last run). */
export const nextRunAt = (from: number, intervalMin: number) => from + intervalMin * 60_000;

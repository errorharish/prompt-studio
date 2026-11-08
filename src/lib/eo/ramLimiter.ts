// RAM Limiter calculation layer — pure functions, no React, no browser APIs.
// It only CALCULATES per-application working-set targets. Enforcement (SetProcessWorkingSetSizeEx /
// job-object memory limits) belongs to a future native C#/.NET bridge; the browser prototype
// never touches real processes.

export type RamMode = "AUTO" | "LIGHT" | "AGGRESSIVE" | "MANUAL";
export const RAM_MODES: RamMode[] = ["AUTO", "LIGHT", "AGGRESSIVE", "MANUAL"];

export type AppCategory = "BROWSER" | "COMMUNICATION" | "LAUNCHER" | "MEDIA" | "UTILITY" | "SYSTEM";

export interface RamApp {
  name: string;
  /** Friendly product name. */
  title: string;
  pid: number;
  category: AppCategory;
  workingSetMb: number;
  /** The window currently in focus. */
  foreground: boolean;
  /** Critical Windows process: never limited, in any mode. */
  critical: boolean;
}

export interface SystemMemory {
  totalMb: number;
  /** 0–1 share of physical memory in use. */
  pressure: number;
}

export const availableMb = (sys: SystemMemory) => Math.round(sys.totalMb * (1 - sys.pressure));

/** Sample running processes (prototype data — a native bridge would supply live values). */
export const SAMPLE_APPS: RamApp[] = [
  { name: "chrome.exe", title: "Google Chrome", pid: 7420, category: "BROWSER", workingSetMb: 1240, foreground: false, critical: false },
  { name: "Discord.exe", title: "Discord", pid: 11240, category: "COMMUNICATION", workingSetMb: 680, foreground: false, critical: false },
  { name: "Spotify.exe", title: "Spotify", pid: 8912, category: "MEDIA", workingSetMb: 420, foreground: false, critical: false },
  { name: "steamwebhelper.exe", title: "Steam", pid: 5630, category: "LAUNCHER", workingSetMb: 510, foreground: false, critical: false },
  { name: "EpicGamesLauncher.exe", title: "Epic Games Launcher", pid: 9812, category: "LAUNCHER", workingSetMb: 390, foreground: false, critical: false },
  { name: "Code.exe", title: "Visual Studio Code", pid: 6204, category: "UTILITY", workingSetMb: 860, foreground: true, critical: false },
  { name: "explorer.exe", title: "Windows Explorer", pid: 4120, category: "SYSTEM", workingSetMb: 140, foreground: false, critical: true },
];

/** Smallest working set each category keeps so the app stays usable. */
export const CATEGORY_FLOOR_MB: Record<AppCategory, number> = {
  BROWSER: 400,
  COMMUNICATION: 200,
  MEDIA: 150,
  LAUNCHER: 150,
  UTILITY: 200,
  SYSTEM: 0,
};

/** Extra share kept for apps that work while in the background (voice chat, audio playback). */
const CATEGORY_BONUS: Record<AppCategory, number> = {
  BROWSER: 0,
  COMMUNICATION: 0.05,
  MEDIA: 0.05,
  LAUNCHER: 0,
  UTILITY: 0,
  SYSTEM: 0,
};

export const MANUAL_MIN_MB = 128;
export const MANUAL_MAX_MB = 8192;

/** Share of the current working set kept for a preset mode. */
export function keepRatio(mode: Exclude<RamMode, "MANUAL">, sys: SystemMemory): number {
  let r: number;
  if (mode === "LIGHT") r = 0.85;
  else if (mode === "AGGRESSIVE") r = 0.55;
  else {
    // AUTO: no trimming pressure below 60 %, aggressive-level trimming at 90 %+.
    const t = Math.min(1, Math.max(0, (sys.pressure - 0.6) / 0.3));
    r = 0.9 - t * 0.35;
  }
  // Small machines (≤ 8 GB) trim a little harder.
  if (sys.totalMb <= 8192) r -= 0.1;
  return Math.max(0.3, r);
}

export type Eligibility = "ELIGIBLE" | "PROTECTED_FOREGROUND" | "CRITICAL" | "EXCLUDED";

export function eligibility(app: RamApp, opts: { foregroundProtection: boolean; excluded: boolean }): Eligibility {
  if (app.critical) return "CRITICAL";
  if (app.foreground && opts.foregroundProtection) return "PROTECTED_FOREGROUND";
  if (opts.excluded) return "EXCLUDED";
  return "ELIGIBLE";
}

const round10 = (n: number) => Math.round(n / 10) * 10;

/** Preset target in MB for one app. Never above the current working set. */
export function presetTargetMb(app: RamApp, mode: Exclude<RamMode, "MANUAL">, sys: SystemMemory): number {
  const ratio = Math.min(1, keepRatio(mode, sys) + CATEGORY_BONUS[app.category]);
  const floor = Math.min(CATEGORY_FLOOR_MB[app.category], app.workingSetMb);
  return Math.min(app.workingSetMb, Math.max(floor, round10(app.workingSetMb * ratio)));
}

export const clampManualMb = (mb: number) =>
  Math.min(MANUAL_MAX_MB, Math.max(MANUAL_MIN_MB, Math.round(mb)));

export interface RamConfig {
  mode: RamMode;
  foregroundProtection: boolean;
  /** Per-app manual targets (MB). Only used in MANUAL mode; missing = default. */
  manualMb: Record<string, number>;
  excluded: string[];
}

/** Default manual target: what AUTO would pick right now. */
export const defaultManualMb = (app: RamApp, sys: SystemMemory) => presetTargetMb(app, "AUTO", sys);

export interface AppPlan {
  app: RamApp;
  status: Eligibility;
  /** Configured target in MB, or null when the app is not limited. */
  targetMb: number | null;
  /** Memory that would be released (MB, ≥ 0). */
  reclaimMb: number;
  manualOverride: boolean;
}

export function planApp(app: RamApp, cfg: RamConfig, sys: SystemMemory): AppPlan {
  const status = eligibility(app, {
    foregroundProtection: cfg.foregroundProtection,
    excluded: cfg.excluded.includes(app.name),
  });
  if (status !== "ELIGIBLE") return { app, status, targetMb: null, reclaimMb: 0, manualOverride: false };
  const override = cfg.mode === "MANUAL" ? cfg.manualMb[app.name] : undefined;
  const targetMb =
    cfg.mode === "MANUAL"
      ? clampManualMb(override ?? defaultManualMb(app, sys))
      : presetTargetMb(app, cfg.mode, sys);
  return {
    app,
    status,
    targetMb,
    reclaimMb: Math.max(0, app.workingSetMb - targetMb),
    manualOverride: override !== undefined,
  };
}

/** Inactive standby cache on the sample machine and the share each mode purges per cycle. */
export const STANDBY_CACHE_MB = 1884;
export function standbyPurgeMb(mode: RamMode, sys: SystemMemory): number {
  const share =
    mode === "LIGHT" ? 0.5 : mode === "AGGRESSIVE" ? 1 : mode === "MANUAL" ? 0.75 : 0.4 + 0.6 * Math.min(1, Math.max(0, (sys.pressure - 0.5) / 0.4));
  return Math.round(STANDBY_CACHE_MB * share);
}

export interface RamSummary {
  plans: AppPlan[];
  limited: number;
  protectedCount: number;
  reclaimMb: number;
  standbyMb: number;
  availableMb: number;
  /** Available memory after reclaim + standby purge. */
  projectedAvailableMb: number;
}

export function summarize(apps: RamApp[], cfg: RamConfig, sys: SystemMemory, standbyPurged: boolean): RamSummary {
  const plans = apps.map((a) => planApp(a, cfg, sys));
  const reclaimMb = plans.reduce((s, p) => s + p.reclaimMb, 0);
  const standbyMb = standbyPurged ? 0 : standbyPurgeMb(cfg.mode, sys);
  const avail = availableMb(sys);
  return {
    plans,
    limited: plans.filter((p) => p.targetMb !== null).length,
    protectedCount: plans.filter((p) => p.status === "PROTECTED_FOREGROUND" || p.status === "CRITICAL").length,
    reclaimMb,
    standbyMb,
    availableMb: avail,
    projectedAvailableMb: Math.min(sys.totalMb, avail + reclaimMb + standbyMb),
  };
}

export const fmtMb = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`);

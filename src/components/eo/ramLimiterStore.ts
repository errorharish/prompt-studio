// Central RAM Limiter state shared by every RAM Limiter panel. Browser-only (localStorage):
// it stores the configuration; it never limits real Windows processes.
import { useSyncExternalStore } from "react";
import { RAM_MODES, clampManualMb, type RamMode } from "@/lib/eo/ramLimiter";

const KEY = "eo-ram-limiter:v1";

export interface RamLimiterState {
  mode: RamMode;
  foregroundProtection: boolean;
  trimInterval: string;
  manualMb: Record<string, number>;
  excluded: string[];
  /** Simulated memory pressure (0–1) that AUTO reacts to. */
  pressure: number;
  standbyPurged: boolean;
}

export const RAM_DEFAULTS: RamLimiterState = {
  mode: "AUTO",
  foregroundProtection: true,
  trimInterval: "10 MIN",
  manualMb: {},
  excluded: [],
  pressure: 0.62,
  standbyPurged: false,
};

let state: RamLimiterState | null = null;
const listeners = new Set<() => void>();

function read(): RamLimiterState {
  if (state) return state;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<RamLimiterState> | null;
    const manual: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw?.manualMb ?? {}))
      if (typeof v === "number" && Number.isFinite(v)) manual[k] = clampManualMb(v);
    state = {
      ...RAM_DEFAULTS,
      mode: RAM_MODES.includes(raw?.mode as RamMode) ? (raw!.mode as RamMode) : "AUTO",
      foregroundProtection: raw?.foregroundProtection !== false,
      trimInterval: typeof raw?.trimInterval === "string" ? raw.trimInterval : RAM_DEFAULTS.trimInterval,
      manualMb: manual,
      excluded: Array.isArray(raw?.excluded) ? raw.excluded.filter((x) => typeof x === "string") : [],
      pressure:
        typeof raw?.pressure === "number" ? Math.min(0.95, Math.max(0.3, raw.pressure)) : RAM_DEFAULTS.pressure,
      standbyPurged: raw?.standbyPurged === true,
    };
  } catch {
    state = { ...RAM_DEFAULTS };
  }
  return state;
}

export function setRamState(patch: Partial<RamLimiterState> | ((s: RamLimiterState) => Partial<RamLimiterState>)) {
  const cur = read();
  state = { ...cur, ...(typeof patch === "function" ? patch(cur) : patch) };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* keep in memory */
  }
  listeners.forEach((l) => l());
}

export function useRamState(): RamLimiterState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => RAM_DEFAULTS,
  );
}

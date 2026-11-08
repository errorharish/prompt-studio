// Simulated System Protection state of the sample device + the last simulated restore point.
// Browser-only (localStorage). Nothing here reads or changes Windows.
import { useSyncExternalStore } from "react";
import type { ProtectionScenario } from "@/lib/eo/restorePoint";

const KEY = "eo-restore-point:v1";

export interface RestorePointState {
  scenario: ProtectionScenario;
  last: { name: string; at: string } | null;
}

// Default: protection off, so the System Protection workflow is visible on first use.
const DEFAULT: RestorePointState = { scenario: "disabled", last: null };
let state: RestorePointState | null = null;
const listeners = new Set<() => void>();

function read(): RestorePointState {
  if (state) return state;
  try {
    const raw = JSON.parse(
      window.localStorage.getItem(KEY) ?? "null",
    ) as Partial<RestorePointState> | null;
    state = {
      scenario:
        raw?.scenario === "enabled" || raw?.scenario === "blocked" ? raw.scenario : "disabled",
      last: raw?.last && typeof raw.last.name === "string" ? raw.last : null,
    };
  } catch {
    state = { ...DEFAULT };
  }
  return state;
}

export function setRestoreState(patch: Partial<RestorePointState>) {
  state = { ...read(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getRestoreState = () => read();

export function useRestoreState(): RestorePointState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => DEFAULT,
  );
}

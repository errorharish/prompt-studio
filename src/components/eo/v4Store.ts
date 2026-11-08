// V4 session state shared by the V4 Dashboard, Maximum Performance and the three emulator
// pages, so moving between them never resets engine states, the profile or recent activity.
// Simulated only: the "connection" is a demo toggle and engines never touch an emulator.
import { useSyncExternalStore } from "react";

export const EMU_PROFILES = ["BALANCED PROFILE", "PERFORMANCE PROFILE"] as const;
export type EmuProfile = (typeof EMU_PROFILES)[number];

export interface EmuState {
  /** Demo connection toggle (MSI App Player + ADB). */
  adb: boolean;
  /** Engines applied this session (indexes). */
  applied: number[];
  profile: EmuProfile;
  /** Simulated runs recorded this session (newest first). Never pre-filled. */
  activity: V4Activity[];
}

export interface V4Activity {
  module: string;
  status: "SIMULATED" | "RESTORED";
  at: string;
  summary: string;
}

const PROFILE_KEY = "eo-emu-profile";
let state: EmuState = { adb: false, applied: [], profile: "BALANCED PROFILE", activity: [] };
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const p = window.localStorage.getItem(PROFILE_KEY);
  if (p && (EMU_PROFILES as readonly string[]).includes(p)) {
    state = { ...state, profile: p as EmuProfile };
  }
}

export function setEmu(patch: Partial<EmuState>) {
  hydrate();
  state = { ...state, ...patch };
  if (patch.profile) {
    try {
      window.localStorage.setItem(PROFILE_KEY, patch.profile);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

const SERVER: EmuState = { adb: false, applied: [], profile: "BALANCED PROFILE", activity: [] };

/** Records one simulated run for the V4 Dashboard activity list (keeps the latest 8). */
export function logV4(module: string, summary: string, status: V4Activity["status"] = "SIMULATED") {
  hydrate();
  const at = new Date().toLocaleTimeString();
  setEmu({ activity: [{ module, status, at, summary }, ...state.activity].slice(0, 8) });
}

export function useEmu(): EmuState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      hydrate();
      return state;
    },
    () => SERVER,
  );
}

/** Current snapshot for event handlers that must not use a stale render value. */
export function getEmu(): EmuState {
  hydrate();
  return state;
}

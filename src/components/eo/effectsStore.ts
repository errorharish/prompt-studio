// Appearance & Effects settings, saved in this browser and shared by Settings and EffectsLayer.
import { useSyncExternalStore } from "react";
import {
  DEFAULT_EFFECTS,
  applyPreset,
  sanitizeEffects,
  updateEffects,
  type EffectsSettings,
  type Preset,
} from "@/lib/eo/effects";

const KEY = "eo-effects-v1";
let state: EffectsSettings = DEFAULT_EFFECTS;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = sanitizeEffects(JSON.parse(raw));
  } catch {
    state = DEFAULT_EFFECTS;
  }
}

function commit(next: EffectsSettings) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep for this session */
  }
  listeners.forEach((l) => l());
}

export function setEffects(patch: Partial<EffectsSettings>) {
  hydrate();
  commit(updateEffects(state, patch));
}
export function setPreset(p: Preset) {
  hydrate();
  commit(applyPreset(state, p));
}
export function resetEffects() {
  hydrate();
  commit(DEFAULT_EFFECTS);
}

export function useEffectsSettings(): EffectsSettings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      hydrate();
      return state;
    },
    () => DEFAULT_EFFECTS,
  );
}

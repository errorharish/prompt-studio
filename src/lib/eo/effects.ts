// Appearance & Effects rules: defaults, presets, themes, saved-value cleanup and particle budgets.
// Pure (no React, no storage). Decorative only — effects never show or imply real measurements.

export const CURSOR_EFFECTS = [
  "none",
  "glow",
  "particles",
  "flame",
  "lightning",
  "water",
  "mist",
  "shadow",
  "cosmic",
] as const;
export type CursorEffect = (typeof CURSOR_EFFECTS)[number];

export const CURSOR_LABELS: Record<CursorEffect, string> = {
  none: "None",
  glow: "Cursor Glow",
  particles: "Particle Trail",
  flame: "Flame Trail",
  lightning: "Lightning Trail",
  water: "Water Trail",
  mist: "Mist Trail",
  shadow: "Shadow Trail",
  cosmic: "Cosmic Trail",
};

export const FX_THEMES = [
  "custom",
  "minimal",
  "flame",
  "thunder",
  "water",
  "mist",
  "shadow",
  "cosmic",
] as const;
export type FxTheme = (typeof FX_THEMES)[number];

/** Ambient particle style each theme draws behind the pages. */
export type AmbientStyle = "dots" | "embers" | "sparks" | "bubbles" | "fog" | "motes" | "stars";

export interface ThemeSpec {
  label: string;
  /** Primary and secondary accent; `null` keeps the accent chosen in Settings. */
  a: string | null;
  b: string | null;
  ambient: AmbientStyle;
}

export const THEMES: Record<FxTheme, ThemeSpec> = {
  custom: { label: "Custom", a: null, b: null, ambient: "dots" },
  minimal: { label: "Minimal", a: null, b: null, ambient: "dots" },
  flame: { label: "Flame", a: "oklch(0.76 0.17 55)", b: "oklch(0.64 0.21 30)", ambient: "embers" },
  thunder: {
    label: "Thunder",
    a: "oklch(0.86 0.15 95)",
    b: "oklch(0.68 0.17 275)",
    ambient: "sparks",
  },
  water: { label: "Water", a: "oklch(0.8 0.12 205)", b: "oklch(0.6 0.15 245)", ambient: "bubbles" },
  mist: { label: "Mist", a: "oklch(0.85 0.05 220)", b: "oklch(0.68 0.06 260)", ambient: "fog" },
  shadow: { label: "Shadow", a: "oklch(0.72 0.14 300)", b: "oklch(0.45 0.13 290)", ambient: "motes" },
  cosmic: { label: "Cosmic", a: "oklch(0.76 0.17 320)", b: "oklch(0.7 0.15 270)", ambient: "stars" },
};

export const PRESETS = ["minimal", "balanced", "enhanced"] as const;
export type Preset = (typeof PRESETS)[number];

export interface EffectsSettings {
  theme: FxTheme;
  preset: Preset | "custom";
  background: boolean;
  /** 0–100 */
  bgIntensity: number;
  glowIntensity: number;
  particles: boolean;
  cursor: boolean;
  cursorEffect: CursorEffect;
  cursorIntensity: number;
  cursorDensity: number;
  trailLength: number;
  speed: number;
  ripple: boolean;
  buttonAnim: boolean;
  cardHover: boolean;
  iconAnim: boolean;
  pageTransitions: boolean;
  modalTransitions: boolean;
  sectionAnim: boolean;
  sidebarAnim: boolean;
}

export const DEFAULT_EFFECTS: EffectsSettings = {
  theme: "custom",
  preset: "balanced",
  background: true,
  bgIntensity: 50,
  glowIntensity: 50,
  particles: true,
  cursor: false,
  cursorEffect: "glow",
  cursorIntensity: 60,
  cursorDensity: 50,
  trailLength: 50,
  speed: 50,
  ripple: true,
  buttonAnim: true,
  cardHover: true,
  iconAnim: true,
  pageTransitions: true,
  modalTransitions: true,
  sectionAnim: true,
  sidebarAnim: true,
};

const PRESET_VALUES: Record<Preset, Partial<EffectsSettings>> = {
  minimal: {
    background: true,
    bgIntensity: 20,
    glowIntensity: 20,
    particles: false,
    cursor: false,
    ripple: false,
    sectionAnim: false,
  },
  balanced: {
    background: true,
    bgIntensity: 50,
    glowIntensity: 50,
    particles: true,
    ripple: true,
    buttonAnim: true,
    cardHover: true,
    iconAnim: true,
    pageTransitions: true,
    modalTransitions: true,
    sectionAnim: true,
    sidebarAnim: true,
  },
  enhanced: {
    background: true,
    bgIntensity: 80,
    glowIntensity: 75,
    particles: true,
    cursor: true,
    cursorDensity: 65,
    ripple: true,
    buttonAnim: true,
    cardHover: true,
    iconAnim: true,
    pageTransitions: true,
    modalTransitions: true,
    sectionAnim: true,
    sidebarAnim: true,
  },
};

/** Applies a preset on top of the current settings; theme and cursor style are kept. */
export function applyPreset(s: EffectsSettings, p: Preset): EffectsSettings {
  return { ...s, ...PRESET_VALUES[p], preset: p };
}

/** Any manual change after a preset marks the settings as custom. */
export function updateEffects(s: EffectsSettings, patch: Partial<EffectsSettings>): EffectsSettings {
  const next = { ...s, ...patch };
  if (!("preset" in patch) && !("theme" in patch)) next.preset = "custom";
  return next;
}

const clamp = (v: unknown, d: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : d;

/** Cleans a saved value: unknown keys dropped, bad values fall back to defaults. */
export function sanitizeEffects(raw: unknown): EffectsSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_EFFECTS };
  for (const k of Object.keys(DEFAULT_EFFECTS) as (keyof EffectsSettings)[]) {
    const d = DEFAULT_EFFECTS[k];
    const v = r[k];
    if (typeof d === "boolean") (out as Record<string, unknown>)[k] = typeof v === "boolean" ? v : d;
    else if (typeof d === "number") (out as Record<string, unknown>)[k] = clamp(v, d);
  }
  out.theme = (FX_THEMES as readonly unknown[]).includes(r["theme"]) ? (r["theme"] as FxTheme) : "custom";
  out.cursorEffect = (CURSOR_EFFECTS as readonly unknown[]).includes(r["cursorEffect"])
    ? (r["cursorEffect"] as CursorEffect)
    : DEFAULT_EFFECTS.cursorEffect;
  out.preset = ([...PRESETS, "custom"] as unknown[]).includes(r["preset"])
    ? (r["preset"] as EffectsSettings["preset"])
    : DEFAULT_EFFECTS.preset;
  return out;
}

export const MAX_AMBIENT_PARTICLES = 60;
export const MAX_CURSOR_PARTICLES = 160;

/** Ambient particle count. 0 when motion is reduced, backgrounds are off, or the theme is Minimal. */
export function ambientCount(s: EffectsSettings, reduced: boolean): number {
  if (reduced || !s.background || !s.particles || s.theme === "minimal") return 0;
  return Math.round((s.bgIntensity / 100) * MAX_AMBIENT_PARTICLES);
}

/** Whether the cursor loop should run at all. */
export function cursorActive(s: EffectsSettings, reduced: boolean): boolean {
  return !reduced && s.cursor && s.cursorEffect !== "none";
}

/** Particles spawned per pointer move (0–4) and their lifetime in frames (12–72). */
export function cursorBudget(s: EffectsSettings) {
  return {
    perMove: Math.round((s.cursorDensity / 100) * 4),
    life: Math.round(12 + (s.trailLength / 100) * 60),
    speed: 0.4 + (s.speed / 100) * 1.6,
    alpha: 0.15 + (s.cursorIntensity / 100) * 0.85,
  };
}

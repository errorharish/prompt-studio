import { describe, expect, it } from "vitest";
import {
  DEFAULT_EFFECTS,
  MAX_AMBIENT_PARTICLES,
  ambientCount,
  applyPreset,
  cursorActive,
  cursorBudget,
  sanitizeEffects,
  updateEffects,
} from "@/lib/eo/effects";

describe("effects rules", () => {
  it("reduced motion turns off ambient particles and the cursor trail", () => {
    const s = { ...DEFAULT_EFFECTS, cursor: true, cursorEffect: "flame" as const };
    expect(ambientCount(s, true)).toBe(0);
    expect(cursorActive(s, true)).toBe(false);
    expect(cursorActive(s, false)).toBe(true);
  });
  it("cursor effect 'none' never runs", () => {
    expect(cursorActive({ ...DEFAULT_EFFECTS, cursor: true, cursorEffect: "none" }, false)).toBe(false);
  });
  it("ambient particles are capped and off for Minimal or when backgrounds are off", () => {
    expect(ambientCount({ ...DEFAULT_EFFECTS, bgIntensity: 100 }, false)).toBe(MAX_AMBIENT_PARTICLES);
    expect(ambientCount({ ...DEFAULT_EFFECTS, theme: "minimal" }, false)).toBe(0);
    expect(ambientCount({ ...DEFAULT_EFFECTS, background: false }, false)).toBe(0);
  });
  it("Minimal preset disables particles, ripple and the cursor; theme is kept", () => {
    const s = applyPreset({ ...DEFAULT_EFFECTS, theme: "cosmic", cursor: true }, "minimal");
    expect(s).toMatchObject({ particles: false, ripple: false, cursor: false, theme: "cosmic", preset: "minimal" });
  });
  it("a manual change marks the preset as custom", () => {
    expect(updateEffects(applyPreset(DEFAULT_EFFECTS, "enhanced"), { ripple: false }).preset).toBe("custom");
  });
  it("saved values are cleaned: bad enums and out-of-range numbers fall back", () => {
    const s = sanitizeEffects({ theme: "neon", cursorEffect: "laser", bgIntensity: 400, ripple: "yes" });
    expect(s.theme).toBe("custom");
    expect(s.cursorEffect).toBe(DEFAULT_EFFECTS.cursorEffect);
    expect(s.bgIntensity).toBe(100);
    expect(s.ripple).toBe(DEFAULT_EFFECTS.ripple);
  });
  it("trail budget stays within 0–4 particles per move and 12–72 frames", () => {
    expect(cursorBudget({ ...DEFAULT_EFFECTS, cursorDensity: 100, trailLength: 100 })).toMatchObject({ perMove: 4, life: 72 });
    expect(cursorBudget({ ...DEFAULT_EFFECTS, cursorDensity: 0, trailLength: 0 })).toMatchObject({ perMove: 0, life: 12 });
  });
});

import { describe, expect, it } from "vitest";
import {
  appManualRange,
  clampAppManualMb,
  SAMPLE_APPS,
  defaultManualMb,
  planApp,
  presetTargetMb,
  summarize,
  type RamConfig,
  type RamMode,
} from "@/lib/eo/ramLimiter";

const sys = { totalMb: 32768, pressure: 0.38 };
const app = (n: string) => SAMPLE_APPS.find((a) => a.name === n)!;
const cfg = (mode: RamMode, extra: Partial<RamConfig> = {}): RamConfig => ({
  mode,
  foregroundProtection: true,
  manualMb: {},
  excluded: [],
  ...extra,
});
const targets = (c: RamConfig, s = sys) =>
  Object.fromEntries(summarize(SAMPLE_APPS, c, s, false).plans.map((p) => [p.app.name, p.targetMb]));

describe("RAM Limiter presets", () => {
  it("LIGHT gives every eligible background app a target", () => {
    const t = targets(cfg("LIGHT"));
    for (const n of ["chrome.exe", "Discord.exe", "Spotify.exe", "steamwebhelper.exe", "EpicGamesLauncher.exe"])
      expect(t[n]).toBeTypeOf("number");
  });

  it("AGGRESSIVE is more restrictive than LIGHT for every eligible app", () => {
    const light = targets(cfg("LIGHT"));
    const aggr = targets(cfg("AGGRESSIVE"));
    for (const n of Object.keys(light)) if (light[n] !== null) expect(aggr[n]!).toBeLessThan(light[n]!);
  });

  it("AUTO tightens targets as simulated memory pressure rises", () => {
    const low = presetTargetMb(app("chrome.exe"), "AUTO", { ...sys, pressure: 0.38 });
    const high = presetTargetMb(app("chrome.exe"), "AUTO", { ...sys, pressure: 0.9 });
    expect(high).toBeLessThan(low);
  });

  it("never sets a preset target above the current working set or below the category floor", () => {
    for (const m of ["AUTO", "LIGHT", "AGGRESSIVE"] as const)
      for (const a of SAMPLE_APPS.filter((x) => !x.critical)) {
        const t = presetTargetMb(a, m, { ...sys, pressure: 0.95 });
        expect(t).toBeLessThanOrEqual(a.workingSetMb);
        if (a.category === "BROWSER") expect(t).toBeGreaterThanOrEqual(400);
      }
  });
});

describe("RAM Limiter protection", () => {
  it("never limits critical Windows processes, in any mode", () => {
    for (const m of ["AUTO", "LIGHT", "AGGRESSIVE", "MANUAL"] as const)
      expect(planApp(app("explorer.exe"), cfg(m, { foregroundProtection: false }), sys).targetMb).toBeNull();
  });

  it("shields the foreground app while protection is on, and limits it when off", () => {
    expect(planApp(app("Code.exe"), cfg("AGGRESSIVE"), sys).status).toBe("PROTECTED_FOREGROUND");
    expect(planApp(app("Code.exe"), cfg("AGGRESSIVE", { foregroundProtection: false }), sys).targetMb).toBeTypeOf("number");
  });

  it("excluded apps get no target", () => {
    expect(planApp(app("Spotify.exe"), cfg("LIGHT", { excluded: ["Spotify.exe"] }), sys).targetMb).toBeNull();
  });
});

describe("RAM Limiter manual mode", () => {
  it("changing Discord.exe to 400 MB changes only Discord.exe", () => {
    const before = targets(cfg("MANUAL"));
    const after = targets(cfg("MANUAL", { manualMb: { "Discord.exe": 400 } }));
    expect(after["Discord.exe"]).toBe(400);
    for (const n of Object.keys(before)) if (n !== "Discord.exe") expect(after[n]).toBe(before[n]);
  });

  it("clamps manual targets to the app floor – 8 GB", () => {
    expect(planApp(app("chrome.exe"), cfg("MANUAL", { manualMb: { "chrome.exe": 10 } }), sys).targetMb).toBe(400);
    expect(planApp(app("chrome.exe"), cfg("MANUAL", { manualMb: { "chrome.exe": 99999 } }), sys).targetMb).toBe(8192);
  });

  it("summary reclaim equals the sum of per-app reclaim", () => {
    const s = summarize(SAMPLE_APPS, cfg("AGGRESSIVE"), sys, false);
    expect(s.reclaimMb).toBe(s.plans.reduce((a, p) => a + p.reclaimMb, 0));
    expect(s.reclaimMb).toBeGreaterThan(0);
  });
});

describe("manual override isolation (popup workflow)", () => {
  const sys = { totalMb: 32768, pressure: 0.38 };
  const base = { foregroundProtection: true, excluded: [] as string[] };
  const targets = (cfg: Parameters<typeof summarize>[1]) =>
    Object.fromEntries(summarize(SAMPLE_APPS, cfg, sys, false).plans.map((p) => [p.app.name, p.targetMb]));

  it("752 MB on chrome.exe changes only chrome", () => {
    const before = targets({ ...base, mode: "MANUAL", manualMb: {} });
    const after = targets({ ...base, mode: "MANUAL", manualMb: { "chrome.exe": 752 } });
    expect(after["chrome.exe"]).toBe(752);
    for (const k of Object.keys(before)) if (k !== "chrome.exe") expect(after[k]).toBe(before[k]);
  });

  it("only overridden apps are flagged as manual overrides", () => {
    const plans = summarize(SAMPLE_APPS, { ...base, mode: "MANUAL", manualMb: { "chrome.exe": 752 } }, sys, false).plans;
    expect(plans.filter((p) => p.manualOverride).map((p) => p.app.name)).toEqual(["chrome.exe"]);
  });

  it("deleting the override restores the default target", () => {
    const chrome = SAMPLE_APPS.find((a) => a.name === "chrome.exe")!;
    expect(targets({ ...base, mode: "MANUAL", manualMb: {} })["chrome.exe"]).toBe(defaultManualMb(chrome, sys));
  });

  it("preset modes ignore saved manual targets", () => {
    for (const mode of ["AUTO", "LIGHT", "AGGRESSIVE"] as const) {
      expect(targets({ ...base, mode, manualMb: { "chrome.exe": 752 } })).toEqual(targets({ ...base, mode, manualMb: {} }));
    }
  });

  it("manual targets never go below the app's safe floor", () => {
    const chrome = SAMPLE_APPS.find((a) => a.name === "chrome.exe")!;
    expect(appManualRange(chrome).minMb).toBe(400);
    expect(clampAppManualMb(chrome, 150)).toBe(400);
    expect(targets({ ...base, mode: "MANUAL", manualMb: { "chrome.exe": 150 } })["chrome.exe"]).toBe(400);
  });
});

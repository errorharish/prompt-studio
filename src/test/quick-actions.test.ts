import { describe, expect, it } from "vitest";
import {
  NAV_SHORTCUTS,
  QUICK_ACTIONS,
  QUICK_OPTIMIZE,
  canStartQuick,
  navigatesAway,
  quickResult,
  quickStepAt,
} from "@/lib/eo/quickActions";
import { PAGES } from "@/lib/eo/registry";

describe("Dashboard navigation shortcuts and Quick Optimize", () => {
  it("navigation shortcuts open their existing pages", () => {
    const routes = Object.fromEntries(NAV_SHORTCUTS.map((a) => [a.title, a.to]));
    expect(routes).toEqual({
      "One-Click Optimize": "one-click",
      "Boost Performance": "max-performance",
      "Startup Manager": "startup-manager",
      "View Telemetry": "system-info",
    });
    for (const a of NAV_SHORTCUTS) {
      expect(
        PAGES.some((p) => p.slug === a.to),
        a.id,
      ).toBe(true);
      expect(a.steps).toHaveLength(0);
    }
  });

  it("only navigation shortcuts leave the Dashboard; Quick Optimize never does", () => {
    expect(
      QUICK_ACTIONS.filter(navigatesAway)
        .map((a) => a.id)
        .sort(),
    ).toEqual(["boost", "one-click", "startup", "telemetry"].sort());
    for (const a of QUICK_OPTIMIZE) {
      expect(navigatesAway(a), a.id).toBe(false);
      expect(a.to).toBeUndefined();
    }
  });

  it("Quick Optimize holds the in-place maintenance actions", () => {
    expect(QUICK_OPTIMIZE.map((a) => a.title)).toEqual([
      "Memory Cleanup",
      "Temporary File Cleanup",
      "Cache Cleanup",
      "Network Boost",
      "Create Restore Point",
    ]);
  });

  it("each Quick Optimize action runs only its own steps", () => {
    for (const a of QUICK_OPTIMIZE) {
      expect(a.steps.length > 0 || a.flow === "restore-point", a.id).toBe(true);
    }
    const temp = QUICK_OPTIMIZE.find((a) => a.id === "temp")!;
    expect(temp.steps.some((s) => /standby|cache/i.test(s.t))).toBe(false);
    const ram = QUICK_OPTIMIZE.find((a) => a.id === "ram")!;
    expect(ram.steps.some((s) => /temp/i.test(s.t))).toBe(false);
  });

  it("cache cleanup skips an open browser and reports zero real changes", () => {
    const r = quickResult(QUICK_OPTIMIZE.find((a) => a.id === "cache")!);
    expect(r.skipped).toBe(1);
    expect(r.realChanges).toBe(0);
  });

  it("refuses to start a second run while one is running", () => {
    expect(canStartQuick(null)).toBe(true);
    expect(canStartQuick("temp")).toBe(false);
  });

  it("walks through steps in order as progress advances", () => {
    const ram = QUICK_OPTIMIZE.find((a) => a.id === "ram")!;
    expect(quickStepAt(ram, 0)).toBe(0);
    expect(quickStepAt(ram, 50)).toBe(1);
    expect(quickStepAt(ram, 100)).toBe(2);
  });
});

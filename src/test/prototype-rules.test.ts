import { describe, expect, it } from "vitest";
import { PAGES, V4_TABS } from "@/lib/eo/registry";
import { ONE_CLICK_ACTIONS } from "@/lib/eo/data";
import { filterRecommendations } from "@/lib/eo/recommendations";

describe("Preserved prototype rules", () => {
  it("keeps all 31 unique registered destinations", () => {
    expect(PAGES).toHaveLength(31);
    expect(new Set(PAGES.map((p) => p.routeKey)).size).toBe(31);
    expect(new Set(PAGES.map((p) => p.slug)).size).toBe(31);
  });
  it("keeps exactly the two original V4 tabs", () => {
    expect(V4_TABS).toEqual(["v4-max-performance", "emulator-optimization"]);
  });
  it("preserves the eight one-click execution identities", () => {
    expect(ONE_CLICK_ACTIONS.map((a) => a.id)).toEqual([
      "visual-tweaks",
      "bcd-platform-timers",
      "shader-cache",
      "fast-clean",
      "deep-clean",
      "background-workload",
      "ram-standby",
      "power-performance",
    ]);
  });
  it("limits restart recommendations to the supplied restart action", () => {
    expect(filterRecommendations(null, "Requires Restart", "").map((a) => a.id)).toEqual([
      "bcd-platform-timers",
    ]);
  });
  it("does not fabricate optional, optimized or protected recommendation rows", () => {
    for (const filter of ["Optional", "Already Optimized", "Protected Items"])
      expect(filterRecommendations(null, filter, "")).toEqual([]);
  });
});

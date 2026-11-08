import { describe, expect, it } from "vitest";
import { PAGES, V4_NAV, V4_REDIRECTS, pageBySlug } from "@/lib/eo/registry";

describe("V4 vertical sidebar", () => {
  it("opens on its own V4 Dashboard", () => {
    expect(V4_NAV[0]?.slug).toBe("v4-dashboard");
  });
  it("lists only V4 pages, never V3 ones", () => {
    for (const n of V4_NAV) expect(pageBySlug(n.slug)?.suite).toBe("V4");
  });
  it("covers every V4 destination", () => {
    const v4 = PAGES.filter((p) => p.suite === "V4")
      .map((p) => p.slug)
      .sort();
    expect(V4_NAV.map((n) => n.slug).sort()).toEqual(v4);
  });
  it("has exactly the five V4 destinations in order", () => {
    expect(V4_NAV.map((n) => n.slug)).toEqual([
      "v4-dashboard",
      "v4-max-performance",
      "emulator-optimization",
      "emulator-debloater",
      "emulator-advanced",
    ]);
  });
  it("redirects former V4 pages to their new homes", () => {
    expect(V4_REDIRECTS).toEqual({
      "v4-core-optimizer": "v4-max-performance",
      "emulator-modules": "emulator-advanced",
      "emulator-deployer": "emulator-debloater",
      "low-end-steam": "emulator-advanced",
    });
    for (const to of Object.values(V4_REDIRECTS)) expect(pageBySlug(to)?.suite).toBe("V4");
  });
});

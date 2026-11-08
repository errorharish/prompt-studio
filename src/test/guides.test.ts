import { describe, expect, it } from "vitest";
import {
  GUIDE_SECTION_TITLES,
  GUIDES,
  NO_PAGE_GUIDE,
  PRESERVED_STEP_GUIDES,
  pageGuide,
  stepGuide,
  type Guide,
} from "@/lib/eo/guides";
import { PAGES } from "@/lib/eo/registry";

const all = Object.entries(GUIDES) as [string, Guide][];

describe("Contextual optimization guides", () => {
  it("gives every optimization page a guide; only overview/info pages have none", () => {
    for (const p of PAGES) {
      const exempt = (NO_PAGE_GUIDE as readonly string[]).includes(p.slug);
      expect(pageGuide(p.slug) !== null, p.slug).toBe(!exempt);
    }
  });

  it("never treats a section guide id as a page guide", () => {
    expect(pageGuide("auto.tasks")).toBeNull();
    expect(pageGuide("system-info")).toBeNull();
    expect(pageGuide("auto-optimize")).toBe("auto-optimize");
  });

  it("explains what, why, how, when, benefit and limits for every guide", () => {
    for (const [id, g] of all) {
      for (const k of ["title", "what", "why", "how", "when", "benefit", "limits"] as const) {
        expect(g[k].trim().length, `${id}.${k}`).toBeGreaterThan(5);
      }
    }
  });

  it("never promises guaranteed or measured results", () => {
    const banned = /guarantee|100%|always faster|instantly|verified on this pc|boosts? fps by/i;
    for (const [id, g] of all) expect(JSON.stringify(g), id).not.toMatch(banned);
  });

  it("marks Recycle Bin emptying and storage cleanup as not reversible", () => {
    expect(GUIDES["storage.recycle"].reversible).toBe("No");
    expect(GUIDES["storage.clean"].reversible).toBe("No");
  });

  it("states browser cleanup is cache-only in the Auto Optimize guides", () => {
    expect(GUIDES["auto-optimize"].safety).toMatch(/cache only/i);
    expect(GUIDES["auto.tasks"].limits).toMatch(/cache only/i);
  });
});

describe("Global GUIDE dialog", () => {
  const guided = PAGES.map((p) => pageGuide(p.slug)).filter((g) => g !== null);

  it("gives the Dashboard a guide", () => {
    expect(pageGuide("")).toBe("dashboard");
  });

  it("gives every guided page its own dialog title (no page shows another page's guide)", () => {
    const titles = guided.map((id) => stepGuide(id).title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const id of guided) {
      const g = stepGuide(id);
      expect(g.sub.length, id).toBeGreaterThan(5);
      expect(g.steps.length, id).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps the V4 Maximum Performance guide word for word", () => {
    const g = stepGuide("v4-max-performance");
    expect(g.title).toBe("Maximum Performance guide");
    expect(g.sub).toBe("Safe, non-destructive Windows performance optimization.");
    expect(g.steps.map((s) => s.title)).toEqual([
      "What Maximum Performance optimizes",
      "What remains safeguarded",
      "Reversibility via local rollback journal",
      "Built for gaming, editing, streaming & daily use",
    ]);
  });

  it("keeps the earlier V3/V4 guides (1-Click, Performance Tuning, Emulator, Debloater, Advanced)", () => {
    expect(stepGuide("one-click").steps.map((s) => s.title)).toEqual([
      "CHECK",
      "REVIEW",
      "CHOOSE",
      "OPTIMIZE",
      "VERIFY",
    ]);
    expect(stepGuide("performance-tuning").steps).toHaveLength(5);
    expect(stepGuide("emulator-optimization").steps).toHaveLength(8);
    expect(stepGuide("emulator-debloater").title).toBe("Emulator Debloater guide");
    expect(stepGuide("emulator-advanced").title).toBe("Emulator Advanced Optimization guide");
  });

  it("builds other pages' guides from the standard sections, in order", () => {
    for (const id of guided) {
      if (PRESERVED_STEP_GUIDES[id]) continue;
      const order = stepGuide(id).steps.map((s) => GUIDE_SECTION_TITLES.indexOf(s.title as never));
      expect(
        order.every((i) => i >= 0),
        id,
      ).toBe(true);
      expect(
        [...order].sort((a, b) => a - b),
        id,
      ).toEqual(order);
      expect(order.slice(0, 3), id).toEqual([0, 1, 2]);
    }
  });

  it("shows Reversibility only when the guide states it, and storage cleanup as not reversible", () => {
    const storage = stepGuide("storage").steps;
    expect(storage.find((s) => s.title === "Reversibility")?.text).toMatch(/^No/);
    expect(stepGuide("registry-values").steps.some((s) => s.title === "Reversibility")).toBe(false);
  });

  it("never promises guaranteed results in any GUIDE dialog", () => {
    const banned = /guarantee|100%|always faster|instantly|verified on this pc|boosts? fps by/i;
    for (const id of guided) expect(JSON.stringify(stepGuide(id)), id).not.toMatch(banned);
  });
});

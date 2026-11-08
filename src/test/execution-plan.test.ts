import { describe, expect, it } from "vitest";
import { buildExecutionPlan, type PlanCandidate } from "@/lib/eo/selection";

const make = (n: number): PlanCandidate<string>[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `op${i + 1}`,
    risk: "LOW" as const,
  }));

describe("buildExecutionPlan — single authoritative run scope", () => {
  it("de-duplicates identical candidates silently", () => {
    const dups: PlanCandidate<string>[] = [
      { id: "a", risk: "LOW" },
      { id: "a", risk: "LOW" },
      { id: "b", risk: "SAFE" },
    ];
    const p = buildExecutionPlan(dups, "AUTO");
    expect(p.available).toBe(2);
    expect(p.duplicates).toBe(1);
    expect(p.queue).toEqual(["a", "b"]);
  });
  it("auto mode runs every eligible item (150 of 150)", () => {
    const p = buildExecutionPlan(make(150), "AUTO", new Set(["op1"]));
    expect(p.queue).toHaveLength(150);
  });
  it("custom mode runs exactly the 10 picked items", () => {
    const picked = new Set(make(10).map((i) => i.id));
    expect(buildExecutionPlan(make(150), "CUSTOM", picked).queue).toHaveLength(10);
  });
  it("custom mode with everything picked runs all eligible", () => {
    const all = new Set(make(150).map((i) => i.id));
    expect(buildExecutionPlan(make(150), "CUSTOM", all).queue).toHaveLength(150);
  });
  it("never auto-runs protected, destructive or incompatible items", () => {
    const items = [
      { id: "a", risk: "PROTECTED" as const },
      { id: "b", risk: "HIGH" as const },
      { id: "c", risk: "LOW" as const, destructive: true },
      { id: "d", risk: "LOW" as const, incompatible: true },
      { id: "e", risk: "SAFE" as const },
    ];
    expect(buildExecutionPlan(items, "AUTO").queue).toEqual(["b", "e"]);
    // Custom can never pick a protected or incompatible item either.
    expect(buildExecutionPlan(items, "CUSTOM", new Set(["a", "d", "b"])).queue).toEqual(["b"]);
  });
  it("drops items with unmet dependencies", () => {
    const items = [
      { id: "base", risk: "LOW" as const, unsupported: true },
      { id: "child", risk: "LOW" as const, requires: ["base"] },
    ];
    const p = buildExecutionPlan(items, "AUTO");
    expect(p.queue).toEqual([]);
    expect(p.excluded.find((e) => e.id === "child")?.reason).toBe("Unmet dependency");
  });
  it("custom mode reports 'Not selected' for unpicked eligible items", () => {
    const p = buildExecutionPlan(make(3), "CUSTOM", new Set(["op1"]));
    expect(p.excluded.filter((e) => e.reason === "Not selected")).toHaveLength(2);
  });
});

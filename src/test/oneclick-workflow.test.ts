import { describe, expect, it } from "vitest";
import { ONE_CLICK_ACTIONS } from "@/lib/eo/data";
import {
  recommendedSelection,
  simulatedRunSummary,
  summarizeSelection,
  toggleInSet,
} from "@/lib/eo/selection";

describe("One-Click workflow rules", () => {
  it("never selects protected items automatically", () => {
    const items = [...ONE_CLICK_ACTIONS, { id: "protected-driver", risk: "PROTECTED" as const }];
    const sel = recommendedSelection(items);
    expect(sel.has("protected-driver")).toBe(false);
    expect(sel.size).toBe(8);
  });

  it("counts the single restart action in a full selection", () => {
    const s = summarizeSelection(ONE_CLICK_ACTIONS, recommendedSelection(ONE_CLICK_ACTIONS));
    expect(s.total).toBe(8);
    expect(s.restart).toBe(1);
    expect(s.byRisk.LOW).toBe(1);
    expect(s.byRisk.SAFE).toBe(7);
  });

  it("reports zero real changes for a simulated run", () => {
    const r = simulatedRunSummary(8, 1, 3000);
    expect(r.realChanges).toBe(0);
    expect(r.simulatedSteps).toBe(8);
    expect(r.verification).toBe("Not performed (prototype)");
  });

  it("toggles selection without mutating the previous set", () => {
    const a = new Set(["x"]);
    const b = toggleInSet(a, "x");
    expect(a.has("x")).toBe(true);
    expect(b.has("x")).toBe(false);
    expect(toggleInSet(b, "y").has("y")).toBe(true);
  });
});

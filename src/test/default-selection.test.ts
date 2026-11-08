import { describe, expect, it } from "vitest";
import {
  clampSelection,
  eligibleSelection,
  isDefaultEligible,
  restoreSelection,
} from "@/lib/eo/selection";

const items = [
  { id: "a", risk: "SAFE" as const },
  { id: "b", risk: "LOW" as const },
  { id: "c", risk: "MEDIUM" as const },
  { id: "d", risk: "HIGH" as const },
  { id: "e", risk: "PROTECTED" as const },
  { id: "f", risk: "SAFE" as const, done: true },
  { id: "g", risk: "SAFE" as const, unsupported: true },
  { id: "h", risk: "LOW" as const, destructive: true },
];

describe("global default selection", () => {
  it("selects every eligible item on first use, including medium and high risk", () => {
    expect([...eligibleSelection(items)].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("never auto-selects protected, done, unsupported or destructive items", () => {
    for (const id of ["e", "f", "g", "h"]) {
      expect(isDefaultEligible(items.find((i) => i.id === id)!)).toBe(false);
    }
  });

  it("restores a saved selection but drops protected and unsupported ids", () => {
    const r = restoreSelection(["a", "d", "e", "g", "zzz"], items);
    expect([...r].sort()).toEqual(["a", "d"]);
  });

  it("keeps a saved empty selection empty (user deselected everything)", () => {
    expect(restoreSelection([], items).size).toBe(0);
  });

  it("clamps Select all / manual picks so protected items can never be executable", () => {
    expect([...clampSelection(["a", "e", "g"], items)]).toEqual(["a"]);
  });

  it("works with numeric ids (process lists)", () => {
    const procs = [
      { id: 10, risk: "SAFE" as const },
      { id: 11, risk: "PROTECTED" as const },
    ];
    expect([...eligibleSelection(procs)]).toEqual([10]);
    expect([...restoreSelection(["10", "11"], procs)]).toEqual([10]);
  });
});

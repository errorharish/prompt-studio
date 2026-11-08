import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetSavedSelections, useModedSelection } from "@/components/eo/useSelection";

const items = [
  { id: "a", risk: "SAFE" as const },
  { id: "b", risk: "MEDIUM" as const },
  { id: "c", risk: "LOW" as const, unsupported: true },
];

describe("mode switching", () => {
  beforeEach(() => resetSavedSelections());

  it("starts in automatic mode with every eligible item", () => {
    const { result } = renderHook(() => useModedSelection("m:one", items));
    expect(result.current.mode).toBe("AUTO");
    expect([...result.current.sel].sort()).toEqual(["a", "b"]);
  });

  it("a manual change enters Custom; switching back restores the full automatic scope", () => {
    const { result } = renderHook(() => useModedSelection("m:one", items));
    act(() => result.current.toggle("a"));
    expect(result.current.mode).toBe("CUSTOM");
    expect([...result.current.sel]).toEqual(["b"]);
    act(() => result.current.setMode("AUTO"));
    expect([...result.current.sel].sort()).toEqual(["a", "b"]);
    // Custom picks are kept for next time.
    act(() => result.current.setMode("CUSTOM"));
    expect([...result.current.sel]).toEqual(["b"]);
  });
});

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetSavedSelections, usePersistedSelection } from "@/components/eo/useSelection";

const items = [
  { id: "a", risk: "SAFE" as const },
  { id: "b", risk: "MEDIUM" as const },
  { id: "x", risk: "PROTECTED" as const },
];

describe("persisted selections", () => {
  beforeEach(() => resetSavedSelections());

  it("selects all eligible items on first use", () => {
    const { result } = renderHook(() => usePersistedSelection("p:one", items));
    expect([...result.current.sel].sort()).toEqual(["a", "b"]);
    expect(result.current.customized).toBe(false);
  });

  it("keeps a deselection across remounts (page revisit)", () => {
    const first = renderHook(() => usePersistedSelection("p:one", items));
    act(() => first.result.current.toggle("a"));
    first.unmount();
    const again = renderHook(() => usePersistedSelection("p:one", items));
    expect([...again.result.current.sel]).toEqual(["b"]);
  });

  it("keeps every profile independent", () => {
    const balanced = renderHook(() => usePersistedSelection("emu:BALANCED", items));
    act(() => balanced.result.current.clear());
    const perf = renderHook(() => usePersistedSelection("emu:PERFORMANCE", items));
    expect(balanced.result.current.sel.size).toBe(0);
    expect([...perf.result.current.sel].sort()).toEqual(["a", "b"]);
  });

  it("never lets a protected item into the selection", () => {
    const { result } = renderHook(() => usePersistedSelection("p:two", items));
    act(() => result.current.setSel(new Set(["a", "x"])));
    expect([...result.current.sel]).toEqual(["a"]);
  });
});

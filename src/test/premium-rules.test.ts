import { describe, expect, it } from "vitest";
import { SCORE_CATEGORIES, overallScore, scoreStatus } from "@/lib/eo/score";
import { clampStep } from "@/lib/eo/slider";

describe("Overall Optimization Score (illustrative)", () => {
  it("shows 92 / 100 from the demo categories", () => {
    expect(overallScore(SCORE_CATEGORIES)).toBe(92);
  });
  it("classifies 85+ as Excellent", () => {
    expect(scoreStatus(85)).toBe("Excellent");
    expect(scoreStatus(92)).toBe("Excellent");
  });
  it("classifies 70–84 as Good", () => {
    expect(scoreStatus(84)).toBe("Good");
    expect(scoreStatus(70)).toBe("Good");
  });
  it("classifies below 70 as Needs Attention", () => {
    expect(scoreStatus(69)).toBe("Needs Attention");
  });
  it("never leaves the 0–100 range", () => {
    expect(overallScore([{ key: "x", label: "x", value: 140, weight: 1, basis: "" }])).toBe(100);
    expect(overallScore([{ key: "x", label: "x", value: -5, weight: 1, basis: "" }])).toBe(0);
  });
});

describe("RAM Limiter slider value rules (0.5–8 GB, 0.25 GB steps)", () => {
  const snap = (v: number) => clampStep(v, 0.5, 8, 0.25);
  it("clamps below the minimum to 0.5 GB", () => {
    expect(snap(0.1)).toBe(0.5);
  });
  it("clamps above the maximum to 8 GB", () => {
    expect(snap(12)).toBe(8);
  });
  it("snaps typed values to the nearest 0.25 GB step", () => {
    expect(snap(2.1)).toBe(2);
    expect(snap(2.2)).toBe(2.25);
    expect(snap(3.874)).toBe(3.75);
  });
  it("keeps the recommended 2 GB default exact", () => {
    expect(snap(2)).toBe(2);
  });
});

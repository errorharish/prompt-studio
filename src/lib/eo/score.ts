// Overall Optimization Score — ILLUSTRATIVE ONLY.
// The original project has no scoring engine, so these category values are demo data
// derived from the sample dashboard readings. Nothing here measures this computer, and a
// simulated run never changes the score.

export interface ScoreCategory {
  key: string;
  label: string;
  /** 0–100 illustrative value. */
  value: number;
  /** Relative weight in the overall score. */
  weight: number;
  /** Which sample readings the value stands for. */
  basis: string;
}

export const SCORE_CATEGORIES: ScoreCategory[] = [
  {
    key: "performance",
    label: "Performance",
    value: 93,
    weight: 0.3,
    basis: "Sample CPU / GPU load and the active V3 profile.",
  },
  {
    key: "responsiveness",
    label: "Responsiveness",
    value: 96,
    weight: 0.3,
    basis: "Sample DPC latency (< 22 µs) and 0.5 ms timer resolution.",
  },
  {
    key: "memory",
    label: "Memory",
    value: 88,
    weight: 0.2,
    basis: "Sample 38% RAM usage on 32 GB DDR5-6000.",
  },
  {
    key: "efficiency",
    label: "System efficiency",
    value: 89,
    weight: 0.2,
    basis: "Sample startup and background workload footprint.",
  },
];

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Weighted average of the category values, rounded and clamped to 0–100. */
export function overallScore(categories: readonly ScoreCategory[]): number {
  const w = categories.reduce((s, c) => s + c.weight, 0);
  if (!w) return 0;
  return Math.round(clamp(categories.reduce((s, c) => s + clamp(c.value) * c.weight, 0) / w));
}

export type ScoreStatus = "Excellent" | "Good" | "Needs Attention";

/** 85+ Excellent · 70–84 Good · below 70 Needs Attention. */
export function scoreStatus(score: number): ScoreStatus {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  return "Needs Attention";
}

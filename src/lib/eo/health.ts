// System Health Check — transparent, reproducible scoring over a fixed SAMPLE snapshot.
// The prototype has no live Windows measurements, so every value below is labelled sample
// data; a missing measurement is `null` and is excluded (never counted as a perfect score).
//
// Method
// 1. Each metric is scored 0–100 with a documented rule (utilization, temperature, capacity
//    or a direct health percentage).
// 2. A category score is its WORST measured metric: one hot drive matters even if the rest
//    is fine.
// 3. The overall score is the weighted average of measured categories, re-normalized by the
//    measured weight. Coverage = measured weight / total weight.
// 4. Below 50% coverage there is no overall score ("Not enough data").
// 5. Utilization is load, not hardware health: high load lowers the score but is never
//    reported as hardware damage.
import { scoreStatus, type ScoreStatus } from "./score";

export type MetricKind = "utilization" | "thermal" | "capacity" | "hardware";

export const KIND_LABEL: Record<MetricKind, string> = {
  utilization: "Resource use",
  thermal: "Temperature",
  capacity: "Capacity",
  hardware: "Hardware health",
};

export interface HealthMetric {
  key: string;
  label: string;
  kind: MetricKind;
  /** Sample value, or null when it is not measured in the prototype. */
  value: number | null;
  unit: string;
  /** Temperature thresholds (°C) for thermal metrics. */
  warn?: number;
  crit?: number;
  /** Why a value is missing. */
  missingReason?: string;
}

export interface HealthCategory {
  key: string;
  label: string;
  weight: number;
  metrics: HealthMetric[];
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Load ≤ 60% scores 100; above that it falls 1.75 points per % (100% load → 30). */
export const utilizationScore = (pct: number) => clamp(pct <= 60 ? 100 : 100 - (pct - 60) * 1.75);

/** ≤ warn scores 100; warn → crit falls linearly to 40; above crit scores 20. */
export function thermalScore(c: number, warn: number, crit: number) {
  if (c <= warn) return 100;
  if (c >= crit) return 20;
  return clamp(100 - ((c - warn) / (crit - warn)) * 60);
}

/** ≤ 75% used scores 100; 75 → 100% falls linearly to 30. */
export const capacityScore = (pct: number) => clamp(pct <= 75 ? 100 : 100 - (pct - 75) * 2.8);

/** Score of one metric, or null when it was not measured. */
export function metricScore(m: HealthMetric): number | null {
  if (m.value === null) return null;
  switch (m.kind) {
    case "utilization":
      return Math.round(utilizationScore(m.value));
    case "thermal":
      return Math.round(thermalScore(m.value, m.warn ?? 80, m.crit ?? 95));
    case "capacity":
      return Math.round(capacityScore(m.value));
    case "hardware":
      return Math.round(clamp(m.value));
  }
}

/** Worst measured metric, or null when nothing in the category was measured. */
export function categoryScore(c: HealthCategory): number | null {
  const s = c.metrics.map(metricScore).filter((v): v is number => v !== null);
  return s.length ? Math.min(...s) : null;
}

export interface HealthResult {
  overall: number | null;
  status: ScoreStatus | "Not enough data";
  /** Measured weight / total weight, 0–1. */
  coverage: number;
  categories: { key: string; label: string; score: number | null; weight: number }[];
  attention: Attention[];
}

export interface Attention {
  category: string;
  metric: string;
  kind: MetricKind;
  score: number | null;
  /** Plain-language finding. */
  finding: string;
  /** Informative only — never runs anything. */
  advice: string;
}

/** Metrics scoring below this are listed as attention areas. */
export const ATTENTION_BELOW = 85;
export const MIN_COVERAGE = 0.5;

export function evaluateHealth(categories: readonly HealthCategory[]): HealthResult {
  const total = categories.reduce((s, c) => s + c.weight, 0);
  const scored = categories.map((c) => ({
    key: c.key,
    label: c.label,
    weight: c.weight,
    score: categoryScore(c),
  }));
  const measured = scored.filter((c) => c.score !== null);
  const mw = measured.reduce((s, c) => s + c.weight, 0);
  const coverage = total ? mw / total : 0;
  const overall =
    coverage >= MIN_COVERAGE && mw
      ? Math.round(measured.reduce((s, c) => s + (c.score ?? 0) * c.weight, 0) / mw)
      : null;

  const attention: Attention[] = [];
  for (const c of categories) {
    for (const m of c.metrics) {
      const s = metricScore(m);
      if (s === null) {
        attention.push({
          category: c.label,
          metric: m.label,
          kind: m.kind,
          score: null,
          finding: `${m.label} not measured`,
          advice: m.missingReason ?? "Not available in the prototype; excluded from the score.",
        });
      } else if (s < ATTENTION_BELOW) {
        attention.push({
          category: c.label,
          metric: m.label,
          kind: m.kind,
          score: s,
          finding: `${m.label} ${m.value}${m.unit}`,
          advice: ADVICE[m.key] ?? "Review this reading on the matching page.",
        });
      }
    }
  }
  attention.sort((a, b) => (a.score ?? 101) - (b.score ?? 101));

  return {
    overall,
    status: overall === null ? "Not enough data" : scoreStatus(overall),
    coverage,
    categories: scored,
    attention,
  };
}

const ADVICE: Record<string, string> = {
  "cpu-load":
    "High load is normal during heavy work; check Process Reduction if it stays high at idle.",
  "cpu-temp": "Check cooler mounting, fan curves and case airflow.",
  "mem-used": "Close unused apps; Memory Cleanup on the Dashboard releases standby memory.",
  "mem-commit":
    "Commit is close to the limit: close unused background apps or review the page-file size.",
  "gpu-load": "High GPU load is expected in games; check background GPU apps at idle.",
  "gpu-temp": "Check GPU fan curves and case airflow.",
  "disk-used": "Storage Optimizer can review temporary files and large folders.",
  "disk-temp": "The drive runs warm: improve airflow over the M.2 slot or fit a heatsink.",
  "disk-health": "Back up important files and check the drive with its vendor tool.",
};

/** Fixed SAMPLE snapshot — matches the Dashboard's sample readings; nothing is measured. */
export const SAMPLE_HEALTH: HealthCategory[] = [
  {
    key: "cpu",
    label: "CPU",
    weight: 0.25,
    metrics: [
      { key: "cpu-load", label: "CPU load", kind: "utilization", value: 18, unit: "%" },
      {
        key: "cpu-temp",
        label: "CPU temperature",
        kind: "thermal",
        value: 42,
        unit: "°C",
        warn: 80,
        crit: 95,
      },
    ],
  },
  {
    key: "memory",
    label: "Memory",
    weight: 0.2,
    metrics: [
      { key: "mem-used", label: "Memory in use", kind: "utilization", value: 38, unit: "%" },
      { key: "mem-commit", label: "Commit charge", kind: "utilization", value: 71, unit: "%" },
    ],
  },
  {
    key: "gpu",
    label: "GPU",
    weight: 0.2,
    metrics: [
      { key: "gpu-load", label: "GPU load", kind: "utilization", value: 14, unit: "%" },
      {
        key: "gpu-temp",
        label: "GPU temperature",
        kind: "thermal",
        value: 44,
        unit: "°C",
        warn: 83,
        crit: 95,
      },
    ],
  },
  {
    key: "storage",
    label: "Storage",
    weight: 0.2,
    metrics: [
      { key: "disk-used", label: "System drive used", kind: "capacity", value: 46, unit: "%" },
      {
        key: "disk-temp",
        label: "Drive temperature",
        kind: "thermal",
        value: 61,
        unit: "°C",
        warn: 55,
        crit: 70,
      },
      { key: "disk-health", label: "Drive health (SMART)", kind: "hardware", value: 99, unit: "%" },
    ],
  },
  {
    key: "responsiveness",
    label: "Responsiveness",
    weight: 0.15,
    metrics: [
      {
        key: "dpc",
        label: "DPC latency",
        kind: "utilization",
        value: null,
        unit: " µs",
        missingReason:
          "Needs a native latency trace; excluded from the score instead of counted as perfect.",
      },
    ],
  },
];

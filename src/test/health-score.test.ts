import { describe, expect, it } from "vitest";
import {
  SAMPLE_HEALTH,
  capacityScore,
  evaluateHealth,
  thermalScore,
  utilizationScore,
  type HealthCategory,
} from "@/lib/eo/health";

describe("System Health Check score", () => {
  it("scores the sample snapshot reproducibly", () => {
    const a = evaluateHealth(SAMPLE_HEALTH);
    const b = evaluateHealth(SAMPLE_HEALTH);
    expect(a).toEqual(b);
    expect(a.overall).toBe(90);
    expect(a.status).toBe("Excellent");
  });

  it("uses each category's worst reading", () => {
    const r = evaluateHealth(SAMPLE_HEALTH);
    const cat = Object.fromEntries(r.categories.map((c) => [c.key, c.score]));
    expect(cat).toEqual({ cpu: 100, memory: 81, gpu: 100, storage: 76, responsiveness: null });
  });

  it("leaves missing data out instead of counting it as perfect", () => {
    const r = evaluateHealth(SAMPLE_HEALTH);
    expect(r.coverage).toBeCloseTo(0.85);
    const withPerfect = evaluateHealth(
      SAMPLE_HEALTH.map((c) =>
        c.key === "responsiveness"
          ? { ...c, metrics: c.metrics.map((m) => ({ ...m, value: 0 })) }
          : c,
      ),
    );
    expect(withPerfect.coverage).toBe(1);
    expect(r.attention.some((a) => a.score === null)).toBe(true);
  });

  it("gives no overall score below 50% coverage", () => {
    const sparse: HealthCategory[] = SAMPLE_HEALTH.map((c) =>
      c.key === "cpu" ? c : { ...c, metrics: c.metrics.map((m) => ({ ...m, value: null })) },
    );
    const r = evaluateHealth(sparse);
    expect(r.overall).toBeNull();
    expect(r.status).toBe("Not enough data");
  });

  it("documents the metric rules", () => {
    expect(utilizationScore(60)).toBe(100);
    expect(utilizationScore(100)).toBe(30);
    expect(thermalScore(55, 55, 70)).toBe(100);
    expect(thermalScore(70, 55, 70)).toBe(20);
    expect(capacityScore(75)).toBe(100);
    expect(capacityScore(100)).toBe(30);
  });

  it("labels high load as resource use, never hardware damage", () => {
    const busy: HealthCategory[] = [
      {
        key: "cpu",
        label: "CPU",
        weight: 1,
        metrics: [
          { key: "cpu-load", label: "CPU load", kind: "utilization", value: 98, unit: "%" },
        ],
      },
    ];
    const r = evaluateHealth(busy);
    expect(r.attention[0]?.kind).toBe("utilization");
    expect(JSON.stringify(r)).not.toMatch(/damage|fault|failing/i);
  });
});

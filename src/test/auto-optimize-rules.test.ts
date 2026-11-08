import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  MAINT_TASKS,
  PRESET_INTERVALS,
  formatInterval,
  onScheduleDue,
  planRun,
  sanitizeConfig,
  summarizeOutcomes,
  validateCustomInterval,
  type AutoConfig,
} from "@/lib/eo/autoOptimize";

const cfg = (p: Partial<AutoConfig>): AutoConfig => ({ ...DEFAULT_CONFIG, ...p });

describe("Auto Optimize schedule", () => {
  it("offers 1, 5, 10, 30 and 60 minute presets", () => {
    expect([...PRESET_INTERVALS]).toEqual([1, 5, 10, 30, 60]);
  });
  it("accepts custom intervals up to 24 hours", () => {
    expect(validateCustomInterval("24", "hours")).toEqual({ ok: true, minutes: 1440 });
    expect(validateCustomInterval("45", "minutes")).toEqual({ ok: true, minutes: 45 });
    expect(validateCustomInterval("2", "hours")).toEqual({ ok: true, minutes: 120 });
  });
  it("rejects intervals longer than 24 hours", () => {
    expect(validateCustomInterval("25", "hours").ok).toBe(false);
    expect(validateCustomInterval("1441", "minutes").ok).toBe(false);
  });
  it("rejects zero, negative, empty and non-numeric intervals", () => {
    for (const v of ["0", "-5", "", "abc"])
      expect(validateCustomInterval(v, "minutes").ok).toBe(false);
  });
  it("rejects fractions of a minute", () => {
    expect(validateCustomInterval("1.5", "minutes").ok).toBe(false);
    expect(validateCustomInterval("1.5", "hours")).toEqual({ ok: true, minutes: 90 });
  });
  it("falls back to the default when a stored interval is invalid", () => {
    expect(sanitizeConfig({ intervalMin: 0 }).intervalMin).toBe(DEFAULT_CONFIG.intervalMin);
    expect(sanitizeConfig({ intervalMin: 5000 }).intervalMin).toBe(DEFAULT_CONFIG.intervalMin);
  });
  it("describes intervals in plain words", () => {
    expect(formatInterval(1)).toBe("Every 1 minute");
    expect(formatInterval(120)).toBe("Every 2 hours");
  });
});

describe("Auto Optimize safety rules", () => {
  it("never plans a task the user did not select", () => {
    const plan = planRun(cfg({ tasks: ["mem-standby"] }), "Schedule");
    expect(plan.map((p) => p.task.id)).toEqual(["mem-standby"]);
    expect(planRun(cfg({ tasks: [] }), "Schedule")).toEqual([]);
  });
  it("skips a running browser's cache instead of closing it", () => {
    const [p] = planRun(cfg({ tasks: ["browser-edge"] }), "Schedule", new Set(["Edge"]));
    expect(p?.run).toBe(false);
  });
  it("skips the Recycle Bin on unattended runs while confirmation is on", () => {
    expect(planRun(cfg({ tasks: ["recycle-bin"], recycleConfirm: true }), "Schedule")[0]?.run).toBe(
      false,
    );
    expect(planRun(cfg({ tasks: ["recycle-bin"], recycleConfirm: true }), "Manual")[0]?.run).toBe(
      true,
    );
    expect(
      planRun(cfg({ tasks: ["recycle-bin"], recycleConfirm: false }), "Schedule")[0]?.run,
    ).toBe(true);
  });
  it("selects every eligible task by default except the Recycle Bin", () => {
    const browser = MAINT_TASKS.filter((t) => t.category === "BROWSER");
    expect(browser.length).toBe(3);
    // Browser tasks are cache-only, so they are eligible defaults.
    expect(browser.every((t) => DEFAULT_CONFIG.tasks.includes(t.id))).toBe(true);
    expect(DEFAULT_CONFIG.tasks).not.toContain("recycle-bin");
    expect(DEFAULT_CONFIG.tasks.length).toBe(MAINT_TASKS.length - 1);
  });
  it("never overlaps runs: skip policy skips, queue policy queues at most one", () => {
    expect(onScheduleDue(false, false, "skip")).toBe("start");
    expect(onScheduleDue(true, false, "skip")).toBe("skip");
    expect(onScheduleDue(true, false, "queue")).toBe("queue");
    expect(onScheduleDue(true, true, "queue")).toBe("skip");
  });
  it("does not report success for a cancelled run, and never reports real changes", () => {
    const s = summarizeOutcomes(["Completed", "Cancelled", "Not run"]);
    expect(s.status).toBe("Cancelled");
    expect(s.realChanges).toBe(0);
    expect(summarizeOutcomes(["Completed", "Skipped"]).status).toBe("Partial");
    expect(summarizeOutcomes(["Skipped"]).status).toBe("Skipped");
  });
});

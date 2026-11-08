import { describe, expect, it } from "vitest";
import {
  restoreStep,
  scenarioAfterEnable,
  simulatedProtection,
  simulatedProtectionAfterEnable,
  type RestoreEvent,
  type RestoreStage,
} from "@/lib/eo/restorePoint";

const run = (events: RestoreEvent[], from: RestoreStage = "idle") =>
  events.reduce(restoreStep, from);

describe("Restore point with System Protection", () => {
  it("protection on: creates and verifies directly", () => {
    expect(
      run([
        { type: "start" },
        { type: "checked", protection: "on" },
        { type: "created" },
        { type: "point-verified", ok: true },
      ]),
    ).toBe("success");
  });

  it("protection off: shows the System Protection Required step, not a failure", () => {
    expect(run([{ type: "start" }, { type: "checked", protection: "off" }])).toBe(
      "protection-required",
    );
  });

  it("never creates a restore point while protection is off", () => {
    expect(restoreStep("protection-required", { type: "created" })).toBe("protection-required");
    expect(restoreStep("protection-required", { type: "point-verified", ok: true })).toBe(
      "protection-required",
    );
  });

  it("enabling needs an explicit confirmation step", () => {
    expect(restoreStep("protection-required", { type: "confirm-enable" })).toBe(
      "protection-required",
    );
    expect(restoreStep("protection-required", { type: "request-enable" })).toBe("confirm-enable");
    expect(restoreStep("confirm-enable", { type: "confirm-enable" })).toBe("enabling");
  });

  it("Cancel on the System Protection dialog stops without changes", () => {
    expect(restoreStep("protection-required", { type: "cancel" })).toBe("cancelled");
    expect(restoreStep("confirm-enable", { type: "cancel" })).toBe("cancelled");
  });

  it("enabling cannot be interrupted half-way", () => {
    expect(restoreStep("enabling", { type: "cancel" })).toBe("enabling");
  });

  it("retries creation only after protection is verified on", () => {
    const path = run(
      [
        { type: "request-enable" },
        { type: "confirm-enable" },
        { type: "enable-finished" },
        { type: "protection-verified", on: true },
      ],
      "protection-required",
    );
    expect(path).toBe("creating");
    expect(restoreStep("verifying-protection", { type: "protection-verified", on: false })).toBe(
      "enable-failed",
    );
  });

  it("never reports success without a verified restore point", () => {
    expect(restoreStep("creating", { type: "point-verified", ok: true })).toBe("creating");
    expect(restoreStep("verifying-point", { type: "point-verified", ok: false })).toBe(
      "create-failed",
    );
  });

  it("simulated device: blocked policy keeps protection off", () => {
    expect(simulatedProtection("enabled")).toBe("on");
    expect(simulatedProtection("disabled")).toBe("off");
    expect(simulatedProtectionAfterEnable("disabled")).toBe(true);
    expect(simulatedProtectionAfterEnable("blocked")).toBe(false);
    expect(scenarioAfterEnable("disabled", true)).toBe("enabled");
    expect(scenarioAfterEnable("blocked", false)).toBe("blocked");
  });
});

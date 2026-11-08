// Restore point workflow with System Protection handling — pure rules, no side effects.
// The prototype never calls Windows: protection status, enabling and restore-point creation
// are simulated from a chosen "simulated device" scenario. The rules below make the unsafe
// paths impossible: no creation before protection is verified on, no enabling without an
// explicit confirmation, and no success without a verified restore point.

/** Simulated device state used to demonstrate both scenarios in the browser. */
export type ProtectionScenario = "enabled" | "disabled" | "blocked";

export const PROTECTION_SCENARIOS: { id: ProtectionScenario; label: string; desc: string }[] = [
  { id: "enabled", label: "Protection on", desc: "System Protection is already on for C:" },
  {
    id: "disabled",
    label: "Protection off",
    desc: "Protection is off; enabling it with permission succeeds",
  },
  {
    id: "blocked",
    label: "Blocked by policy",
    desc: "Protection is off and a policy prevents turning it on",
  },
];

/** The only drive the workflow ever touches: the Windows system drive (sample). */
export const SYSTEM_DRIVE = {
  letter: "C:",
  label: "Local Disk (C:)",
  role: "Windows system drive",
} as const;

export type RestoreStage =
  | "idle"
  | "checking"
  | "protection-required"
  | "confirm-enable"
  | "enabling"
  | "verifying-protection"
  | "creating"
  | "verifying-point"
  | "success"
  | "enable-failed"
  | "create-failed"
  | "cancelled";

export type RestoreEvent =
  | { type: "start" }
  | { type: "checked"; protection: "on" | "off" }
  | { type: "request-enable" }
  | { type: "confirm-enable" }
  | { type: "back" }
  | { type: "enable-finished" }
  | { type: "protection-verified"; on: boolean }
  | { type: "created" }
  | { type: "point-verified"; ok: boolean }
  | { type: "retry" }
  | { type: "cancel" };

/** Stages that run on their own (a timer fires the next event). */
export const AUTO_STAGES: readonly RestoreStage[] = [
  "checking",
  "enabling",
  "verifying-protection",
  "creating",
  "verifying-point",
];

/** Stages during which the user may cancel. Enabling is never interrupted half-way. */
export const canCancel = (s: RestoreStage) =>
  s === "idle" ||
  s === "checking" ||
  s === "protection-required" ||
  s === "confirm-enable" ||
  s === "enable-failed" ||
  s === "create-failed";

/**
 * Next stage for an event. Invalid events leave the stage unchanged, so e.g. "created" can
 * never be reached from "protection-required" and "confirm-enable" cannot be skipped.
 */
export function restoreStep(stage: RestoreStage, e: RestoreEvent): RestoreStage {
  if (e.type === "cancel") return canCancel(stage) ? "cancelled" : stage;
  switch (stage) {
    case "idle":
    case "success":
    case "cancelled":
      return e.type === "start" ? "checking" : stage;
    case "checking":
      if (e.type !== "checked") return stage;
      return e.protection === "on" ? "creating" : "protection-required";
    case "protection-required":
      return e.type === "request-enable" ? "confirm-enable" : stage;
    case "confirm-enable":
      if (e.type === "confirm-enable") return "enabling";
      if (e.type === "back") return "protection-required";
      return stage;
    case "enabling":
      return e.type === "enable-finished" ? "verifying-protection" : stage;
    case "verifying-protection":
      if (e.type !== "protection-verified") return stage;
      return e.on ? "creating" : "enable-failed";
    case "creating":
      return e.type === "created" ? "verifying-point" : stage;
    case "verifying-point":
      if (e.type !== "point-verified") return stage;
      return e.ok ? "success" : "create-failed";
    case "enable-failed":
    case "create-failed":
      return e.type === "retry" ? "checking" : stage;
  }
}

/** Simulated status read for the system drive. */
export const simulatedProtection = (s: ProtectionScenario): "on" | "off" =>
  s === "enabled" ? "on" : "off";

/** Simulated read-back after an enable attempt: a policy keeps protection off. */
export const simulatedProtectionAfterEnable = (s: ProtectionScenario): boolean => s !== "blocked";

/** Scenario after a verified enable: the simulated device now has protection on. */
export const scenarioAfterEnable = (
  s: ProtectionScenario,
  verifiedOn: boolean,
): ProtectionScenario => (verifiedOn ? "enabled" : s);

/** Accurate manual steps shown when protection cannot be turned on by the app. */
export const MANUAL_ENABLE_STEPS: string[] = [
  "Open Start, type “Create a restore point” and open it (System Properties › System Protection).",
  "Select Local Disk (C:) (System) and choose Configure.",
  "Pick “Turn on system protection”, set the disk space to use, then choose OK.",
  "If these options are greyed out, an administrator or organization policy has turned System Restore off — ask your administrator.",
  "Come back here and choose Try again.",
];

/** Overall progress shown for the automatic stages (0–100). */
export function restoreProgress(stage: RestoreStage): number {
  const map: Partial<Record<RestoreStage, number>> = {
    checking: 12,
    enabling: 38,
    "verifying-protection": 58,
    creating: 78,
    "verifying-point": 94,
    success: 100,
  };
  return map[stage] ?? 0;
}

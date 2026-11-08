// Input Optimization modes — pure data and rules.
// Normal and Advanced are recommendation-driven (their selection is computed, never edited);
// Custom is the only mode where the user picks items, and it is saved separately.
import type { Risk } from "./data";
import { eligibleSelection, isDefaultEligible, type SelectionCandidate } from "./selection";

export type InputMode = "NORMAL" | "ADVANCED" | "CUSTOM";
export const INPUT_MODES: InputMode[] = ["NORMAL", "ADVANCED", "CUSTOM"];

export interface InputItem extends SelectionCandidate<string> {
  id: string;
  title: string;
  desc: string;
  group: "normal" | "advanced";
  risk: Risk;
  recommended: boolean;
  /** Compatibility note on the sample system. */
  compat: string;
  restart?: boolean;
}

export const INPUT_ITEMS: InputItem[] = [
  {
    id: "mouse-accel",
    title: "Disable mouse acceleration",
    desc: "1:1 raw pointer movement (Enhance pointer precision off)",
    group: "normal",
    risk: "LOW",
    recommended: true,
    compat: "Already applied on the sample system",
    done: true,
  },
  {
    id: "kb-repeat-rate",
    title: "Maximize keyboard repeat rate",
    desc: "Fastest standard repeat rate",
    group: "normal",
    risk: "LOW",
    recommended: true,
    compat: "Any keyboard",
  },
  {
    id: "kb-repeat-delay",
    title: "Minimum keyboard repeat delay",
    desc: "Shortest standard delay before a key repeats",
    group: "normal",
    risk: "LOW",
    recommended: true,
    compat: "Any keyboard",
  },
  {
    id: "mouse-hover",
    title: "Reduce mouse hover time",
    desc: "Tooltips and hover menus open sooner",
    group: "normal",
    risk: "SAFE",
    recommended: true,
    compat: "Any pointer",
  },
  {
    id: "mouse-queue",
    title: "Mouse data queue size",
    desc: "MouseDataQueueSize for the mouclass driver",
    group: "advanced",
    risk: "LOW",
    recommended: true,
    compat: "Already applied on the sample system",
    done: true,
    restart: true,
  },
  {
    id: "kb-queue",
    title: "Keyboard data queue size",
    desc: "KeyboardDataQueueSize for the kbdclass driver",
    group: "advanced",
    risk: "LOW",
    recommended: true,
    compat: "Standard HID keyboard",
    restart: true,
  },
  {
    id: "timer-request",
    title: "High-precision timer request",
    desc: "Lets apps keep their requested timer resolution (GlobalTimerResolutionRequests)",
    group: "advanced",
    risk: "MEDIUM",
    recommended: true,
    compat: "Windows 11 · higher idle power use",
    restart: true,
  },
  {
    id: "usb-suspend",
    title: "USB selective suspend (input devices)",
    desc: "Keeps USB input devices from sleeping",
    group: "advanced",
    risk: "LOW",
    recommended: true,
    compat: "Desktop on AC power",
  },
  {
    id: "csrss-priority",
    title: "Raise input thread priority",
    desc: "CSRSS / input thread priority override",
    group: "advanced",
    risk: "HIGH",
    recommended: true,
    compat: "High-priority thread tuning for competitive input response",
    restart: true,
  },
  {
    id: "ps2-queue",
    title: "PS/2 keyboard buffer",
    desc: "i8042prt buffer size",
    group: "advanced",
    risk: "LOW",
    recommended: true,
    compat: "Not applicable — no PS/2 keyboard on the sample system",
    unsupported: true,
  },
];

/** Items each mode shows. Advanced includes the Normal set plus the advanced options. */
export function itemsForMode(mode: InputMode, items: readonly InputItem[] = INPUT_ITEMS) {
  return mode === "NORMAL" ? items.filter((i) => i.group === "normal") : [...items];
}

/** The computed (read-only) selection of a recommendation-driven mode. */
export function modeSelection(
  mode: Exclude<InputMode, "CUSTOM">,
  items: readonly InputItem[] = INPUT_ITEMS,
): Set<string> {
  return eligibleSelection(itemsForMode(mode, items));
}

/** Why an item is not part of a recommendation-driven mode, or null when it is included. */
export function exclusionReason(i: InputItem): string | null {
  if (isDefaultEligible(i)) return null;
  if (i.unsupported) return "Not applicable";
  if (i.risk === "PROTECTED") return "Protected";
  if (i.done) return "Already applied";
  if (!i.recommended) return "Not recommended";
  return "Excluded";
}

/** Normalizes a stored mode value. */
export const parseInputMode = (raw: unknown): InputMode =>
  raw === "ADVANCED" || raw === "CUSTOM" ? raw : "NORMAL";

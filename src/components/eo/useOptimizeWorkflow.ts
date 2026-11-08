// Shared state for the 1-Click workflow: Analyze → Review → Confirm → Result.
// Selection and summaries go through src/lib/eo/selection.ts; the selection itself is
// persisted (first use: every eligible action selected, protected items never).
import { useMemo, useState } from "react";
import { useSimRun } from "./kit";
import { useModedSelection, usePersistedSelection } from "./useSelection";
import { ONE_CLICK_ACTIONS } from "@/lib/eo/data";
import { summarizeSelection, type SimulatedRunSummary } from "@/lib/eo/selection";

export type LastRun = SimulatedRunSummary & { at: string; titles: string[] };

export function useOptimizeWorkflow(scanMs = 1400) {
  const scan = useSimRun(scanMs);
  const [analyzed, setAnalyzed] = useState(false);
  const selection = useModedSelection("one-click", ONE_CLICK_ACTIONS);
  const { sel, setSel } = selection;
  const [lastRun, setLastRun] = useState<LastRun | null>(null);

  const summary = useMemo(() => summarizeSelection(ONE_CLICK_ACTIONS, sel), [sel]);
  const selectedItems = useMemo(() => ONE_CLICK_ACTIONS.filter((a) => sel.has(a.id)), [sel]);

  return {
    scan,
    analyzed,
    sel,
    setSel,
    summary,
    selectedItems,
    lastRun,
    moded: selection,
    toggle: selection.toggle,
    /** Loads the sample recommendations; the saved (or default eligible) selection is kept. */
    analyze: (onDone?: () => void) =>
      scan.start(() => {
        setAnalyzed(true);
        onDone?.();
      }),
    selectRecommended: selection.selectAll,
    clear: selection.clear,
    complete: (s: SimulatedRunSummary) =>
      setLastRun({
        ...s,
        at: new Date().toLocaleTimeString(),
        titles: selectedItems.map((a) => a.title),
      }),
    dismissRun: () => setLastRun(null),
  };
}

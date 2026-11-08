// Persisted per-page / per-profile optimization selections.
// First use → every eligible item selected (src/lib/eo/selection.ts rules). Once the user changes
// a selection it is saved under its own key, so profiles never share or overwrite each other.
// Prototype storage only: localStorage in this browser, nothing touches the computer.
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  buildExecutionPlan,
  type ExecutionPlan,
  type SelectionMode,
  clampSelection,
  eligibleSelection,
  restoreSelection,
  type SelectionCandidate,
} from "@/lib/eo/selection";

const STORAGE_KEY = "eo-selections:v1";
const MODE_STORAGE_KEY = "eo-selection-modes:v1";
type Saved = Record<string, string[]>;
type SavedModes = Record<string, SelectionMode>;

let saved: Saved | null = null;
let savedModes: SavedModes | null = null;
const listeners = new Set<() => void>();
const modeListeners = new Set<() => void>();

function read(): Saved {
  if (saved) return saved;
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    saved = raw && typeof raw === "object" ? (raw as Saved) : {};
  } catch {
    saved = {};
  }
  return saved;
}

function write(key: string, ids: string[] | undefined) {
  const next = { ...read() };
  if (ids) next[key] = ids;
  else delete next[key];
  saved = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled — keep the in-memory copy */
  }
  listeners.forEach((l) => l());
}

function readModes(): SavedModes {
  if (savedModes) return savedModes;
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(MODE_STORAGE_KEY) ?? "{}");
    savedModes = raw && typeof raw === "object" ? (raw as SavedModes) : {};
  } catch {
    savedModes = {};
  }
  return savedModes;
}

function writeMode(key: string, mode: SelectionMode | undefined) {
  const next = { ...readModes() };
  if (mode && mode !== "ALL_ELIGIBLE" && mode !== "AUTO") next[key] = mode;
  else delete next[key];
  savedModes = next;
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled */
  }
  modeListeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const subscribeModes = (l: () => void) => {
  modeListeners.add(l);
  return () => modeListeners.delete(l);
};

/** Test/reset helper: forgets every saved selection and mode. */
export function resetSavedSelections() {
  saved = {};
  savedModes = {};
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(MODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
  modeListeners.forEach((l) => l());
}

export interface PersistedSelection<T extends string | number> {
  sel: Set<T>;
  setSel: (next: Set<T> | ((cur: Set<T>) => Set<T>)) => void;
  toggle: (id: T) => void;
  /** Select every eligible item (never protected / destructive). */
  selectAll: () => void;
  clear: () => void;
  /** Forget the saved customization and return to the first-use default. */
  reset: () => void;
  /** True once the user changed this selection. */
  customized: boolean;
  eligibleCount: number;
}

/** Items are usually inline literals; key memos on their identity-relevant fields. */
function useStableItems<I extends SelectionCandidate<string | number>>(items: readonly I[]) {
  const sig = items
    .map(
      (i) =>
        `${String(i.id)}:${i.risk ?? ""}:${i.done ? 1 : 0}:${i.unsupported ? 1 : 0}:${i.incompatible ? 1 : 0}:${i.destructive ? 1 : 0}:${i.recommended === false ? 0 : 1}:${String((i as { requires?: unknown }).requires ?? "")}`,
    )
    .join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => items, [sig]);
}

/**
 * @param key   Unique per page and per profile, e.g. `tier:tier-pro` or `emu-opt:BALANCED`.
 * @param items Every row the page can show (protected rows included — they are filtered out).
 */
export function usePersistedSelection<T extends string | number>(
  key: string,
  items: readonly SelectionCandidate<T>[],
): PersistedSelection<T> {
  const raw = useSyncExternalStore(
    subscribe,
    () => read()[key],
    () => undefined,
  );
  const stable = useStableItems(items);
  const defaults = useMemo(() => eligibleSelection(stable), [stable]);
  const sel = useMemo(
    () => (raw ? restoreSelection(raw, stable) : defaults),
    [raw, stable, defaults],
  );

  const setSel = useCallback<PersistedSelection<T>["setSel"]>(
    (next) => {
      const current = read()[key];
      const cur = current ? restoreSelection(current, stable) : eligibleSelection(stable);
      const value = typeof next === "function" ? next(cur) : next;
      write(
        key,
        [...clampSelection(value, stable)].map((id) => String(id)),
      );
    },
    [key, stable],
  );

  return {
    sel,
    setSel,
    toggle: (id) =>
      setSel((cur) => {
        const n = new Set(cur);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    selectAll: () => setSel(eligibleSelection(stable)),
    clear: () => setSel(new Set()),
    reset: () => write(key, undefined),
    customized: raw !== undefined,
    eligibleCount: defaults.size,
  };
}

export interface ModedSelection<T extends string | number> extends PersistedSelection<T> {
  mode: SelectionMode;
  setMode: (m: SelectionMode) => void;
  plan: ExecutionPlan<T>;
  highRiskCount: number;
  highRiskSelectedCount: number;
  customModalOpen: boolean;
  openCustomModal: () => void;
  closeCustomModal: () => void;
  confirmCustom: (newCustom: Set<T>) => void;
  items: readonly SelectionCandidate<T>[];
}

/**
 * Global Optimization Selection Workflow:
 * - ALL ELIGIBLE (Default): Automatically selects ALL eligible items in the module,
 *   explicitly including high-risk eligible options. Genuine ineligibles & dependencies excluded.
 * - CUSTOM: User-defined selection managed via the shared Custom Selection modal.
 * Single authoritative execution plan drives counts, UI, review and execution flows.
 */
export function useModedSelection<T extends string | number>(
  key: string,
  items: readonly SelectionCandidate<T>[],
): ModedSelection<T> {
  const stable = useStableItems(items);
  const [modalOpen, setModalOpen] = useState(false);

  // 1. Persistent mode ("ALL_ELIGIBLE" by default)
  const rawMode = useSyncExternalStore(
    subscribeModes,
    () => readModes()[key],
    () => undefined,
  );
  const mode: SelectionMode = rawMode === "CUSTOM" ? "CUSTOM" : "ALL_ELIGIBLE";

  // 2. Persistent custom IDs
  const rawCustom = useSyncExternalStore(
    subscribe,
    () => read()[key],
    () => undefined,
  );

  const defaults = useMemo(() => eligibleSelection(stable), [stable]);
  const customSet = useMemo(
    () => (rawCustom ? restoreSelection(rawCustom, stable) : defaults),
    [rawCustom, stable, defaults],
  );

  // 3. Single authoritative execution plan
  const plan = useMemo(
    () => buildExecutionPlan(stable, mode, customSet),
    [stable, mode, customSet],
  );

  const sel = useMemo(() => new Set(plan.queue), [plan]);

  const setCustomSel = useCallback(
    (next: Set<T> | ((cur: Set<T>) => Set<T>)) => {
      const current = read()[key];
      const cur = current ? restoreSelection(current, stable) : eligibleSelection(stable);
      const value = typeof next === "function" ? next(cur) : next;
      write(
        key,
        [...clampSelection(value, stable)].map((id) => String(id)),
      );
    },
    [key, stable],
  );

  const setMode = useCallback(
    (m: SelectionMode) => {
      const target = m === "CUSTOM" ? "CUSTOM" : "ALL_ELIGIBLE";
      writeMode(key, target);
      if (target === "CUSTOM" && !read()[key]) {
        write(
          key,
          [...defaults].map((id) => String(id)),
        );
      }
    },
    [key, defaults],
  );

  const openCustomModal = useCallback(() => {
    if (!read()[key]) {
      write(
        key,
        [...defaults].map((id) => String(id)),
      );
    }
    setModalOpen(true);
  }, [key, defaults]);

  const closeCustomModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const confirmCustom = useCallback(
    (newCustom: Set<T>) => {
      write(
        key,
        [...clampSelection(newCustom, stable)].map((id) => String(id)),
      );
      writeMode(key, "CUSTOM");
      setModalOpen(false);
    },
    [key, stable],
  );

  const toggle = useCallback(
    (id: T) => {
      if (mode !== "CUSTOM") {
        const next = new Set(defaults);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        write(
          key,
          [...clampSelection(next, stable)].map((i) => String(i)),
        );
        writeMode(key, "CUSTOM");
      } else {
        setCustomSel((cur) => {
          const n = new Set(cur);
          if (n.has(id)) n.delete(id);
          else n.add(id);
          return n;
        });
      }
    },
    [mode, defaults, key, stable, setCustomSel],
  );

  const selectAll = useCallback(() => {
    if (mode === "CUSTOM") {
      setCustomSel(eligibleSelection(stable));
    } else {
      write(
        key,
        [...defaults].map((id) => String(id)),
      );
      writeMode(key, "CUSTOM");
    }
  }, [mode, setCustomSel, stable, defaults, key]);

  const clear = useCallback(() => {
    if (mode !== "CUSTOM") {
      writeMode(key, "CUSTOM");
    }
    setCustomSel(new Set());
  }, [mode, key, setCustomSel]);

  const reset = useCallback(() => {
    write(key, undefined);
    writeMode(key, "ALL_ELIGIBLE");
  }, [key]);

  return {
    sel,
    setSel: setCustomSel,
    toggle,
    selectAll,
    clear,
    reset,
    customized: rawMode === "CUSTOM" || rawCustom !== undefined,
    mode,
    setMode,
    plan,
    eligibleCount: plan.eligible,
    highRiskCount: plan.highRiskEligible,
    highRiskSelectedCount: plan.highRiskSelected,
    customModalOpen: modalOpen,
    openCustomModal,
    closeCustomModal,
    confirmCustom,
    items: stable,
  };
}

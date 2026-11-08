// Auto Optimize — simulated scheduler shared by the Dashboard panel, the Auto Optimize page and
// the title-bar chip. One module-level store, one 1-second ticker, persisted to localStorage.
// It runs only while this browser tab is open; app close, Windows startup and shutdown are
// SIMULATED events. Nothing on the real computer is read, deleted or changed.
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  DEFAULT_CONFIG,
  STARTUP_DELAY_MIN,
  nextRunAt,
  onScheduleDue,
  planRun,
  sanitizeConfig,
  summarizeOutcomes,
  taskById,
  type AutoConfig,
  type RunSummary,
  type TaskOutcome,
  type Trigger,
} from "@/lib/eo/autoOptimize";

export interface RunItem {
  taskId: string;
  name: string;
  state: "Pending" | "Running" | TaskOutcome;
  note?: string;
}
export interface ActiveRun {
  id: number;
  trigger: Trigger;
  startedAt: number;
  items: RunItem[];
}
export type HistoryEntry =
  | {
      kind: "run";
      id: number;
      at: number;
      trigger: Trigger;
      summary: RunSummary;
      items: RunItem[];
      durationMs: number;
    }
  | {
      kind: "event";
      id: number;
      at: number;
      title: string;
      detail: string;
      tone: "muted" | "warning" | "cyan";
    };

/** on = app open · background = UI closed, simulated agent keeps scheduling ·
 *  app-closed = UI closed, nothing runs · pc-off = Windows shut down, nothing runs. */
export type Power = "on" | "background" | "app-closed" | "pc-off";

export interface AutoState {
  loaded: boolean;
  config: AutoConfig;
  nextAt: number | null;
  /** Remaining time captured when paused, restored on resume. */
  pausedRemaining: number | null;
  lastRunAt: number | null;
  run: ActiveRun | null;
  queued: boolean;
  history: HistoryEntry[];
  power: Power;
  /** Simulated: browsers the prototype pretends are open (their cache is skipped). */
  openBrowsers: string[];
}

const KEY = "eo.autoOptimize.v1";
const STEP_MS = 650;
const HISTORY_MAX = 40;

const INITIAL: AutoState = {
  loaded: false,
  config: DEFAULT_CONFIG,
  nextAt: null,
  pausedRemaining: null,
  lastRunAt: null,
  run: null,
  queued: false,
  history: [],
  power: "on",
  openBrowsers: [],
};

let state: AutoState = INITIAL;
const listeners = new Set<() => void>();
let seq = 1;
let stepTimer: ReturnType<typeof setTimeout> | null = null;
let ticker: ReturnType<typeof setInterval> | null = null;

function set(patch: Partial<AutoState> | ((s: AutoState) => Partial<AutoState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  if (state.loaded) {
    try {
      const { config, nextAt, pausedRemaining, lastRunAt, history, openBrowsers } = state;
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ config, nextAt, pausedRemaining, lastRunAt, history, openBrowsers }),
      );
    } catch {
      /* storage unavailable — keep in memory */
    }
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function addHistory(e: HistoryEntry) {
  set((s) => ({ history: [e, ...s.history].slice(0, HISTORY_MAX) }));
}
function event(title: string, detail: string, tone: "muted" | "warning" | "cyan" = "muted") {
  addHistory({ kind: "event", id: seq++, at: Date.now(), title, detail, tone });
}

const scheduling = (s: AutoState) =>
  s.config.enabled && !s.config.paused && (s.power === "on" || s.power === "background");

/* ── Run engine ── */
function startRun(trigger: Trigger) {
  if (state.run) return;
  const plan = planRun(state.config, trigger, new Set(state.openBrowsers));
  if (!plan.length) {
    event("Run skipped", "No maintenance tasks are selected.", "warning");
    return;
  }
  const items: RunItem[] = plan.map((p) =>
    p.run
      ? { taskId: p.task.id, name: p.task.name, state: "Pending" }
      : { taskId: p.task.id, name: p.task.name, state: "Skipped", note: p.reason ?? "Skipped" },
  );
  set({ run: { id: seq++, trigger, startedAt: Date.now(), items } });
  step();
}

function step() {
  const run = state.run;
  if (!run) return;
  const idx = run.items.findIndex((i) => i.state === "Pending" || i.state === "Running");
  if (idx === -1) return finish();
  const cur = run.items[idx];
  if (!cur) return finish();
  if (cur.state === "Pending") {
    set({
      run: { ...run, items: run.items.map((i, j) => (j === idx ? { ...i, state: "Running" } : i)) },
    });
    stepTimer = setTimeout(step, STEP_MS);
    return;
  }
  const t = taskById(cur.taskId);
  const note =
    cur.taskId.startsWith("temp-") && state.config.skipRecentTemp
      ? `${t?.sample ?? ""} (sample) · files in use and files from the last 24 h skipped`
      : `${t?.sample ?? ""} (sample)`;
  set({
    run: {
      ...run,
      items: run.items.map((i, j) => (j === idx ? { ...i, state: "Completed", note } : i)),
    },
  });
  stepTimer = setTimeout(step, 120);
}

function finish(cancelReason?: string) {
  const run = state.run;
  if (!run) return;
  if (stepTimer) clearTimeout(stepTimer);
  stepTimer = null;
  const items: RunItem[] = run.items.map((i) =>
    i.state === "Running"
      ? { ...i, state: "Cancelled", note: cancelReason ?? "Cancelled" }
      : i.state === "Pending"
        ? { ...i, state: "Not run", note: cancelReason ?? "Cancelled before it started" }
        : i,
  );
  const summary = summarizeOutcomes(items.map((i) => i.state as TaskOutcome));
  const now = Date.now();
  const queued = state.queued && !cancelReason;
  set({ run: null, queued: false, lastRunAt: now });
  addHistory({
    kind: "run",
    id: run.id,
    at: now,
    trigger: run.trigger,
    summary,
    items,
    durationMs: now - run.startedAt,
  });
  toast(`Auto Optimize · ${summary.status} — simulated`, {
    description: `${summary.completed} completed · ${summary.skipped} skipped · no files on this PC were changed.`,
  });
  if (queued && scheduling(state)) startRun("Schedule");
}

function tick() {
  const s = state;
  if (!scheduling(s) || s.nextAt === null || Date.now() < s.nextAt) return;
  const decision = onScheduleDue(!!s.run, s.queued, s.config.overlap);
  set({ nextAt: nextRunAt(Date.now(), s.config.intervalMin) });
  if (decision === "start") startRun("Schedule");
  else if (decision === "queue") set({ queued: true });
  else
    event(
      "Scheduled run skipped",
      "The previous run was still in progress (overlap policy: skip).",
      "warning",
    );
}

/* ── Boot: load persisted state once per page load (= "application launch") ── */
function boot() {
  if (state.loaded || typeof window === "undefined") return;
  let saved: Partial<AutoState> & { config?: Partial<AutoConfig> } = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
  } catch {
    saved = {};
  }
  const config = sanitizeConfig(saved.config);
  const history = Array.isArray(saved.history) ? saved.history.slice(0, HISTORY_MAX) : [];
  seq = history.reduce((m, h) => Math.max(m, h.id), 0) + 1;
  state = {
    ...INITIAL,
    loaded: true,
    config,
    history,
    lastRunAt: typeof saved.lastRunAt === "number" ? saved.lastRunAt : null,
    pausedRemaining: typeof saved.pausedRemaining === "number" ? saved.pausedRemaining : null,
    nextAt: typeof saved.nextAt === "number" ? saved.nextAt : null,
    openBrowsers: Array.isArray(saved.openBrowsers) ? saved.openBrowsers : [],
  };
  listeners.forEach((l) => l());
  if (!ticker) ticker = setInterval(tick, 1000);
  if (config.enabled && !config.paused) {
    const missed = state.nextAt !== null && state.nextAt < Date.now();
    set({ nextAt: nextRunAt(Date.now(), config.intervalMin) });
    if (missed)
      event(
        "Scheduled run missed",
        "The prototype was closed at the scheduled time. A browser tab cannot run maintenance after it closes; the native background agent would.",
        "warning",
      );
    if (config.runOnLaunch) startRun("App launch");
  }
}

/* ── Public actions ── */
export const autoOptimize = {
  saveConfig(next: AutoConfig) {
    const prev = state.config;
    const cfg = sanitizeConfig(next);
    const resched =
      cfg.enabled &&
      !cfg.paused &&
      (!prev.enabled || prev.intervalMin !== cfg.intervalMin || prev.paused);
    set({
      config: cfg,
      nextAt:
        cfg.enabled && !cfg.paused
          ? resched
            ? nextRunAt(Date.now(), cfg.intervalMin)
            : state.nextAt
          : null,
      pausedRemaining: cfg.paused ? state.pausedRemaining : null,
    });
    event(
      "Configuration saved",
      `${cfg.tasks.length} tasks · interval ${cfg.intervalMin} min.`,
      "cyan",
    );
  },
  enable() {
    if (!state.config.tasks.length) return;
    set((s) => ({
      config: { ...s.config, enabled: true, paused: false },
      nextAt: nextRunAt(Date.now(), s.config.intervalMin),
      pausedRemaining: null,
    }));
    event(
      "Auto Optimize enabled",
      "Schedule started (simulated, runs while this tab is open).",
      "cyan",
    );
  },
  disable() {
    set((s) => ({
      config: { ...s.config, enabled: false, paused: false },
      nextAt: null,
      pausedRemaining: null,
      queued: false,
    }));
    event("Auto Optimize disabled", "No further maintenance is scheduled.");
  },
  pause() {
    set((s) => ({
      config: { ...s.config, paused: true },
      pausedRemaining: s.nextAt ? Math.max(0, s.nextAt - Date.now()) : null,
      nextAt: null,
    }));
    event("Schedule paused", "The countdown is held until you resume.");
  },
  resume() {
    set((s) => ({
      config: { ...s.config, paused: false },
      nextAt: Date.now() + (s.pausedRemaining ?? s.config.intervalMin * 60_000),
      pausedRemaining: null,
    }));
    event("Schedule resumed", "The countdown continues from where it was paused.");
  },
  runNow() {
    startRun("Manual");
  },
  cancel() {
    finish("Cancelled by you");
  },
  clearHistory() {
    set({ history: [] });
  },
  setOpenBrowsers(list: string[]) {
    set({ openBrowsers: list });
  },
  /* Lifecycle simulation — these do not close the tab or touch Windows. */
  simulateLaunch() {
    set({ power: "on" });
    const c = state.config;
    if (c.enabled && !c.paused) {
      set({ nextAt: nextRunAt(Date.now(), c.intervalMin) });
      if (c.runOnLaunch) startRun("App launch");
    }
    event(
      "Application launched (simulated)",
      c.enabled
        ? c.runOnLaunch
          ? "Schedule restored; launch maintenance started."
          : "Schedule restored."
        : "Auto Optimize is disabled.",
      "cyan",
    );
  },
  simulateClose() {
    const c = state.config;
    if (c.closeBehavior === "background" && c.enabled) {
      set({ power: "background" });
      event(
        "Application closed (simulated)",
        "Background agent keeps the schedule running.",
        "cyan",
      );
      return;
    }
    if (c.closeBehavior === "exit-run" && c.enabled && !state.run) startRun("App exit");
    set({ power: "app-closed" });
    event(
      "Application closed (simulated)",
      c.closeBehavior === "exit-run" && c.enabled
        ? "Exit maintenance runs once, then scheduling stops until the next launch."
        : "Scheduling stops until the next launch.",
    );
  },
  simulateWindowsStartup() {
    const c = state.config;
    set({ power: c.runOnWindowsStartup ? "background" : "pc-off" });
    if (!c.runOnWindowsStartup) {
      event(
        "Windows started (simulated)",
        "Windows Startup integration is off — Auto Optimize waits until you open the app.",
      );
      return;
    }
    if (c.enabled && !c.paused)
      set({
        nextAt:
          c.startupPolicy === "after-delay"
            ? Date.now() + STARTUP_DELAY_MIN * 60_000
            : nextRunAt(Date.now(), c.intervalMin),
      });
    event(
      "Windows started (simulated)",
      c.startupPolicy === "after-delay"
        ? `Background agent started; first maintenance ${STARTUP_DELAY_MIN} minutes after sign-in.`
        : "Background agent started; first maintenance at the next interval.",
      "cyan",
    );
  },
  simulateShutdown() {
    if (state.run) finish("Stopped for Windows shutdown — shutdown is never delayed");
    set({ power: "pc-off", queued: false });
    event(
      "Windows shut down (simulated)",
      "Nothing runs while the PC is off. The schedule resumes after the next Windows startup.",
    );
  },
};

/** Mount once (in the Shell) so the scheduler starts on page load, whichever page opens first. */
export function useAutoOptimizeBoot() {
  useEffect(() => {
    boot();
    return undefined;
  }, []);
}

export function useAutoOptimize(): AutoState {
  useEffect(() => boot(), []);
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}

/* ── 1-second clock for countdowns (only subscribed components re-render) ── */
const clockListeners = new Set<() => void>();
let clock: ReturnType<typeof setInterval> | null = null;
let nowSec = typeof window === "undefined" ? 0 : Math.floor(Date.now() / 1000);
function subscribeClock(l: () => void) {
  clockListeners.add(l);
  if (!clock) {
    const fresh = Math.floor(Date.now() / 1000);
    if (fresh !== nowSec) {
      nowSec = fresh;
      queueMicrotask(l);
    }
    clock = setInterval(() => {
      nowSec = Math.floor(Date.now() / 1000);
      clockListeners.forEach((f) => f());
    }, 1000);
  }
  return () => {
    clockListeners.delete(l);
    if (!clockListeners.size && clock) {
      clearInterval(clock);
      clock = null;
    }
  };
}
/** Current time in ms, refreshed every second; 0 during server render. */
export function useNow() {
  const s = useSyncExternalStore(
    subscribeClock,
    () => nowSec,
    () => 0,
  );
  return s * 1000;
}

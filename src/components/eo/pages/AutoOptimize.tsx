// AutoOptimizeView — compact settings workspace for the recurring maintenance engine.
// Primary view: master switch, task selection, interval, startup preferences, save.
// Secondary options live under Advanced settings. Prototype only — every run is simulated.
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Cpu,
  Files,
  Globe,
  MemoryStick,
  Pause,
  Play,
  Power,
  PowerOff,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Zap,
} from "lucide-react";
import {
  BackLink,
  Badge,
  Btn,
  Card,
  Check,
  Details,
  EmptyState,
  Modal,
  PageHeader,
  SectionTitle,
  SimNotice,
  Toggle,
} from "../kit";
import { Segmented } from "../controls";
import { autoOptimize, useAutoOptimize, useNow, type HistoryEntry } from "../autoOptimizeStore";
import { StatusPill, clockTime, engineStatus, relTime } from "../AutoOptimizePanel";
import {
  MAINT_CATEGORIES,
  MAINT_TASKS,
  PRESET_INTERVALS,
  STARTUP_DELAY_MIN,
  formatCountdown,
  formatInterval,
  validateCustomInterval,
  type AutoConfig,
  type IntervalUnit,
  type MaintCategory,
} from "@/lib/eo/autoOptimize";
import { cn } from "@/lib/utils";

const CAT_ICON: Record<MaintCategory, ComponentType<{ className?: string }>> = {
  TEMP: Files,
  MEMORY: MemoryStick,
  BROWSER: Globe,
  RECYCLE: Trash2,
  SYSTEM: Cpu,
};
const PRESET_LABELS = PRESET_INTERVALS.map((m) => `${m} min`);
const BROWSERS = ["Chrome", "Edge", "Firefox"];

/** Fields saved through Save & apply (enable / pause are immediate controls). */
const comparable = ({ enabled: _e, paused: _p, ...rest }: AutoConfig) => JSON.stringify(rest);

/** Unsaved edits survive leaving the page (sidebar, Back) until saved or discarded. */
let pendingDraft: AutoConfig | null = null;

export function AutoOptimizePage() {
  const s = useAutoOptimize();
  const now = useNow();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<AutoConfig>(() => pendingDraft ?? s.config);
  const dirty = comparable(draft) !== comparable(s.config);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  // Adopt the stored configuration when it loads or changes elsewhere, unless you are editing.
  const loadedRef = useRef(s.loaded);
  useEffect(() => {
    const justLoaded = s.loaded && !loadedRef.current;
    loadedRef.current = s.loaded;
    // Stored settings arriving after the first render always replace the defaults.
    if ((justLoaded && !pendingDraft) || !dirtyRef.current) setDraft(s.config);
  }, [s.config, s.loaded]);
  useEffect(
    () => () => {
      // Only a dirty instance records its draft; clean instances never clear it (save and
      // discard do), so a second mounted copy cannot drop your edits.
      if (dirtyRef.current) pendingDraft = draftRef.current;
    },
    [],
  );
  const [leaving, setLeaving] = useState(false);

  const presetIdx = PRESET_INTERVALS.indexOf(
    draft.intervalMin as (typeof PRESET_INTERVALS)[number],
  );
  const [custom, setCustom] = useState(presetIdx === -1);
  const [unit, setUnit] = useState<IntervalUnit>(
    presetIdx === -1 && draft.intervalMin % 60 === 0 ? "hours" : "minutes",
  );
  const [customText, setCustomText] = useState(
    String(
      presetIdx === -1 && draft.intervalMin % 60 === 0 ? draft.intervalMin / 60 : draft.intervalMin,
    ),
  );
  useEffect(() => {
    if (pendingDraft) return;
    const m = s.config.intervalMin;
    if (PRESET_INTERVALS.indexOf(m as (typeof PRESET_INTERVALS)[number]) === -1) {
      setCustom(true);
      if (m % 60 === 0) {
        setUnit("hours");
        setCustomText(String(m / 60));
      } else setCustomText(String(m));
    }
  }, [s.loaded, s.config.intervalMin]);
  const check = custom ? validateCustomInterval(customText, unit) : null;
  const intervalError = check && !check.ok ? check.error : null;

  const patch = (p: Partial<AutoConfig>) => setDraft((d) => ({ ...d, ...p }));
  const toggleTask = (id: string) =>
    patch({
      tasks: draft.tasks.includes(id) ? draft.tasks.filter((t) => t !== id) : [...draft.tasks, id],
    });
  const status = engineStatus(s);
  const save = () => {
    if (intervalError) return false;
    autoOptimize.saveConfig({ ...draft, enabled: s.config.enabled, paused: s.config.paused });
    pendingDraft = null;
    return true;
  };
  const discard = () => {
    pendingDraft = null;
    setDraft(s.config);
  };
  const goBack = () => {
    if (dirty) setLeaving(true);
    else navigate({ to: "/" });
  };

  const nextRun = s.run
    ? "Running…"
    : status === "Paused" && s.pausedRemaining !== null
      ? `Paused · ${formatCountdown(s.pausedRemaining)} left`
      : status === "Enabled" && s.nextAt && now
        ? `${clockTime(s.nextAt)} · in ${formatCountdown(s.nextAt - now)}`
        : "Not scheduled";

  return (
    <div className="space-y-4">
      <PageHeader
        back={<BackLink onClick={goBack} />}
        title="Auto Optimize"
        badges={<Badge tone="warning">SIMULATED</Badge>}
        sub="Recurring maintenance for the tasks you choose."
      />

      {/* Master switch · interval · next run · last run · run controls */}
      <Card className="eo-hero py-3">
        <div className="eo-ao-master">
          <Toggle
            on={s.config.enabled}
            label="Auto Optimize"
            onChange={(on) => {
              if (on) {
                if (!draft.tasks.length || intervalError) return;
                autoOptimize.saveConfig({ ...draft, enabled: true, paused: false });
                pendingDraft = null;
              } else autoOptimize.disable();
            }}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-black uppercase">Auto Optimize</span>
              <StatusPill status={status} />
              {s.power !== "on" && (
                <Badge tone="warning">
                  {s.power === "background"
                    ? "BACKGROUND · SIMULATED"
                    : s.power === "app-closed"
                      ? "APP CLOSED · SIMULATED"
                      : "PC OFF · SIMULATED"}
                </Badge>
              )}
            </div>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {!draft.tasks.length
                ? "Select at least one task to turn it on."
                : s.config.enabled
                  ? `${s.config.tasks.length} tasks selected`
                  : "Off — nothing runs automatically."}
            </p>
          </div>
          <dl className="eo-ao-facts">
            <div>
              <dt>Interval</dt>
              <dd>{formatInterval(s.config.intervalMin).replace("Every ", "")}</dd>
            </div>
            <div>
              <dt>Next run</dt>
              <dd>{nextRun}</dd>
            </div>
            <div>
              <dt>Last run</dt>
              <dd>{relTime(s.lastRunAt, now)}</dd>
            </div>
          </dl>
          <div className="flex items-center gap-2">
            {s.run ? (
              <Btn variant="danger" onClick={autoOptimize.cancel}>
                <Square aria-hidden="true" className="h-3 w-3" /> Cancel
              </Btn>
            ) : (
              <Btn
                variant="secondary"
                disabled={!s.config.tasks.length}
                onClick={autoOptimize.runNow}
              >
                <Zap aria-hidden="true" className="h-3.5 w-3.5" /> Run now
              </Btn>
            )}
            {s.config.enabled &&
              (s.config.paused ? (
                <Btn variant="ghost" onClick={autoOptimize.resume}>
                  <Play aria-hidden="true" className="h-3.5 w-3.5" /> Resume
                </Btn>
              ) : (
                <Btn variant="ghost" onClick={autoOptimize.pause}>
                  <Pause aria-hidden="true" className="h-3.5 w-3.5" /> Pause
                </Btn>
              ))}
          </div>
        </div>
        {s.run && <RunStrip />}
      </Card>

      <div className="eo-ao-layout">
        {/* Maintenance tasks */}
        <Card>
          <SectionTitle
            title="MAINTENANCE TASKS"
            guide="auto.tasks"
            badge={
              <Badge tone="cyan">
                {draft.tasks.length}/{MAINT_TASKS.length}
              </Badge>
            }
            right={
              <>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    patch({ tasks: MAINT_TASKS.filter((t) => t.recommended).map((t) => t.id) })
                  }
                >
                  Recommended
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  disabled={!draft.tasks.length}
                  onClick={() => patch({ tasks: [] })}
                >
                  Clear
                </Btn>
              </>
            }
          />
          {MAINT_CATEGORIES.map((cat) => {
            const items = MAINT_TASKS.filter((t) => t.category === cat.key);
            const on = items.filter((t) => draft.tasks.includes(t.id)).length;
            const Icon = CAT_ICON[cat.key];
            return (
              <section key={cat.key} aria-labelledby={`eo-cat-${cat.key}`} className="eo-ao-group">
                <div className="eo-ao-group-head">
                  <span aria-hidden="true" className="eo-ao-icon">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <h3
                    id={`eo-cat-${cat.key}`}
                    className="min-w-0 flex-1 truncate text-[12px] font-bold"
                  >
                    {cat.title}
                    {cat.key === "BROWSER" && (
                      <span className="ml-2 text-[10px] font-semibold text-success">
                        Cache only · logins and history kept
                      </span>
                    )}
                  </h3>
                  <span className="text-[10.5px] font-bold text-subtle tabular-nums">
                    {on}/{items.length}
                  </span>
                  {items.length > 1 && (
                    <Check
                      label={`Select all ${cat.title}`}
                      on={on === items.length}
                      onChange={(v) =>
                        patch({
                          tasks: v
                            ? [...new Set([...draft.tasks, ...items.map((t) => t.id)])]
                            : draft.tasks.filter((id) => !items.some((t) => t.id === id)),
                        })
                      }
                    />
                  )}
                </div>
                <ul>
                  {items.map((t) => (
                    <TaskRow
                      key={t.id}
                      id={t.id}
                      on={draft.tasks.includes(t.id)}
                      onToggle={() => toggleTask(t.id)}
                      browserOpen={!!t.browser && s.openBrowsers.includes(t.browser)}
                      recycleAsk={t.id === "recycle-bin" && draft.recycleConfirm}
                      lowSkipped={t.risk === "LOW" && draft.safeOnly}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </Card>

        {/* Schedule · startup · advanced · save */}
        <div className="eo-ao-side">
          <Card>
            <SectionTitle title="SCHEDULE" guide="auto.schedule" />
            <Segmented
              label="Schedule interval"
              fill
              options={[...PRESET_LABELS, "Custom"]}
              value={custom ? "Custom" : (PRESET_LABELS[presetIdx] ?? "Custom")}
              onChange={(v) => {
                if (v === "Custom") {
                  setCustom(true);
                  const r = validateCustomInterval(customText, unit);
                  if (r.ok) patch({ intervalMin: r.minutes });
                  return;
                }
                setCustom(false);
                const m = PRESET_INTERVALS[PRESET_LABELS.indexOf(v)];
                if (m) patch({ intervalMin: m });
              }}
            />
            {custom && (
              <div className="eo-swap mt-2.5">
                <div className="flex items-center gap-2">
                  <label htmlFor="eo-custom-interval" className="text-[11.5px] font-semibold">
                    Every
                  </label>
                  <input
                    id="eo-custom-interval"
                    inputMode="numeric"
                    value={customText}
                    aria-invalid={!!intervalError}
                    aria-describedby="eo-custom-interval-hint"
                    onChange={(e) => {
                      setCustomText(e.target.value);
                      const r = validateCustomInterval(e.target.value, unit);
                      if (r.ok) patch({ intervalMin: r.minutes });
                    }}
                    className={cn(
                      "eo-input h-8 w-20 font-mono",
                      intervalError && "eo-input-invalid",
                    )}
                  />
                  <Segmented
                    label="Interval unit"
                    options={["minutes", "hours"]}
                    value={unit}
                    onChange={(v) => {
                      const u = v as IntervalUnit;
                      setUnit(u);
                      const r = validateCustomInterval(customText, u);
                      if (r.ok) patch({ intervalMin: r.minutes });
                    }}
                  />
                </div>
                <p
                  id="eo-custom-interval-hint"
                  role={intervalError ? "alert" : undefined}
                  className={cn(
                    "mt-1 text-[11px]",
                    intervalError ? "text-destructive" : "text-subtle",
                  )}
                >
                  {intervalError ?? "1 minute to 24 hours, whole minutes."}
                </p>
              </div>
            )}

            <div className="mt-4">
              <span className="eo-ao-sub">Application & Windows</span>
              <ToggleRow
                title="Run on application launch"
                sub="Runs selected tasks once when the app opens."
                on={draft.runOnLaunch}
                onChange={(v) => patch({ runOnLaunch: v })}
              />
              <ToggleRow
                title="Continue in background after closing"
                sub="Native app only: a background agent keeps the schedule."
                on={draft.closeBehavior === "background"}
                onChange={(v) => patch({ closeBehavior: v ? "background" : "stop" })}
              />
              <ToggleRow
                title="Start with Windows"
                sub="Native app only: starts after you sign in."
                on={draft.runOnWindowsStartup}
                onChange={(v) => patch({ runOnWindowsStartup: v })}
              />
            </div>

            <div className="mt-2">
              <Details
                inline
                title="ADVANCED SETTINGS"
                hint={`${draft.overlap === "skip" ? "Skip" : "Queue"} overlap · ${draft.profile} · ${draft.safeOnly ? "safe only" : "all risks"}`}
              >
                <AdvancedSettings
                  draft={draft}
                  patch={patch}
                  openBrowsers={s.openBrowsers}
                  power={s.power}
                />
              </Details>
            </div>

            <div className="eo-ao-foot" data-dirty={dirty || undefined}>
              <span className="min-w-0 truncate text-[11.5px] font-semibold" aria-live="polite">
                {intervalError ? (
                  <span className="text-destructive">{intervalError}</span>
                ) : dirty ? (
                  <span className="text-cyan">Unsaved changes</span>
                ) : (
                  <span className="text-subtle">All changes saved</span>
                )}
              </span>
              <div className="flex shrink-0 gap-2">
                {dirty && (
                  <Btn size="sm" variant="ghost" onClick={discard}>
                    <RotateCcw aria-hidden="true" className="h-3 w-3" /> Discard
                  </Btn>
                )}
                <Btn
                  size="sm"
                  variant="primary"
                  disabled={!dirty || !!intervalError}
                  onClick={save}
                >
                  <Save aria-hidden="true" className="h-3 w-3" /> Save & apply
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <History entries={s.history} now={now} />
      <SimNotice>
        PROTOTYPE: the schedule runs only while this tab is open. Nothing on this PC is read or
        changed; background and Windows startup behaviour is simulated.
      </SimNotice>

      <Modal
        open={leaving}
        onClose={() => setLeaving(false)}
        title="Unsaved changes"
        sub="Save your Auto Optimize settings before returning to the Dashboard?"
        width="max-w-md"
        icon={<Save className="h-4 w-4" />}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setLeaving(false)}>
              Keep editing
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => {
                discard();
                setLeaving(false);
                navigate({ to: "/" });
              }}
            >
              Discard
            </Btn>
            <Btn
              variant="primary"
              disabled={!!intervalError}
              onClick={() => {
                if (save()) {
                  setLeaving(false);
                  navigate({ to: "/" });
                }
              }}
            >
              Save & return
            </Btn>
          </>
        }
      >
        <p className="text-[12.5px] text-muted-foreground">
          Your saved schedule keeps running either way. Discarding only drops the edits you made on
          this page.
        </p>
      </Modal>
    </div>
  );
}

function RunStrip() {
  const s = useAutoOptimize();
  const run = s.run;
  if (!run) return null;
  const done = run.items.filter((i) => i.state !== "Pending" && i.state !== "Running").length;
  const current = run.items.find((i) => i.state === "Running");
  return (
    <div className="eo-swap mt-3 border-t border-border pt-3" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold">
        <span className="text-cyan">
          {run.trigger.toUpperCase()} RUN · SIMULATED · {done}/{run.items.length}
        </span>
        <span className="min-w-0 truncate text-muted-foreground">
          {current ? `Working on ${current.name}…` : "Finishing…"}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-1">
        {run.items.map((i) => (
          <li key={i.taskId} className="eo-run-row" data-state={i.state}>
            <span aria-hidden="true" className="eo-run-dot" />
            <span className="min-w-0 flex-1 truncate">{i.name}</span>
            <span className="eo-run-state">{i.state === "Running" ? "Working…" : i.state}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToggleRow({
  title,
  sub,
  on,
  onChange,
}: {
  title: string;
  sub: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="eo-ao-toggle">
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold">{title}</div>
        <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <Toggle on={on} label={title} onChange={onChange} />
    </div>
  );
}

function AdvancedSettings({
  draft,
  patch,
  openBrowsers,
  power,
}: {
  draft: AutoConfig;
  patch: (p: Partial<AutoConfig>) => void;
  openBrowsers: string[];
  power: string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div>
          <span className="eo-ao-sub mb-1.5">If a run is in progress</span>
          <Segmented
            label="Overlap policy"
            fill
            options={["Skip next run", "Queue one run"]}
            value={draft.overlap === "skip" ? "Skip next run" : "Queue one run"}
            onChange={(v) => patch({ overlap: v === "Skip next run" ? "skip" : "queue" })}
          />
        </div>
        <div>
          <span className="eo-ao-sub mb-1.5">Profile</span>
          <Segmented
            label="Automation profile"
            fill
            options={["Light", "Balanced", "Thorough"]}
            value={draft.profile}
            onChange={(v) => patch({ profile: v as AutoConfig["profile"] })}
          />
        </div>
      </div>
      <div>
        {draft.closeBehavior !== "background" && (
          <ToggleRow
            title="Run once when the app closes"
            sub="Then stop until the app opens again."
            on={draft.closeBehavior === "exit-run"}
            onChange={(v) => patch({ closeBehavior: v ? "exit-run" : "stop" })}
          />
        )}
        {draft.runOnWindowsStartup && (
          <ToggleRow
            title={`Run ${STARTUP_DELAY_MIN} min after Windows starts`}
            sub="Off: wait for the next interval instead."
            on={draft.startupPolicy === "after-delay"}
            onChange={(v) => patch({ startupPolicy: v ? "after-delay" : "next-interval" })}
          />
        )}
        <ToggleRow
          title="Unattended runs: safe tasks only"
          sub="Low-risk tasks run only on Run now."
          on={draft.safeOnly}
          onChange={(v) => patch({ safeOnly: v })}
        />
        <ToggleRow
          title="Keep recent temporary files"
          sub="Skip temp files changed in the last 24 hours."
          on={draft.skipRecentTemp}
          onChange={(v) => patch({ skipRecentTemp: v })}
        />
        <ToggleRow
          title="Ask before emptying the Recycle Bin"
          sub="Scheduled runs then skip it — nobody is there to ask."
          on={draft.recycleConfirm}
          onChange={(v) => patch({ recycleConfirm: v })}
        />
      </div>
      <p className="text-[11px] text-subtle">
        Running browsers are always skipped and never closed. Shutdown is never delayed; nothing
        runs while the PC is off.
      </p>
      <div>
        <span className="eo-ao-sub mb-1.5">Preview · simulate open browsers</span>
        <div role="group" aria-label="Simulate open browsers" className="flex gap-1.5">
          {BROWSERS.map((b) => {
            const open = openBrowsers.includes(b);
            return (
              <Btn
                key={b}
                size="sm"
                variant={open ? "secondary" : "ghost"}
                pressed={open}
                onClick={() =>
                  autoOptimize.setOpenBrowsers(
                    open ? openBrowsers.filter((x) => x !== b) : [...openBrowsers, b],
                  )
                }
              >
                {b} {open ? "open" : "closed"}
              </Btn>
            );
          })}
        </div>
      </div>
      <div>
        <span className="eo-ao-sub mb-1.5">
          Preview · simulate lifecycle ·{" "}
          <span className="text-foreground">
            {power === "on"
              ? "app open"
              : power === "background"
                ? "background agent"
                : power === "app-closed"
                  ? "app closed"
                  : "PC off"}
          </span>
        </span>
        <div className="eo-ao-sim">
          <button type="button" onClick={autoOptimize.simulateLaunch}>
            <Power aria-hidden="true" className="h-3.5 w-3.5 text-cyan" /> App launch
          </button>
          <button type="button" onClick={autoOptimize.simulateClose}>
            <PowerOff aria-hidden="true" className="h-3.5 w-3.5 text-cyan" /> App close
          </button>
          <button type="button" onClick={autoOptimize.simulateWindowsStartup}>
            <Play aria-hidden="true" className="h-3.5 w-3.5 text-cyan" /> Windows startup
          </button>
          <button type="button" onClick={autoOptimize.simulateShutdown}>
            <Square aria-hidden="true" className="h-3.5 w-3.5 text-cyan" /> Shutdown / restart
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  id,
  on,
  onToggle,
  browserOpen,
  recycleAsk,
  lowSkipped,
}: {
  id: string;
  on: boolean;
  onToggle: () => void;
  browserOpen: boolean;
  recycleAsk: boolean;
  lowSkipped: boolean;
}) {
  const t = MAINT_TASKS.find((x) => x.id === id);
  const [open, setOpen] = useState(false);
  if (!t) return null;
  const note = browserOpen
    ? `${t.browser} is open — skipped`
    : recycleAsk
      ? "Skipped on scheduled runs"
      : lowSkipped
        ? "Run now only"
        : null;
  return (
    <li className="eo-ao-row" data-selected={on || undefined}>
      <div className="eo-ao-row-main">
        <Check label={t.name} on={on} onChange={onToggle} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 text-[12px] font-semibold">{t.name}</span>
            <span className="truncate text-[11px] text-muted-foreground">{t.desc}</span>
          </div>
        </div>
        {on && note && (
          <span className="shrink-0 text-[10.5px] font-semibold text-warning">{note}</span>
        )}
        {t.risk === "LOW" && <Badge tone="warning">LOW RISK</Badge>}
        {t.risk === "CONFIRM" && <Badge tone="danger">PERMANENT</Badge>}
        <Btn
          size="sm"
          variant="ghost"
          className="h-6 w-6 border-transparent px-0"
          label={`${open ? "Hide" : "Show"} details for ${t.name}`}
          expanded={open}
          controls={`eo-task-${t.id}`}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown
            aria-hidden="true"
            className={cn("eo-chevron h-3.5 w-3.5", open && "rotate-180")}
          />
        </Btn>
      </div>
      {open && (
        <div id={`eo-task-${t.id}`} className="eo-swap eo-ao-row-details">
          <p>{t.details}</p>
          <p className="text-subtle">Source in this project: {t.source}</p>
        </div>
      )}
    </li>
  );
}

function History({ entries, now }: { entries: HistoryEntry[]; now: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const shown = useMemo(
    () =>
      entries.filter((e) =>
        filter === "All" ? true : filter === "Runs" ? e.kind === "run" : e.kind === "event",
      ),
    [entries, filter],
  );
  return (
    <section id="history" aria-labelledby="eo-history-title" className="scroll-mt-4">
      <Card>
        <SectionTitle
          id="eo-history-title"
          title="HISTORY"
          badge={<Badge>{entries.filter((e) => e.kind === "run").length} RUNS</Badge>}
          right={
            <>
              <Segmented
                label="History filter"
                options={["All", "Runs", "Events"]}
                value={filter}
                onChange={setFilter}
              />
              <Btn
                size="sm"
                variant="ghost"
                disabled={!entries.length}
                onClick={autoOptimize.clearHistory}
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Clear
              </Btn>
            </>
          }
        />
        {!shown.length ? (
          <EmptyState title="No history yet" sub="Runs and lifecycle events appear here." />
        ) : (
          <div className="eo-data-table rounded-lg border border-border">
            <div className="eo-history-row eo-history-head">
              <span>TIME</span>
              <span>TRIGGER / EVENT</span>
              <span>RESULT · SAMPLE DATA</span>
              <span>STATUS</span>
              <span />
            </div>
            <ul>
              {shown.slice(0, 20).map((e) =>
                e.kind === "event" ? (
                  <li key={e.id} className="eo-history-row">
                    <span className="font-mono text-[11px] text-subtle">{clockTime(e.at)}</span>
                    <span className="truncate font-semibold">{e.title}</span>
                    <span className="truncate text-muted-foreground">{e.detail}</span>
                    <Badge tone={e.tone}>EVENT</Badge>
                    <span />
                  </li>
                ) : (
                  <li key={e.id}>
                    <div className="eo-history-row">
                      <span
                        className="font-mono text-[11px] text-subtle"
                        title={relTime(e.at, now)}
                      >
                        {clockTime(e.at)}
                      </span>
                      <span className="truncate font-semibold">{e.trigger} run</span>
                      <span className="truncate text-muted-foreground">
                        {e.summary.completed} completed · {e.summary.skipped} skipped
                        {e.summary.cancelled ? ` · ${e.summary.cancelled} cancelled` : ""} ·{" "}
                        {(e.durationMs / 1000).toFixed(1)} s · 0 changes on this PC
                      </span>
                      <Badge
                        tone={
                          e.summary.status === "Completed"
                            ? "success"
                            : e.summary.status === "Cancelled"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {e.summary.status}
                      </Badge>
                      <Btn
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 border-transparent px-0"
                        label={`${open === e.id ? "Hide" : "Show"} tasks for run at ${clockTime(e.at)}`}
                        expanded={open === e.id}
                        onClick={() => setOpen(open === e.id ? null : e.id)}
                      >
                        <ChevronDown
                          aria-hidden="true"
                          className={cn("eo-chevron h-3.5 w-3.5", open === e.id && "rotate-180")}
                        />
                      </Btn>
                    </div>
                    {open === e.id && (
                      <ul className="eo-swap eo-history-items">
                        {e.items.map((i) => (
                          <li key={i.taskId} className="eo-run-row" data-state={i.state}>
                            <span aria-hidden="true" className="eo-run-dot" />
                            <span className="w-56 shrink-0 truncate font-semibold">{i.name}</span>
                            <span className="min-w-0 flex-1 truncate text-muted-foreground">
                              {i.note ?? ""}
                            </span>
                            <span className="eo-run-state">{i.state}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
}

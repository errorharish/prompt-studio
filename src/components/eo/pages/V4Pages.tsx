// V4 (five destinations): V4 Dashboard, Maximum Performance (MaxPerformanceView + V4OptimizationView),
// Emulator Optimization, Emulator Debloater (EmulatorDebloaterView + Deep Debloater module) and
// Emulator Advanced Optimization (Advanced engine + Low-End Extreme + LowEndSteamPage).
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Gauge,
  Lock,
  MemoryStick,
  MonitorCog,
  RotateCcw,
  Target,
  Zap,
} from "lucide-react";
import {
  BackLink,
  Badge,
  Bar,
  Btn,
  Card,
  CheckRow,
  Cols,
  EmptyState,
  SelectionBar,
  Label,
  Modal,
  PageHeader,
  RiskBadge,
  SectionTitle,
  SimNotice,
  StatTiles,
  Toggle,
  Details,
  KV,
  simulate,
  useSimRun,
} from "../kit";
import { GuideTip } from "../Guide";
import type { GuideId } from "@/lib/eo/guides";
import { cn } from "@/lib/utils";
import { HW } from "@/lib/eo/data";
import { AnimatedNumber, CountUp, ScoreRing, Segmented } from "../controls";
import { useModedSelection, usePersistedSelection } from "../useSelection";
import { PremiumSelect } from "../dropdown";
import { EMU_PROFILES, getEmu, logV4, setEmu, useEmu, type EmuProfile } from "../v4Store";

/* ───────── V4 MAXIMUM PERFORMANCE (cols=*,16,320) ─────────
 * One workspace: selectable scope → action, with a single engine rail.
 * Scope selection is persisted (first use: every eligible area selected). No live log. */
const MP_SCOPE = [
  {
    id: "background",
    icon: Layers,
    t: "Background reduction",
    d: "Reduce unnecessary background CPU overhead.",
    risk: "SAFE" as const,
  },
  {
    id: "priority",
    icon: Activity,
    t: "Priority balancing",
    d: "Balance foreground and background priority.",
    risk: "LOW" as const,
  },
  {
    id: "working-set",
    icon: MemoryStick,
    t: "Working-set refresh",
    d: "Release idle process working sets.",
    risk: "SAFE" as const,
  },
  {
    id: "system",
    icon: Gauge,
    t: "System optimizations",
    d: "Hardware-aware latency reduction for the host.",
    risk: "LOW" as const,
  },
  {
    id: "core",
    icon: Target,
    t: "Core footprint convergence",
    d: "Repeated safe passes until the background footprint stops shrinking.",
    risk: "LOW" as const,
  },
];
const MP_SAFEGUARDS = [
  "Core Windows safeguarded",
  "Drivers, games & editing apps shielded",
  "Reversible via rollback",
];

export function V4MaxPerformancePage() {
  const [procs, setProcs] = useState(142);
  const [last, setLast] = useState<{ at: string; before: number; after: number; n: number } | null>(
    null,
  );
  const r = useSimRun(3000);
  const [confirmRun, setConfirmRun] = useState(false);
  const scope = useModedSelection("v4-max-performance", MP_SCOPE);
  const [runIds, setRunIds] = useState<string[]>([]);
  const picked = MP_SCOPE.filter((s) => scope.sel.has(s.id));
  const pct = r.progress ?? 0;
  const coreDone = !!last && runIds.includes("core");
  const stage = r.running
    ? Math.min(runIds.length - 1, Math.floor((pct / 100) * runIds.length))
    : -1;
  const run = () => {
    const ids = picked.map((s) => s.id);
    setRunIds(ids);
    r.start(() => {
      const after = 142 - ids.length * 6;
      setProcs(after);
      setLast({ at: new Date().toLocaleTimeString(), before: 142, after, n: ids.length });
      logV4(
        "Maximum Performance",
        `${ids.length} areas · ${142} → ${after} sample processes · 0 real changes`,
      );
    });
  };
  const stateOf = (id: string): "active" | "done" | undefined => {
    const k = runIds.indexOf(id);
    if (k < 0) return undefined;
    if (r.running) return k < stage ? "done" : k === stage ? "active" : undefined;
    return last ? "done" : undefined;
  };
  return (
    <div className="space-y-4">
      <PageHeader
        title="Maximum Performance"
        badges={<Badge tone="cyan">V4 HOST ENGINE</Badge>}
        sub="Host latency reduction and core background convergence in one workflow — simulated."
        actions={
          <>
            <Btn
              variant="ghost"
              disabled={!last || r.running}
              onClick={() => {
                setProcs(142);
                setLast(null);
                setRunIds([]);
                simulate("Rollback");
                logV4("Maximum Performance", "Rollback to pre-optimization state", "RESTORED");
              }}
              title="Restore the pre-optimization state (simulated)"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Rollback
            </Btn>
          </>
        }
      />

      <StatTiles
        items={[
          { label: "BACKGROUND PROCESSES", value: procs, sub: "Sample" },
          { label: "CPU USAGE", value: "12%", sub: "Sample" },
          { label: "GPU USAGE", value: "9%", sub: "Sample" },
          { label: "RAM USAGE", value: "36%", sub: "Sample" },
        ]}
      />

      <div
        className="eo-engine-layout grid items-start gap-3.5"
        style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}
      >
        <div className="space-y-3">
          <Card className="eo-hero eo-v4-hero">
            <div className="eo-v4-head">
              <div className="min-w-0">
                <Label className="text-cyan">OPTIMIZATION SCOPE</Label>
                <h2 className="mt-0.5 flex items-center gap-1.5 text-[15px] font-bold">
                  Host latency workflow
                  <GuideTip id="v4.scope" />
                </h2>
              </div>
              <SelectionBar
                count={scope.sel.size}
                total={scope.eligibleCount}
                onAll={scope.selectAll}
                onClear={scope.clear}
                moded={scope}
                title="Maximum Performance"
              />
            </div>

            <div role="group" aria-label="Workflow scope" className="eo-v4-scope-grid">
              {MP_SCOPE.map((s) => {
                const st = stateOf(s.id);
                return (
                  <CheckRow
                    key={s.id}
                    on={scope.sel.has(s.id)}
                    onChange={() => !r.running && scope.toggle(s.id)}
                    state={st}
                    icon={
                      st === "done" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <s.icon className="h-4 w-4" />
                      )
                    }
                    title={s.t}
                    desc={s.d}
                    right={
                      st === "active" ? (
                        <span className="text-[9.5px] font-bold text-cyan">RUNNING</span>
                      ) : st === "done" ? (
                        <span className="text-[9.5px] font-bold text-success">SIMULATED</span>
                      ) : (
                        <RiskBadge risk={s.risk} />
                      )
                    }
                  />
                );
              })}
            </div>

            <ul aria-label="Protection" className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {MP_SAFEGUARDS.map((x) => (
                <li
                  key={x}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-success"
                >
                  <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  {x}
                </li>
              ))}
            </ul>

            <div className="eo-v4-action">
              <div className="min-w-0 flex-1" aria-live="polite">
                {r.running ? (
                  <>
                    <div className="mb-1 flex justify-between text-[10.5px] font-bold text-cyan">
                      <span>
                        {MP_SCOPE.find((s) => s.id === runIds[stage])?.t.toUpperCase()} · SIMULATED
                      </span>
                      <span className="font-mono">{pct.toFixed(0)}%</span>
                    </div>
                    <Bar value={pct} active />
                  </>
                ) : (
                  <p className="text-[11.5px] text-muted-foreground">
                    {last
                      ? `Last simulated run at ${last.at} · ${last.n} areas · 0 changes on this PC.`
                      : picked.length
                        ? `${picked.length} of ${MP_SCOPE.length} areas will run. Review before confirming.`
                        : "Select at least one area to optimize."}
                  </p>
                )}
              </div>
              <Btn
                variant="primary"
                size="lg"
                className="eo-v4-cta"
                disabled={r.running || !picked.length}
                onClick={() => setConfirmRun(true)}
              >
                <Zap aria-hidden="true" className="h-4 w-4" />
                {r.running
                  ? `Optimizing… ${pct.toFixed(0)}%`
                  : `Optimize selected (${picked.length})`}
              </Btn>
            </div>
          </Card>

          {last && (
            <Card>
              <SectionTitle title="RESULTS" sub={`Last simulated run · ${last.at}`} />
              <ul className="grid grid-cols-2 gap-2">
                {MP_SCOPE.filter((x) => runIds.includes(x.id)).map((x) => (
                  <li
                    key={x.id}
                    className="eo-list-row flex items-center justify-between rounded-lg border border-border bg-window px-3 py-2 text-[12px]"
                  >
                    <span className="truncate">{x.t}</span>
                    <Badge tone="success">SIMULATED</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-subtle">
                {last.before} → {last.after} sample processes · 0 real changes on this PC
              </p>
            </Card>
          )}
          <SimNotice />
        </div>

        <aside aria-label="Engine status" className="eo-stagger space-y-3">
          <Card className="eo-v4-rail">
            <div className="flex items-center justify-between gap-2">
              <Label as="h2" className="text-foreground">
                ENGINE
              </Label>
              <Btn size="sm" variant="ghost" onClick={() => simulate("Retry service")}>
                Retry service
              </Btn>
            </div>
            <div className="mt-1.5">
              <KV k="Service" v={<span className="text-warning">Offline · simulated</span>} />
              <KV k="Profile" v="Maximum Performance" />
              <KV
                k="Last run"
                v={last ? `${last.at} · ${last.before} → ${last.after} processes` : "Not run"}
              />
            </div>
            <div className="eo-rail-sep" />
            <Label className="mb-1.5 text-[10px]">HARDWARE · SAMPLE</Label>
            <ul className="space-y-1.5 text-[12px]">
              {(
                [
                  [Cpu, HW.cpu, HW.cpuSub],
                  [MonitorCog, HW.gpu, HW.gpuSub],
                  [MemoryStick, HW.ram, HW.ramSub],
                ] as const
              ).map(([Icon, a, b]) => (
                <li key={a} className="flex gap-2">
                  <Icon aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{a}</div>
                    <div className="truncate text-[10.5px] text-subtle">{b}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="eo-v4-rail">
            <SectionTitle
              title="CORE FOOTPRINT"
              sub="Background footprint vs safe target · sample"
              badge={<GuideTip id="v4.core" />}
            />
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-muted-foreground">Current</span>
              <span className="font-semibold tabular-nums text-foreground">
                {coreDone ? 45 : 70}%
              </span>
            </div>
            <Bar
              value={coreDone ? 45 : 70}
              tone={coreDone ? "success" : "warning"}
              className="mt-1.5"
            />
            <div className="mt-2.5 flex items-baseline justify-between text-[12px]">
              <span className="text-muted-foreground">Safe target</span>
              <span className="font-semibold tabular-nums text-cyan">55%</span>
            </div>
            <Bar value={55} className="mt-1.5" />
            <p className="mt-2 text-[11px] text-subtle">
              {coreDone
                ? "Converged to the safe base in the last simulated run."
                : scope.sel.has("core")
                  ? "Runs as part of Optimize selected."
                  : "Select Core footprint convergence to include it."}
            </p>
          </Card>
        </aside>
      </div>

      <Modal
        open={confirmRun}
        onClose={() => setConfirmRun(false)}
        title="Review Maximum Performance"
        sub="Simulated run · No Windows settings will be changed."
        icon={<Zap className="h-4 w-4" />}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirmRun(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              disabled={!picked.length}
              onClick={() => {
                setConfirmRun(false);
                run();
              }}
            >
              Confirm & optimize · simulated ({picked.length})
            </Btn>
          </>
        }
      >
        <p className="text-[12.5px] text-muted-foreground">
          Only the selected areas run. Sample results do not establish real performance gains.
        </p>
        <ul className="mt-3 space-y-1.5">
          {picked.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
            >
              {s.t}
              <RiskBadge risk={s.risk} />
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

/* Three simulated emulator engines; each has its own page (Optimization, Debloater, Advanced). */
const ENGINES = [
  {
    n: "Emulator Optimization",
    sub: "Host MMCSS multimedia scheduling, DirectComposition presentation latency and process priority.",
    tags: [
      "SCOPE: MMCSS & DIRECT3D",
      "TARGET: HD-PLAYER.EXE",
      "SAFE CORE PROFILE",
      "OFFLINE READY",
    ],
    desc: "Smoother Free Fire frame pacing and lower input delay for MSI App Player.",
    pre: "Applies offline to the host, or live while the emulator runs.",
    needsAdb: false,
  },
  {
    n: "Emulator Debloater",
    sub: "Safe guest package debloat, telemetry suppression & background broadcast cleanup.",
    tags: [
      "SHIELDED: BOOT, INPUT & GRAPHICS",
      "PLAY STORE & FREE FIRE PROTECTED",
      "PM / APPOPS METHOD",
      "AUTOMATIC MANIFEST ROLLBACK",
    ],
    desc: "Clean unnecessary emulator apps, packages and background services.",
    pre: "Needs MSI App Player running + Android Debug Bridge connected.",
    needsAdb: true,
  },
  {
    n: "Emulator Advanced Optimization",
    sub: "SurfaceFlinger latch unsignaled, HWUI render threads, Dalvik heap compaction.",
    tags: [
      "SURFACEFLINGER LATCH",
      "HWUI RENDER THREADS",
      "DALVIK HEAP: 128M / 512M",
      "CALIBRATED OVERRIDES",
    ],
    desc: "Hardware-aware rendering and memory tuning for the Android guest.",
    pre: "Needs MSI App Player running + Android Debug Bridge connected.",
    needsAdb: true,
  },
];

type EngineState = "NOT RUN" | "APPLYING" | "APPLIED" | "NEEDS ADB";

/** One simulated engine run shared by the three emulator pages (state lives in v4Store). */
function useEngine(i: number) {
  const emu = useEmu();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  const [running, setRunning] = useState(false);
  const [p, setP] = useState(0);
  const e = ENGINES[i];
  const applied = emu.applied.includes(i);
  const blocked = !!e?.needsAdb && !emu.adb;
  const state: EngineState = running
    ? "APPLYING"
    : applied
      ? "APPLIED"
      : blocked
        ? "NEEDS ADB"
        : "NOT RUN";
  const run = (summary: string) => {
    if (running || blocked) return;
    setRunning(true);
    setP(0);
    let v = 0;
    timer.current = setInterval(() => {
      v += 4;
      setP(v);
      if (v >= 100) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setRunning(false);
        setEmu({ applied: [...new Set([...getEmu().applied, i])] });
        logV4(e?.n ?? "Engine", `${summary} · 0 real changes`);
        simulate(`${e?.n} applied`);
      }
    }, 70);
  };
  const restore = () => {
    setEmu({ applied: getEmu().applied.filter((x) => x !== i) });
    logV4(e?.n ?? "Engine", "Restored to the previous state", "RESTORED");
    simulate(`${e?.n} restored`);
  };
  return { state, running, p, applied, blocked, run, restore };
}

function engineTone(st: EngineState) {
  return st === "APPLIED"
    ? "success"
    : st === "APPLYING"
      ? "cyan"
      : st === "NEEDS ADB"
        ? "warning"
        : "muted";
}

/** Demo connection strip shared by every emulator page. Never claims a real connection. */
function ConnectionStrip() {
  const { adb } = useEmu();
  const rows = [
    { k: "MSI App Player", v: adb ? "Running (demo)" : "Not detected", ok: adb },
    { k: "Android Debug Bridge", v: adb ? "Connected (demo)" : "Offline", ok: adb },
    { k: "Guest subsystem", v: adb ? "Android 9 · x86_64 (sample)" : "—", ok: adb },
  ];
  return (
    <Card
      className="eo-v4-conn grid items-center gap-3 py-3"
      style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr)) auto" }}
    >
      {rows.map((c) => (
        <div key={c.k} className="flex items-center gap-2.5">
          <span aria-hidden="true" className="eo-v4-dot" data-ok={c.ok ? "true" : undefined} />
          <div className="min-w-0">
            <Label className="text-[10px]">{c.k}</Label>
            <div
              className={cn(
                "truncate text-[12.5px] font-bold",
                c.ok ? "text-success" : "text-warning",
              )}
            >
              {c.v}
            </div>
          </div>
        </div>
      ))}
      <Btn
        size="sm"
        onClick={() => {
          setEmu({ adb: !adb });
          simulate(adb ? "Demo connection turned off" : "Demo connection turned on");
        }}
      >
        {adb ? "Disconnect demo" : "Connect demo"}
      </Btn>
    </Card>
  );
}

/** Progress line used while an engine runs. */
function EngineProgress({ p }: { p: number }) {
  return (
    <div aria-live="polite">
      <div className="mb-1 flex justify-between text-[10.5px] font-bold text-cyan">
        <span>APPLYING · SIMULATED</span>
        <span className="font-mono">{p}%</span>
      </div>
      <Bar value={p} active />
    </div>
  );
}

const EMU_PAGES = [
  { slug: "emulator-optimization", t: "Emulator Optimization", engine: 0 },
  { slug: "emulator-debloater", t: "Emulator Debloater", engine: 1 },
  { slug: "emulator-advanced", t: "Emulator Advanced Optimization", engine: 2 },
] as const;

/** Rail card: recommended sequence across the three emulator pages. */
function SequenceCard({ current }: { current: string }) {
  const emu = useEmu();
  const steps: { t: string; done: boolean; to?: string }[] = [
    { t: "Host Maximum Performance", done: false, to: "v4-max-performance" },
    { t: "Connect MSI App Player 5 & ADB", done: emu.adb },
    ...EMU_PAGES.map((p) => ({
      t: p.t,
      done: emu.applied.includes(p.engine),
      ...(p.slug === current ? {} : { to: p.slug }),
    })),
  ];
  return (
    <Card className="eo-v4-rail">
      <span className="mb-1.5 flex items-center gap-1.5">
        <Label as="h2" className="text-foreground">
          RECOMMENDED SEQUENCE
        </Label>
        <GuideTip id="emu.engines" />
      </span>
      <ol className="eo-v4-seq space-y-1.5 text-[11.5px]">
        {steps.map((s, i) => (
          <li key={s.t} data-done={s.done ? "true" : undefined}>
            <span aria-hidden="true">{s.done ? "✓" : i + 1}</span>
            {s.to ? (
              <Link to="/$page" params={{ page: s.to }} className="hover:text-cyan">
                {s.t}
              </Link>
            ) : (
              <span
                className={
                  s.t === EMU_PAGES.find((p) => p.slug === current)?.t
                    ? "font-bold text-foreground"
                    : undefined
                }
              >
                {s.t}
              </span>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

const PROFILE_INFO: Record<EmuProfile, { a: string; b: string; t: string }> = {
  "BALANCED PROFILE": {
    a: "Everyday smooth gaming",
    b: "Conservative, stable starting point focused on compatibility and frame pacing.",
    t: "All PCs, 4 GB+ RAM",
  },
  "PERFORMANCE PROFILE": {
    a: "Maximum responsiveness",
    b: "Aggressive MMCSS priority scheduling and dedicated core affinity.",
    t: "Mid to high-end, 8 GB+ RAM, dedicated GPU",
  },
};
const PLANNED: Record<EmuProfile, { id: string; t: string; risk: "SAFE" | "LOW" | "MEDIUM" }[]> = {
  "BALANCED PROFILE": [
    { id: "mmcss", t: "MMCSS Games task priority", risk: "LOW" },
    { id: "hd-player", t: "HD-Player process priority", risk: "LOW" },
    { id: "affinity", t: "Core affinity balance", risk: "LOW" },
    { id: "presentation", t: "Presentation latency", risk: "LOW" },
  ],
  "PERFORMANCE PROFILE": [
    { id: "mmcss", t: "MMCSS Games task priority", risk: "LOW" },
    { id: "hd-player", t: "HD-Player process priority", risk: "LOW" },
    { id: "affinity", t: "Dedicated core affinity", risk: "MEDIUM" },
    { id: "presentation", t: "Presentation latency", risk: "LOW" },
  ],
};

/* ───────── PAGE 1 · EMULATOR OPTIMIZATION ─────────
 * Detection (demo), profile, hardware compatibility, CPU scheduling and Engine 1. */
export function EmulatorOptimizationPage() {
  const emu = useEmu();
  const { profile, adb } = emu;
  const eng = useEngine(0);
  const planned = PLANNED[profile];
  const opt = useModedSelection(`emu-opt:${profile}`, planned);
  const plannedSel = planned.filter((x) => opt.sel.has(x.id));
  const [review, setReview] = useState(false);
  const [bench, setBench] = useState(false);
  const e = ENGINES[0];
  return (
    <div className="space-y-4">
      <PageHeader
        title="Emulator Optimization"
        badges={<Badge tone="cyan">V4 GUEST ENGINE</Badge>}
        sub="MSI App Player 5 profile, hardware fit and host scheduling — simulated."
        actions={
          <Btn variant="ghost" disabled={!eng.applied || eng.running} onClick={eng.restore}>
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Restore
          </Btn>
        }
      />
      <ConnectionStrip />

      <div
        className="eo-engine-layout grid items-start gap-3.5"
        style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}
      >
        <div className="space-y-3">
          <div role="radiogroup" aria-label="Emulator profile" className="eo-profile-pick">
            {EMU_PROFILES.map((n) => {
              const info = PROFILE_INFO[n];
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={profile === n}
                  onClick={() => setEmu({ profile: n })}
                  className="eo-profile-option"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="eo-label text-foreground">{n}</span>
                    {n === "BALANCED PROFILE" && <Badge tone="cyan">RECOMMENDED</Badge>}
                  </span>
                  <span className="mt-1 block text-[13px] font-bold">{info.a}</span>
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">{info.b}</span>
                  <span className="mt-2 block text-[10.5px] text-subtle">Target: {info.t}</span>
                </button>
              );
            })}
          </div>

          <Card className={cn("eo-v4-engine", eng.running && "eo-glow")}>
            <div className="eo-v4-head">
              <div className="min-w-0">
                <Label className="text-cyan">CPU & SCHEDULING · ENGINE 1</Label>
                <h2 className="mt-0.5 text-[14px] font-bold">
                  {profile === "BALANCED PROFILE" ? "Balanced" : "Performance"} profile plan
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={engineTone(eng.state)}>
                  {eng.state === "APPLIED" ? "APPLIED · SIMULATED" : eng.state}
                </Badge>
                <SelectionBar
                  count={opt.sel.size}
                  total={opt.eligibleCount}
                  onAll={opt.selectAll}
                  onClear={opt.clear}
                  moded={opt}
                  title="Emulator Optimization"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {planned.map((x) => (
                <CheckRow
                  key={x.id}
                  on={opt.sel.has(x.id)}
                  onChange={() => !eng.running && opt.toggle(x.id)}
                  title={x.t}
                  right={<RiskBadge risk={x.risk} />}
                />
              ))}
            </div>
            {eng.running && (
              <div className="mt-3">
                <EngineProgress p={eng.p} />
              </div>
            )}
            <div className="eo-v4-engine-foot">
              <span className="text-[11px] text-subtle">{e?.pre}</span>
              <Btn
                variant="primary"
                disabled={!plannedSel.length || eng.running}
                onClick={() => setReview(true)}
              >
                <Zap aria-hidden="true" className="h-3.5 w-3.5" />
                Review & apply ({plannedSel.length})
              </Btn>
            </div>
            <div className="mt-1">
              <Details inline title="Rendering & technical details">
                <p className="text-xs text-muted-foreground">{e?.sub}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e?.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </Details>
              <Details
                inline
                title="Performance assessment"
                hint="Model estimate — not a benchmark"
              >
                <div className="grid grid-cols-4 gap-3 text-[12px]">
                  {[
                    ["HARDWARE TIER", "High-end (sample)"],
                    ["SUITABILITY", "Balanced & Performance"],
                    ["CONFIDENCE", "Sample value"],
                    ["RECOMMENDED", "Balanced"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <Label className="text-[9.5px]">{k}</Label>
                      <div className="font-semibold">{v}</div>
                    </div>
                  ))}
                </div>
                <Btn size="sm" className="mt-3" onClick={() => setBench(true)}>
                  High-FPS runtime test
                </Btn>
              </Details>
            </div>
          </Card>
          <SimNotice>
            No emulator, ADB connection or Android guest is touched — the connection is a demo
            toggle.
          </SimNotice>
        </div>

        <aside aria-label="Emulator overview" className="eo-stagger space-y-3">
          <Card className="eo-v4-rail">
            <Label as="h2" className="mb-1.5 text-foreground">
              HARDWARE COMPATIBILITY · SAMPLE
            </Label>
            <ul className="space-y-1.5 text-[12px]">
              {(
                [
                  [Cpu, HW.cpu],
                  [MonitorCog, HW.gpu],
                  [MemoryStick, HW.ram],
                ] as const
              ).map(([Icon, a]) => (
                <li key={a} className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-cyan" />
                  <span className="min-w-0 flex-1 truncate">{a}</span>
                  <CheckCircle2
                    aria-label="Compatible"
                    className="h-3.5 w-3.5 shrink-0 text-success"
                  />
                </li>
              ))}
            </ul>
          </Card>
          <SequenceCard current="emulator-optimization" />
        </aside>
      </div>

      <Modal
        open={review}
        onClose={() => setReview(false)}
        title="Review planned optimizations"
        sub={`${profile.replace(" PROFILE", "")} profile · simulated run`}
        icon={<Gauge className="h-4 w-4" />}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setReview(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              disabled={!plannedSel.length}
              onClick={() => {
                setReview(false);
                eng.run(
                  `${plannedSel.length} planned optimizations · ${profile.replace(" PROFILE", "").toLowerCase()} profile`,
                );
              }}
            >
              Confirm & optimize · simulated ({plannedSel.length})
            </Btn>
          </>
        }
      >
        <div className="space-y-1.5">
          {plannedSel.map((x) => (
            <div
              key={x.id}
              className="eo-list-row flex justify-between rounded-md border border-border bg-window px-3 py-2 text-[12.5px]"
            >
              <span>{x.t}</span>
              <RiskBadge risk={x.risk} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Only the selected optimizations are listed. Nothing is executed on this PC.
        </p>
      </Modal>
      <Modal
        open={bench}
        onClose={() => setBench(false)}
        title="High-FPS runtime test & A/B benchmark"
        sub="30-second runtime capture (simulated)"
        footer={<Btn onClick={() => setBench(false)}>Close</Btn>}
      >
        <div className="grid grid-cols-3 gap-2">
          {["GAMETRUTH FPS", "1% LOW FPS", "HOST PRESENTED"].map((k) => (
            <div key={k} className="rounded-lg border border-border bg-window p-3 text-center">
              <div className="text-xl font-bold">—</div>
              <div className="text-[10px] font-bold tracking-widest text-subtle">{k}</div>
            </div>
          ))}
        </div>
        <Btn variant="primary" className="mt-4" onClick={() => simulate("Run benchmark (30s)")}>
          Run benchmark (30s)
        </Btn>
        <p className="mt-3 text-[11px] text-success">
          Simulation only: no frames are measured and emulator files are not touched.
        </p>
      </Modal>
    </div>
  );
}

/* ───────── PAGE 2 · EMULATOR DEBLOATER ─────────
 * Former Deep Debloater module + Deployer & Debloater page. Packages, services and
 * background components, classified; protected items are never selectable. */
type DebloatCat = "PACKAGES" | "SERVICES" | "BACKGROUND COMPONENTS";
const DEBLOAT: {
  id: string;
  cat: DebloatCat;
  risk: "SAFE" | "LOW" | "PROTECTED";
  recommended?: boolean;
  unsupported?: boolean;
  note?: string;
}[] = [
  { id: "Promotional app center", cat: "PACKAGES", risk: "SAFE" },
  { id: "Promotional launcher", cat: "PACKAGES", risk: "SAFE" },
  {
    id: "Google Play Store",
    cat: "PACKAGES",
    risk: "PROTECTED",
    note: "Required for game updates",
  },
  { id: "Free Fire", cat: "PACKAGES", risk: "PROTECTED", note: "Your game — always kept" },
  { id: "Telemetry agent", cat: "SERVICES", risk: "SAFE" },
  { id: "Ad SDK service", cat: "SERVICES", risk: "SAFE" },
  {
    id: "Guest location service",
    cat: "SERVICES",
    risk: "LOW",
    recommended: false,
    note: "Requires confirmation — some games use it",
  },
  { id: "Input method service", cat: "SERVICES", risk: "PROTECTED", note: "Keyboard & controls" },
  { id: "Analytics broadcast receiver", cat: "BACKGROUND COMPONENTS", risk: "SAFE" },
  {
    id: "Host-side updater",
    cat: "BACKGROUND COMPONENTS",
    risk: "LOW",
    unsupported: true,
    note: "Not applicable — runs on Windows, not in the guest",
  },
];
const DEBLOAT_CATS: DebloatCat[] = ["PACKAGES", "SERVICES", "BACKGROUND COMPONENTS"];
type DebloatClass = "SAFE" | "RECOMMENDED" | "PROTECTED" | "NOT APPLICABLE" | "CONFIRM";
function debloatClass(x: (typeof DEBLOAT)[number]): DebloatClass {
  if (x.risk === "PROTECTED") return "PROTECTED";
  if (x.unsupported) return "NOT APPLICABLE";
  if (x.recommended === false) return "CONFIRM";
  return x.risk === "SAFE" ? "RECOMMENDED" : "SAFE";
}
const CLASS_TONE: Record<DebloatClass, "success" | "cyan" | "muted" | "warning"> = {
  SAFE: "success",
  RECOMMENDED: "cyan",
  PROTECTED: "muted",
  "NOT APPLICABLE": "muted",
  CONFIRM: "warning",
};
const CLASS_LABEL: Record<DebloatClass, string> = {
  SAFE: "SAFE",
  RECOMMENDED: "SAFE · RECOMMENDED",
  PROTECTED: "PROTECTED",
  "NOT APPLICABLE": "NOT APPLICABLE",
  CONFIRM: "REQUIRES CONFIRMATION",
};

export function EmulatorDebloaterPage() {
  const eng = useEngine(1);
  const debloat = useModedSelection("emu-debloat", DEBLOAT);
  const [scanned, setScanned] = useState(false);
  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [filter, setFilter] = useState<"All" | DebloatClass>("All");
  const scan = useSimRun(2000);
  const selected = DEBLOAT.filter((x) => debloat.sel.has(x.id));
  const protectedN = DEBLOAT.filter((x) => x.risk === "PROTECTED").length;
  const needsConfirm = selected.some((x) => debloatClass(x) === "CONFIRM");
  return (
    <div className={cn("space-y-4", scanned && "pb-16")}>
      <PageHeader
        title="Emulator Debloater"
        badges={<Badge tone="success">PROTECTED CORE SAFEGUARDED</Badge>}
        sub="Scan and safely disable emulator packages, services and background components — simulated."
        actions={
          <>
            <Btn variant="ghost" disabled={!scanned} onClick={() => setPreview(true)}>
              Preview
            </Btn>
            <Btn
              variant="ghost"
              disabled={!eng.applied}
              onClick={() => simulate("Verify debloat state")}
            >
              Verify
            </Btn>
            <Btn variant="ghost" disabled={!eng.applied || eng.running} onClick={eng.restore}>
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Restore
            </Btn>
            <Btn
              variant="primary"
              disabled={scan.running}
              onClick={() =>
                scan.start(() => {
                  setScanned(true);
                  logV4("Emulator Debloater", `Scan · ${DEBLOAT.length} sample components listed`);
                })
              }
            >
              {scanned ? "Rescan" : "Scan emulator"}
            </Btn>
          </>
        }
      />
      <ConnectionStrip />
      {scanned && (
        <StatTiles
          items={[
            { label: "SCANNED", value: DEBLOAT.length, sub: "Sample inventory" },
            { label: "PROTECTED", value: protectedN, sub: "Locked & preserved", tone: "cyan" },
            {
              label: "SAFE · RECOMMENDED",
              value: DEBLOAT.filter((x) => debloatClass(x) === "RECOMMENDED").length,
              sub: "Pre-selected",
              tone: "success",
            },
            {
              label: "REQUIRES CONFIRMATION",
              value: DEBLOAT.filter((x) => debloatClass(x) === "CONFIRM").length,
              sub: "Never auto-selected",
              tone: "warning",
            },
          ]}
        />
      )}

      <div
        className="eo-engine-layout grid items-start gap-3.5"
        style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}
      >
        <div className="space-y-3">
          <Card>
            <div className="eo-v4-head">
              <div className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <Label className="text-cyan">EMULATOR COMPONENTS</Label>
                  <GuideTip id="hub.debloater" />
                </span>
                <p className="mt-0.5 text-[11px] text-success">
                  Components are disabled, never deleted · protected items are never selectable
                </p>
              </div>
              {!scanned && (
                <Badge tone={engineTone(eng.state)}>
                  {eng.state === "APPLIED" ? "APPLIED · SIMULATED" : `ENGINE 2 · ${eng.state}`}
                </Badge>
              )}
              {scanned && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2">
                    <Label>SHOW</Label>
                    <div className="w-48">
                      <PremiumSelect
                        size="sm"
                        label="Filter by classification"
                        value={filter as string}
                        onChange={(v) => setFilter(v as typeof filter)}
                        options={[
                          { value: "All", label: "All" },
                          ...(Object.keys(CLASS_LABEL) as DebloatClass[]).map((c) => ({
                            value: c as string,
                            label: CLASS_LABEL[c],
                          })),
                        ]}
                      />
                    </div>
                  </label>
                  <SelectionBar
                    count={debloat.sel.size}
                    total={debloat.eligibleCount}
                    onAll={debloat.selectAll}
                    onClear={debloat.clear}
                    moded={debloat}
                    allLabel="Select all safe"
                    title="Emulator Debloater"
                  />
                </div>
              )}
            </div>
            {scan.running && (
              <div className="mb-3" aria-live="polite">
                <Bar value={scan.progress ?? 0} active />
                <p className="mt-1 text-[11px] text-cyan">Scanning emulator stack… (simulated)</p>
              </div>
            )}
            {!scanned && !scan.running && (
              <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-[12px] text-muted-foreground">
                No components scanned yet — use <b className="text-foreground">Scan emulator</b>.
                Safe items are pre-selected; protected ones never are.
              </p>
            )}
            {scanned && (
              <div className="space-y-3">
                {DEBLOAT_CATS.map((cat) => {
                  const rows = DEBLOAT.filter(
                    (x) => x.cat === cat && (filter === "All" || debloatClass(x) === filter),
                  );
                  if (!rows.length) return null;
                  return (
                    <section key={cat} aria-label={cat}>
                      <Label className="mb-1.5 text-[10px]">
                        {cat} · {rows.length}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {rows.map((x) => {
                          const c = debloatClass(x);
                          return (
                            <CheckRow
                              key={x.id}
                              on={debloat.sel.has(x.id)}
                              onChange={() => !eng.running && debloat.toggle(x.id)}
                              locked={
                                c === "PROTECTED"
                                  ? "Protected — never selectable"
                                  : c === "NOT APPLICABLE"
                                    ? "Not applicable"
                                    : undefined
                              }
                              title={x.id}
                              desc={x.note}
                              right={<Badge tone={CLASS_TONE[c]}>{CLASS_LABEL[c]}</Badge>}
                            />
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
            {eng.running && (
              <div className="mt-3">
                <EngineProgress p={eng.p} />
              </div>
            )}
            <div className="mt-2">
              <Details inline title="Restore & rollback">
                <p className="text-xs text-muted-foreground">
                  Every disabled package is recorded in a manifest before the run. Restore
                  re-enables them; emulator configuration files stay read-only. Deployment checks
                  (Verify) confirm the recorded state — all simulated in this prototype.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ENGINES[1]?.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </Details>
            </div>
          </Card>

          <SimNotice>Simulated debloat · no Android package or service is changed.</SimNotice>
        </div>
        <aside aria-label="Debloat overview" className="eo-stagger space-y-3">
          <SequenceCard current="emulator-debloater" />
        </aside>
      </div>

      {scanned && (
        <div className="eo-action-bar">
          <span className="text-[11.5px] text-muted-foreground">
            <b className="text-foreground">Emulator Debloater</b> · {selected.length} selected
            {eng.blocked && <span className="text-warning"> · needs the demo connection</span>}
          </span>
          <Btn
            variant="primary"
            disabled={!selected.length || eng.blocked || eng.running}
            onClick={() => setConfirm(true)}
          >
            Review & debloat ({selected.length})
          </Btn>
        </div>
      )}

      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title="Debloat preview audit"
        footer={<Btn onClick={() => setPreview(false)}>Close preview</Btn>}
      >
        <pre className="rounded-lg bg-background p-3 font-mono text-[11px] text-muted-foreground">
          [preview] {selected.length} selected for disabling{"\n"}[preview] {protectedN} protected
          (skipped){"\n"}[preview] no files will be deleted
        </pre>
      </Modal>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Review debloat"
        sub="Simulated run · No packages or services will be changed."
        icon={<Layers className="h-4 w-4" />}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={() => {
                setConfirm(false);
                eng.run(`${selected.length} components disabled (sample)`);
              }}
            >
              Confirm & optimize · simulated ({selected.length})
            </Btn>
          </>
        }
      >
        <ul className="space-y-1.5">
          {selected.map((x) => (
            <li
              key={x.id}
              className="eo-list-row flex items-center justify-between rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
            >
              {x.id}
              <Badge tone={CLASS_TONE[debloatClass(x)]}>{CLASS_LABEL[debloatClass(x)]}</Badge>
            </li>
          ))}
        </ul>
        {needsConfirm && (
          <p className="mt-3 text-[11px] text-warning">
            Includes items that require confirmation — you chose them by hand.
          </p>
        )}
      </Modal>
    </div>
  );
}

/* ───────── PAGE 3 · EMULATOR ADVANCED OPTIMIZATION ─────────
 * Former Advanced engine + Low-End Extreme module + Low End Steam page. */
type AdvCat =
  "GRAPHICS & RENDERING" | "MEMORY ALLOCATION" | "FRAME PACING & LATENCY" | "BACKGROUND RESOURCES";
const ADVANCED: { id: string; cat: AdvCat; risk: "LOW" | "HIGH"; d: string }[] = [
  {
    id: "SurfaceFlinger latch",
    cat: "GRAPHICS & RENDERING",
    risk: "LOW",
    d: "Latches graphics buffers without waiting for fences.",
  },
  {
    id: "HWUI render threads",
    cat: "GRAPHICS & RENDERING",
    risk: "LOW",
    d: "Render thread tuning for the guest UI pipeline.",
  },
  {
    id: "Aggressive HWUI render override",
    cat: "GRAPHICS & RENDERING",
    risk: "HIGH",
    d: "Aggressive guest HWUI render pipeline override.",
  },
  {
    id: "Dalvik heap compaction",
    cat: "MEMORY ALLOCATION",
    risk: "LOW",
    d: "Tightens heap boundaries to relieve memory pressure.",
  },
  {
    id: "Guest memory growth limit",
    cat: "MEMORY ALLOCATION",
    risk: "LOW",
    d: "Caps guest heap growth on 4–8 GB systems.",
  },
  {
    id: "Compositor buffer timing",
    cat: "FRAME PACING & LATENCY",
    risk: "LOW",
    d: "Steadier compositor timing for frame pacing.",
  },
  {
    id: "Background guest thread trim",
    cat: "BACKGROUND RESOURCES",
    risk: "LOW",
    d: "Trims non-essential background guest threads.",
  },
];
const ADV_CATS: AdvCat[] = [
  "GRAPHICS & RENDERING",
  "MEMORY ALLOCATION",
  "FRAME PACING & LATENCY",
  "BACKGROUND RESOURCES",
];

export function EmulatorAdvancedPage() {
  const eng = useEngine(2);
  const adv = useModedSelection("emu-advanced", ADVANCED);
  const [risky, setRisky] = useState(true);
  const [hw, setHw] = useState("STANDARD");
  const [confirm, setConfirm] = useState(false);
  const scan = useSimRun(1600);
  const visible = ADVANCED.filter((x) => risky || x.risk !== "HIGH");
  // Hidden high-risk rows never count toward an apply.
  const selected = visible.filter((x) => adv.sel.has(x.id));
  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        title="Emulator Advanced Optimization"
        badges={<Badge tone="cyan">ADVANCED GUEST ENGINE</Badge>}
        sub="Rendering, memory, frame pacing and low-end hardware profiles for the Android guest — simulated."
        actions={
          <>
            <Btn variant="ghost" disabled={!eng.applied || eng.running} onClick={eng.restore}>
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Undo changes
            </Btn>
            <Btn
              disabled={scan.running}
              onClick={() => scan.start(() => simulate("Candidates rescanned"))}
            >
              Scan candidates
            </Btn>
          </>
        }
      />
      <ConnectionStrip />

      <div
        className="eo-engine-layout grid items-start gap-3.5"
        style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}
      >
        <Card className={cn("eo-v4-engine", eng.running && "eo-glow")}>
          <div className="eo-v4-head">
            <div className="min-w-0">
              <Label className="text-cyan">ENGINE 3 · CONFIGURATION CATEGORIES</Label>
              <h2 className="mt-0.5 text-[14px] font-bold">
                {hw === "LOW-END" ? "Low-end hardware profile" : "Standard hardware profile"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={engineTone(eng.state)}>
                {eng.state === "APPLIED" ? "APPLIED · SIMULATED" : eng.state}
              </Badge>
              <SelectionBar
                count={selected.length}
                total={adv.eligibleCount}
                onAll={adv.selectAll}
                onClear={adv.clear}
                moded={adv}
                title="Emulator Advanced Optimization"
              />
            </div>
          </div>
          {scan.running && <Bar value={scan.progress ?? 0} active className="mb-2" />}
          <div className="space-y-1">
            {ADV_CATS.map((cat, ci) => {
              const rows = visible.filter((x) => x.cat === cat);
              const n = rows.filter((x) => adv.sel.has(x.id)).length;
              return (
                <Details
                  key={cat}
                  inline
                  title={cat}
                  hint={`${n}/${rows.length} selected`}
                  defaultOpen={ci === 0}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {rows.map((x) => (
                      <CheckRow
                        key={x.id}
                        on={adv.sel.has(x.id)}
                        onChange={() => !eng.running && adv.toggle(x.id)}
                        title={x.id}
                        desc={x.d}
                        right={<RiskBadge risk={x.risk} />}
                      />
                    ))}
                  </div>
                </Details>
              );
            })}
          </div>
          <p className="mt-2 rounded-md border border-warning/30 bg-warning/5 px-2.5 py-1.5 text-[11px] text-warning">
            Latch overrides bypass buffer fence sync for lower latency; SurfaceFlinger and Dalvik
            items need the emulator connection.
          </p>
          {eng.running && (
            <div className="mt-3">
              <EngineProgress p={eng.p} />
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <label className="flex items-center gap-2 text-[11.5px]">
              <Toggle label="Show advanced risky tweaks" on={risky} onChange={setRisky} />
              Show advanced risky tweaks
            </label>
            <Details inline title="Technical details">
              <p className="text-xs text-muted-foreground">{ENGINES[2]?.sub}</p>
            </Details>
          </div>
        </Card>

        <aside aria-label="Advanced overview" className="eo-stagger space-y-3">
          <Card className="eo-v4-rail">
            <span className="mb-1.5 flex items-center gap-1.5">
              <Label as="h2" className="text-foreground">
                HARDWARE PROFILE
              </Label>
              <GuideTip id="hub.lowend" />
            </span>
            <Segmented
              label="Hardware profile"
              options={["STANDARD", "LOW-END"]}
              value={hw}
              onChange={setHw}
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              {hw === "LOW-END"
                ? "Calibrated for dual/quad-core CPUs, Intel HD/UHD graphics and 4–8 GB RAM. Unprivileged guest properties only."
                : "Default calibration for mid to high-end PCs with a dedicated GPU."}
            </p>
            <div className="eo-rail-sep" />
            <KV k="Categories" v={`${ADV_CATS.length} available`} />
            <KV k="Selected" v={`${selected.length} items`} />
            <KV k="Undo" v="Instant · guest-level properties" />
          </Card>
          <SequenceCard current="emulator-advanced" />
        </aside>
      </div>

      <SimNotice>
        Hardware-aware estimates only · no guaranteed FPS · no emulator files touched.
      </SimNotice>

      <div className="eo-action-bar">
        <span className="text-[11.5px] text-muted-foreground">
          <b className="text-foreground">Advanced Optimization</b> · {selected.length} selected
          {eng.blocked && <span className="text-warning"> · needs the demo connection</span>}
        </span>
        <Btn
          variant="primary"
          disabled={!selected.length || eng.blocked || eng.running}
          onClick={() => setConfirm(true)}
        >
          Review & apply ({selected.length})
        </Btn>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Review advanced optimization"
        sub={`${hw === "LOW-END" ? "Low-end" : "Standard"} profile · simulated run`}
        icon={<Gauge className="h-4 w-4" />}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={() => {
                setConfirm(false);
                eng.run(`${selected.length} advanced items · ${hw.toLowerCase()} profile`);
              }}
            >
              Confirm & optimize · simulated ({selected.length})
            </Btn>
          </>
        }
      >
        <ul className="space-y-1.5">
          {selected.map((x) => (
            <li
              key={x.id}
              className="eo-list-row flex items-center justify-between rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
            >
              {x.id}
              <RiskBadge risk={x.risk} />
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

/* ───────── V4 PERFORMANCE CENTER (V4DashboardView) ─────────
 * Independent from the V3 Dashboard; reads only V4 session state (v4Store). */
export function V4DashboardPage() {
  const emu = useEmu();
  const navigate = useNavigate();
  const go = (page: string) => navigate({ to: "/$page", params: { page } });
  const done = emu.applied.length;
  const lastHost = emu.activity.find((a) => a.module === "Maximum Performance");
  const last = emu.activity[0];
  // Illustrative readiness: base 52, connection +18, each applied engine shares the remaining 30.
  const readiness = Math.round(52 + (emu.adb ? 18 : 0) + (done / ENGINES.length) * 30);
  const next = !lastHost
    ? { t: "Run Maximum Performance on the host", to: "v4-max-performance" }
    : !emu.adb
      ? { t: "Turn on the demo emulator connection", to: "emulator-optimization" }
      : (EMU_PAGES.find((p) => !emu.applied.includes(p.engine)) ?? null);
  const nextLabel = next
    ? "engine" in next
      ? `Open ${next.t}`
      : next.t
    : "All V4 modules applied";
  const cards = [
    {
      slug: "emulator-optimization",
      icon: MonitorCog,
      t: "Emulator Optimization",
      rows: [
        ["Profile", emu.profile.replace(" PROFILE", "")],
        ["Connection", emu.adb ? "Demo connected" : "Not detected"],
        ["Hardware", "Compatible (sample)"],
      ],
      engine: 0,
    },
    {
      slug: "emulator-debloater",
      icon: Layers,
      t: "Emulator Debloater",
      rows: [
        [
          "Scan",
          emu.activity.some((a) => a.module === "Emulator Debloater") ? "Scanned" : "Not scanned",
        ],
        ["Components", `${DEBLOAT.length} in sample inventory`],
        ["Protected", `${DEBLOAT.filter((x) => x.risk === "PROTECTED").length} always kept`],
      ],
      engine: 1,
    },
    {
      slug: "emulator-advanced",
      icon: Boxes,
      t: "Emulator Advanced Optimization",
      rows: [
        ["Categories", `${ADV_CATS.length} available`],
        ["Low-end profile", "Available"],
        ["Risky tweaks", "Off by default"],
      ],
      engine: 2,
    },
  ] as const;
  return (
    <div className="space-y-4">
      <PageHeader
        title="V4 Performance Center"
        badges={<Badge tone="cyan">V4 PROFESSIONAL</Badge>}
        sub="Host and emulator performance at a glance — sample data, simulated engines."
        actions={
          <>
            <Btn size="sm" variant="ghost" onClick={() => go("v4-max-performance")}>
              Max Performance
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => go("emulator-optimization")}>
              Emulator
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => go("emulator-debloater")}>
              Debloater
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => go("emulator-advanced")}>
              Advanced
            </Btn>
          </>
        }
      />
      <StatTiles
        items={[
          {
            label: "CPU USAGE",
            value: <AnimatedNumber value={12} suffix="%" duration={650} />,
            sub: "Sample",
          },
          {
            label: "RAM USAGE",
            value: <AnimatedNumber value={36} suffix="%" duration={650} />,
            sub: "Sample",
          },
          {
            label: "GPU USAGE",
            value: <AnimatedNumber value={9} suffix="%" duration={650} />,
            sub: "Sample",
          },
          {
            label: "BACKGROUND PROCESSES",
            value: <AnimatedNumber value={142} duration={650} />,
            sub: "Sample",
          },
          { label: "V4 ENGINE", value: "Offline", sub: "Simulated service", tone: "warning" },
          {
            label: "LAST RUN",
            value: last ? last.at : "—",
            sub: last ? last.module : "Nothing yet",
          },
        ]}
      />

      <div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-2">
        <Card className="flex items-center gap-4">
          <ScoreRing
            value={readiness}
            label={`Illustrative V4 readiness ${readiness} of 100`}
            size={112}
            stroke={9}
          >
            <CountUp value={readiness} className="text-[22px] font-extrabold tabular-nums" />
            <span className="eo-label text-[9px] text-muted-foreground">READINESS</span>
          </ScoreRing>
          <div className="min-w-0 flex-1">
            <Label className="text-cyan">HOST OPTIMIZATION</Label>
            <h2 className="mt-0.5 text-[14px] font-bold">Maximum Performance</h2>
            <KV
              k="Status"
              v={lastHost ? <span className="text-success">Run this session</span> : "Not run"}
            />
            <KV k="Scope" v={`${MP_SCOPE.length} host areas available`} />
            <KV k="Last run" v={lastHost ? `${lastHost.at} · ${lastHost.summary}` : "—"} />
            <Btn
              size="sm"
              variant="primary"
              className="mt-2"
              onClick={() => go("v4-max-performance")}
            >
              <Zap aria-hidden="true" className="h-3.5 w-3.5" />
              Open Maximum Performance
            </Btn>
          </div>
        </Card>
        <Card>
          <SectionTitle title="PERFORMANCE INSIGHTS" sub="From this session and sample data" />
          <KV k="Bottleneck" v="Not measured in the prototype" />
          <KV k="CPU / memory pressure" v="Low · sample (12% / 36%)" />
          <KV
            k="Emulator resources"
            v={emu.adb ? "Demo guest connected" : "No emulator detected"}
          />
          <KV
            k="Opportunities"
            v={`${ENGINES.length - done} of ${ENGINES.length} emulator engines not applied`}
          />
          <KV
            k="Last operation"
            v={last ? `${last.module} · ${last.status}` : "None this session"}
          />
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-window px-3 py-2">
            <span className="min-w-0 truncate text-[12px]">
              <b className="text-cyan">NEXT</b> · {nextLabel}
            </span>
            {next && (
              <Link
                to="/$page"
                params={{ page: "slug" in next ? next.slug : next.to }}
                className="text-[11.5px] font-semibold text-cyan hover:underline"
              >
                Go
              </Link>
            )}
          </div>
        </Card>
      </div>

      <SectionTitle
        title="EMULATOR PERFORMANCE CENTER"
        sub="Three dedicated modules · each keeps its own state"
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((m) => {
          const applied = emu.applied.includes(m.engine);
          return (
            <Link
              key={m.slug}
              to="/$page"
              params={{ page: m.slug }}
              className="eo-module-link group"
            >
              <Card className="flex h-full flex-col">
                <span className="flex items-center gap-3">
                  <span className="eo-module-icon" aria-hidden="true">
                    <m.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-bold text-foreground">
                    {m.t}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="eo-module-arrow h-4 w-4 shrink-0 text-muted-foreground"
                  />
                </span>
                <span className="mt-2 block">
                  {m.rows.map(([k, v]) => (
                    <KV key={k} k={k} v={v} />
                  ))}
                </span>
                <span className="mt-2">
                  <Badge tone={applied ? "success" : "muted"}>
                    {applied ? "APPLIED · SIMULATED" : "NOT RUN"}
                  </Badge>
                </span>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <SectionTitle title="OPTIMIZATION ACTIVITY" sub="Simulated runs from this session" />
        {emu.activity.length ? (
          <ul className="space-y-1.5">
            {emu.activity.map((a, i) => (
              <li
                key={`${a.at}-${i}`}
                className="eo-list-row grid items-center gap-3 rounded-lg border border-border bg-window px-3 py-2 text-[12px]"
                style={{ gridTemplateColumns: "minmax(0,1.2fr) auto minmax(0,2fr) auto" }}
              >
                <span className="truncate font-semibold">{a.module}</span>
                <Badge tone={a.status === "RESTORED" ? "muted" : "success"}>{a.status}</Badge>
                <span className="truncate text-muted-foreground">{a.summary}</span>
                <span className="font-mono text-[11px] text-subtle">{a.at}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="NO ACTIVITY YET"
            sub="Runs from Maximum Performance and the emulator pages appear here."
          />
        )}
      </Card>
      <SimNotice />
    </div>
  );
}

// InputOptimizerView, SystemInfoView, RegistryTweakView, RegistryValuesView, RegistryValuesRamView, GpuRegistryValuesView
import { useEffect, useState, useMemo, type ReactNode } from "react";
import {
  Check as CheckIcon,
  Gauge,
  Lock,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Badge,
  Bar,
  Btn,
  Card,
  Check,
  CheckRow,
  Chips,
  Cols,
  Details,
  KV,
  Label,
  Modal,
  PageHeader,
  RiskBadge,
  SearchBox,
  SectionTitle,
  SelectionBar,
  SimNotice,
  StatTiles,
  simulate,
  useSimRun,
} from "../kit";
import type { GuideId } from "@/lib/eo/guides";
import { RunModal } from "../RunModal";
import { PremiumSelect } from "../dropdown";
import { TelemetryConsole } from "../Telemetry";
import { HealthCheck } from "../HealthCheck";
import { buildExecutionPlan, clampSelection, eligibleSelection, isSelectable, toggleInSet } from "@/lib/eo/selection";
import {
  INPUT_ITEMS,
  INPUT_MODES,
  exclusionReason,
  modeSelection,
  parseInputMode,
  type InputItem,
  type InputMode,
} from "@/lib/eo/inputModes";
import { useModedSelection, usePersistedSelection } from "../useSelection";
import {
  GPU_REG_GROUPS,
  GPU_REGISTRY_VALUES,
  RAM_GROUPS,
  RAM_REGISTRY_VALUES,
  RAM_TIER_MAP,
  SAMPLE_REGISTRY_HW,
  SVCHOST_DEFAULT_KB,
  hex8,
  nearestRamTier,
  registrySummary,
  valuesInGroup,
  type RegistryGroup,
  type RegistryValueEntry,
} from "@/lib/eo/registryValues";
import { CATALOG, HW } from "@/lib/eo/data";
import { cn } from "@/lib/utils";

/* ───────── INPUT OPTIMIZER (Global Eligible-Only Mode) ───────── */
export function InputOptimizerPage() {
  const plan = useMemo(() => buildExecutionPlan(INPUT_ITEMS, "AUTO"), []);
  const eligibleIds = useMemo(() => new Set(plan.queue), [plan]);
  const runItems = useMemo(
    () => INPUT_ITEMS.filter((i) => eligibleIds.has(i.id)),
    [eligibleIds],
  );

  const test = useSimRun(2500);
  const [run, setRun] = useState(false);
  const [tested, setTested] = useState(false);

  const readRow = (i: InputItem) => {
    const isEligible = eligibleIds.has(i.id);
    const why = isEligible ? null : exclusionReason(i) ?? "Not applicable";

    return (
      <li key={i.id} className="eo-mode-row" data-included={isEligible ? "true" : undefined}>
        <span
          className={cn(
            "eo-mode-row-mark flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
            isEligible
              ? "border-cyan bg-cyan text-sidebar-primary-foreground shadow-sm"
              : "border-border bg-window text-subtle",
          )}
          aria-hidden="true"
        >
          {isEligible ? (
            <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
          ) : (
            <Lock className="h-2.5 w-2.5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold">{i.title}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {i.group === "advanced" ? `${i.desc} · ${i.compat}` : i.desc}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {i.restart && <Badge tone="warning">RESTART</Badge>}
          <RiskBadge risk={i.risk} />
          {isEligible ? (
            <Badge tone="success" className="text-[9.5px] font-bold tracking-wide">
              AUTO-SELECTED — ELIGIBLE
            </Badge>
          ) : (
            <Badge tone="muted" className="text-[9.5px] font-semibold uppercase">
              {why?.toUpperCase()}
            </Badge>
          )}
        </span>
        <span className="sr-only">
          {isEligible ? "Auto-selected eligible" : `Excluded: ${why}`}
        </span>
      </li>
    );
  };

  const normalItems = INPUT_ITEMS.filter((i) => i.group === "normal");
  const advItems = INPUT_ITEMS.filter((i) => i.group === "advanced");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Input Optimizer"
        badges={
          <>
            <Badge tone="cyan">LATENCY REDUCTION ENGINE</Badge>
            <Badge tone="success">ELIGIBLE OPTIMIZATIONS ONLY</Badge>
          </>
        }
        sub="Simulated pointer, keyboard and timer tuning · Authoritative eligible-only execution."
        actions={
          <Btn variant="ghost" onClick={() => simulate("Refresh")}>
            Refresh
          </Btn>
        }
      />
      <StatTiles
        items={[
          { label: "MOUSE", value: "1:1 LINEAR", sub: "Sample pointer curve" },
          { label: "KEYBOARD", value: "31 / 0", sub: "Sample repeat / delay" },
          { label: "TIMER", value: "0.5 ms", sub: "Demo interval" },
          { label: "ELIGIBLE QUEUED", value: runItems.length, tone: "cyan" },
        ]}
      />

      <Card>
        <SectionTitle
          title="ELIGIBLE INPUT OPTIMIZATIONS"
          guide="input.modes"
          sub="All applicable optimizations matching system and hardware criteria are automatically queued."
          right={
            <Badge tone="cyan">
              {runItems.length} of {INPUT_ITEMS.length} eligible
            </Badge>
          }
        />
        <div className="eo-sel-bar mb-3 flex flex-wrap items-center justify-between gap-2 py-1">
          <div className="flex items-center gap-2">
            <Badge tone="cyan" className="text-[10px] font-bold uppercase tracking-wider">
              ELIGIBLE OPTIMIZATIONS ONLY
            </Badge>
            <span className="text-[11.5px] font-medium text-muted-foreground">
              <b className="text-foreground tabular-nums font-bold">{runItems.length}</b> eligible items auto-selected
              {plan.excluded.length > 0 && (
                <span className="text-subtle ml-1.5">
                  · {plan.excluded.length} ineligible/excluded
                </span>
              )}
            </span>
          </div>
          <Badge tone="success" className="text-[10px] font-semibold tracking-wide">
            AUTO-SELECTED — ELIGIBLE
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <div className="eo-label mb-1.5 text-[10px] text-cyan">STANDARD POINTER & KEYBOARD PRESETS</div>
            <ul className="space-y-1.5" aria-label="Standard optimizations">
              {normalItems.map(readRow)}
            </ul>
          </div>

          <div>
            <div className="eo-label mb-1.5 text-[10px] text-cyan">ADVANCED QUEUE, TIMER & USB OPTIONS</div>
            <ul className="space-y-1.5" aria-label="Advanced optimizations">
              {advItems.map(readRow)}
            </ul>
          </div>
        </div>
      </Card>

      <div className="eo-action-bar flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5">
        <span className="text-[12px] text-muted-foreground">
          <b className="text-foreground tabular-nums font-bold">{runItems.length}</b> optimizations auto-selected ·{" "}
          <span className="text-success font-semibold">Eligible optimizations only</span>
        </span>
        <Btn variant="primary" disabled={!runItems.length} onClick={() => setRun(true)}>
          Apply eligible optimizations ({runItems.length})
        </Btn>
      </div>

      <RunModal
        open={run}
        onClose={() => setRun(false)}
        profile="Input Latency"
        count={runItems.length}
        items={runItems}
      />

      <Card>
        <SectionTitle
          title="SIMULATED INPUT TEST"
          guide="input.test"
          sub="Sample input-test flow — no physical input measurements are captured."
          right={["5 SEC TEST", "10 SEC TEST", "30 SEC TEST"].map((x) => (
            <Btn
              key={x}
              size="sm"
              disabled={test.running}
              onClick={() => test.start(() => setTested(true))}
            >
              {x}
            </Btn>
          ))}
        />
        {test.running && <Bar value={test.progress ?? 0} className="mb-3" />}
        <StatTiles
          items={[
            { label: "SAMPLES", value: "—" },
            { label: "AVG INTERVAL", value: "—" },
            { label: "FREQUENCY", value: "—" },
            { label: "JITTER", value: "—", tone: "success" },
            { label: "TIMER RES", value: "0.5 ms" },
          ]}
        />
        <p className="mt-2 text-[10.5px] text-warning">
          {tested
            ? "Simulated test finished. No measurements were collected."
            : "Run the simulated test to preview its progress; real results require the native app."}
        </p>
        <Details
          inline
          title="Illustrative before / after states"
          hint="Demo values, not benchmarks"
        >
          <Cols cols="1fr 40px 1fr">
            <div className="rounded-lg border border-border bg-window p-3">
              <Label className="mb-2">BEFORE OPTIMIZATION</Label>
              <KV k="Polling Rate:" v="500 Hz" />
              <KV k="Timer Resolution:" v="15.6 ms" />
              <KV k="Measured Jitter:" v="0.42 ms" />
            </div>
            <div className="flex items-center justify-center text-cyan">→</div>
            <div className="rounded-lg border border-success/30 bg-window p-3">
              <Label className="mb-2 text-success">AFTER OPTIMIZATION</Label>
              <KV k="Polling Rate:" v="1000 Hz" />
              <KV k="Timer Resolution:" v="0.5 ms" />
              <KV k="Measured Jitter:" v="0.08 ms" />
            </div>
          </Cols>
        </Details>
      </Card>
      <SimNotice />
    </div>
  );
}

/* ───────── SYSTEM TELEMETRY ───────── */
export function SystemInfoPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="System Telemetry"
        badges={<Badge tone="cyan">HARDWARE & DIAGNOSTICS</Badge>}
        sub="Sample hardware, performance and system health diagnostics."
        actions={<Btn onClick={() => simulate("Refresh telemetry")}>Refresh</Btn>}
      />
      <HealthCheck />
      <TelemetryConsole />
      <Card>
        <SectionTitle title="SAMPLE HARDWARE" />
        <div className="grid grid-cols-3 gap-x-3.5">
          {[
            ["PROCESSOR (CPU)", HW.cpu, HW.cpuSub],
            ["GRAPHICS (GPU)", HW.gpu, HW.gpuSub],
            ["SYSTEM MEMORY", HW.ram, HW.ramSub],
            ["PRIMARY STORAGE", HW.storage, HW.storageSub],
            ["WINDOWS OS", HW.os, "Build 26100 · x64"],
            ["POWER & CHASSIS", "Desktop · AC power", "Ultimate Performance plan"],
          ].map(([a, b, c]) => (
            <div key={a} className="min-w-0 border-b border-border py-3">
              <Label className="text-cyan">{a}</Label>
              <div className="mt-2 text-sm font-bold">{b}</div>
              <div className="text-[11.5px] text-muted-foreground">{c}</div>
            </div>
          ))}
        </div>
        <Details inline title="Technical inventory" hint="Architecture, firmware and connectivity">
          <Cols cols="minmax(0, 1fr) minmax(0, 1fr)" gap={14}>
            <div>
              <Label className="mb-2 text-cyan">PROCESSOR (CPU) ARCHITECTURE</Label>
              <KV k="Physical Cores / Threads:" v="8 Cores / 16 Threads" />
              <KV k="Base / Max Frequency:" v="4.2 / 5.0 GHz" />
              <KV k="Level 3 (L3) Cache:" v="96 MB" />
              <KV k="Virtualization (VT-x / AMD-V):" v="Enabled" />
            </div>
            <div>
              <Label className="mb-2 text-cyan">SYSTEM MEMORY (RAM)</Label>
              <Bar value={38} className="mb-2" />
              <KV k="Memory Speed & Type:" v="DDR5-6000" />
              <KV k="Channel Mode:" v="Dual" />
              <KV k="Available Free RAM:" v="19.8 GB" />
              <KV k="Virtual Memory Headroom:" v="Ample" />
            </div>
            <div>
              <Label className="mb-2 text-cyan">MOTHERBOARD & FIRMWARE</Label>
              <KV k="Manufacturer & Model:" v="Sample X670E" />
              <KV k="BIOS Version & Vendor:" v="F12 · AMI" />
              <KV k="Firmware Architecture:" v="UEFI" />
              <KV k="TPM Hardware Security:" v="2.0" />
            </div>
            <div>
              <Label className="mb-2 text-cyan">SECURITY & SYSTEM INTEGRITY</Label>
              <KV k="UEFI Secure Boot:" v="On" />
              <KV k="TPM 2.0 Cryptography:" v="Ready" />
              <KV k="Microsoft Defender:" v="Active" />
              <KV k="Core Isolation (HVCI):" v="Off" />
            </div>
            <div>
              <Label className="mb-2 text-cyan">POWER & CHASSIS</Label>
              <KV k="Power Source:" v="AC" />
              <KV k="Battery Charge & Health:" v="N/A" />
              <KV k="Active Power Plan:" v="Ultimate Performance" />
            </div>
            <div>
              <Label className="mb-2 text-cyan">NETWORK & CONNECTIVITY</Label>
              <KV k="Active Interface:" v="Ethernet" />
              <KV k="Connection Type / Speed:" v="2.5 Gbps" />
              <KV k="IPv4 Address:" v="192.168.1.24" />
            </div>
          </Cols>
        </Details>
      </Card>
      <SimNotice />
    </div>
  );
}

/* ───────── REGISTRY INTELLIGENCE ───────── */
const REG_CATS = [
  "ALL",
  "RECOMMENDED",
  "OPTIMIZED",
  "NOT APPLICABLE",
  "CPU",
  "MEMORY",
  "NETWORK",
  "GAMING",
  "GPU",
  "PRIVACY",
  "TELEMETRY",
  "INPUT",
  "POWER",
  "NTFS",
  "SYSTEM",
];
const REG_LIST = CATALOG.map((c, i) => ({
  ...c,
  state: i % 5 === 0 ? "OPTIMIZED" : i % 7 === 0 ? "NOT APPLICABLE" : "PENDING",
}));
// Already-optimized rows are not re-selected; not-applicable rows can never be selected.
// Eligible catalog items are automatically recommended in Normal mode regardless of risk.
const REG_ITEMS = REG_LIST.map((i) => ({
  id: i.id,
  risk: i.risk,
  done: i.state === "OPTIMIZED",
  unsupported: i.state === "NOT APPLICABLE",
  recommended: true,
}));
const REG_RECOMMENDED = eligibleSelection(REG_ITEMS);
export function RegistryTweakPage() {
  const [cat, setCat] = useState("ALL");
  const [q, setQ] = useState("");
  const reg = useModedSelection("registry-tweak", REG_ITEMS);
  const { sel } = reg;
  const [detail, setDetail] = useState<(typeof CATALOG)[number] | null>(null);
  const [run, setRun] = useState(false);
  const list = REG_LIST;
  const vis = list.filter(
    (i) =>
      (cat === "ALL" || i.cat === cat || i.state === cat) &&
      i.name.toLowerCase().includes(q.toLowerCase()),
  );

  const eligibleList = list.filter((i) => sel.has(i.id));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Registry Intelligence"
        badges={
          <>
            <Badge tone="cyan">LOW LATENCY & SCHEDULING</Badge>
            <Badge tone="success">ELIGIBLE OPTIMIZATIONS ONLY</Badge>
          </>
        }
        sub="Simulated registry tuning for scheduling, memory, gaming and privacy · Eligible-only execution."
      />
      <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2">
          <Btn size="sm" variant="ghost" onClick={() => simulate("Refresh")}>
            Refresh
          </Btn>
          <Badge tone="cyan" className="text-[10px] font-bold uppercase tracking-wider">
            ELIGIBLE OPTIMIZATIONS ONLY
          </Badge>
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          Authoritative catalog · all eligible items auto-selected by system compatibility.
        </p>
      </Card>

      <StatTiles
        items={[
          { label: "DEMO HEALTH", value: "86%", tone: "success" },
          { label: "TOTAL", value: list.length },
          { label: "APPLICABLE", value: list.length - 3, tone: "cyan" },
          { label: "AUTO-SELECTED", value: sel.size, tone: "success" },
          { label: "OPTIMIZED", value: 6, tone: "success" },
          { label: "NOT APPLICABLE", value: 3 },
          { label: "FAILED", value: 0, tone: "danger" },
        ]}
      />

      <Card>
        <div className="mb-3">
          <SearchBox
            placeholder="🔍 Search registry optimizations..."
            value={q}
            onChange={setQ}
          />
        </div>
        <Chips options={REG_CATS} value={cat} onChange={setCat} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
          <div className="flex items-center gap-2">
            <Badge tone="success" className="text-[10px] font-bold tracking-wider">
              AUTO-SELECTED — ELIGIBLE
            </Badge>
            <span className="text-[11.5px] text-muted-foreground">
              <b className="text-foreground tabular-nums font-bold">{sel.size}</b> eligible tweaks queued
            </span>
          </div>
          <Btn size="sm" variant="primary" disabled={!sel.size} onClick={() => setRun(true)}>
            Apply eligible tweaks ({sel.size})
          </Btn>
        </div>
      </Card>

      <Card>
        <Label className="mb-3 text-foreground">REGISTRY OPTIMIZATION TARGETS</Label>
        <div className="space-y-1.5">
          {vis.map((i) => {
            const isEligible = sel.has(i.id);
            const isOptimized = i.state === "OPTIMIZED";

            return (
              <div
                key={i.id}
                className="flex items-center gap-3 eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
              >
                <span
                  className={cn(
                    "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                    isEligible
                      ? "border-cyan bg-cyan text-sidebar-primary-foreground shadow-sm"
                      : "border-border bg-window text-subtle",
                  )}
                  aria-hidden="true"
                >
                  {isEligible ? (
                    <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
                  ) : (
                    <Lock className="h-2.5 w-2.5" />
                  )}
                </span>
                <button
                  type="button"
                  className="flex-1 text-left font-medium hover:text-cyan"
                  onClick={() => setDetail(i)}
                >
                  {i.name}
                </button>
                <Badge>{i.cat}</Badge>
                {isEligible ? (
                  <Badge tone="success" className="text-[9.5px] font-bold tracking-wider">
                    AUTO-SELECTED — ELIGIBLE
                  </Badge>
                ) : isOptimized ? (
                  <Badge tone="muted" className="text-[9.5px] font-semibold">
                    ALREADY APPLIED
                  </Badge>
                ) : (
                  <Badge tone="muted" className="text-[9.5px] font-semibold">
                    NOT APPLICABLE
                  </Badge>
                )}
                <RiskBadge risk={i.risk} />
                <Btn size="sm" variant="ghost" onClick={() => setDetail(i)}>
                  Details
                </Btn>
              </div>
            );
          })}
        </div>
      </Card>

      <SimNotice />
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Optimization transparency details"
        sub={detail?.name}
        footer={<Btn onClick={() => setDetail(null)}>Close</Btn>}
      >
        {detail && (
          <div className="space-y-3">
            <KV k="Purpose & Description:" v={detail.name} />
            <KV k="Risk:" v={<RiskBadge risk={detail.risk} />} />
            <Details title="TECHNICAL REGISTRY LOCATION">
              <p className="font-mono text-[11px] text-muted-foreground">
                Optimization ID: {detail.id}
                <br />
                Exact key path is resolved at runtime by the native engine.
              </p>
            </Details>
            <Cols cols="minmax(0, 1fr) minmax(0, 1fr)" gap={14} className="items-stretch">
              <div className="rounded-lg border border-border bg-window p-3">
                <Label>Current State (sample)</Label>
                <div className="mt-1 text-sm">Runtime value</div>
              </div>
              <div className="rounded-lg border border-success/30 bg-window p-3">
                <Label className="text-success">Optimization Target</Label>
                <div className="mt-1 text-sm">Optimized value</div>
              </div>
            </Cols>
          </div>
        )}
      </Modal>
      <RunModal
        open={run}
        onClose={() => setRun(false)}
        profile="Registry Intelligence"
        count={eligibleList.length}
        items={eligibleList.map((i) => ({ id: i.id, title: i.name, risk: i.risk }))}
      />
    </div>
  );
}

/* ───────── REGISTRY VALUES (overview host: RAM | GPU) ───────── */
// Data: src/lib/eo/registryValues.ts (transcribed from the WPF RAM and GPU registry engines).
function RegValueBadge({ v }: { v: RegistryValueEntry }) {
  if (v.status === "diagnostic") return <Badge>READ-ONLY</Badge>;
  if (v.status === "not-applicable") return <Badge>N/A</Badge>;
  if (v.risk === "EXPERIMENTAL") return <Badge tone="warning">EXPERIMENTAL</Badge>;
  return <RiskBadge risk={v.risk === "DIAGNOSTIC" ? "LOW" : v.risk} />;
}

function RegTableHead() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-3 border-b border-border px-2.5 pb-1.5 eo-label text-[9px] text-muted-foreground"
      style={{ gridTemplateColumns: REG_ROW_COLS }}
    >
      <span>Value</span>
      <span>Sample target · current</span>
      <span className="text-right">Risk</span>
    </div>
  );
}

const REG_ROW_COLS = "minmax(0, 1.35fr) minmax(0, 1fr) 84px";

function RegRow({ v, onOpen }: { v: RegistryValueEntry; onOpen: (v: RegistryValueEntry) => void }) {
  const off = v.status !== "applicable";
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(v)}
        aria-label={`${v.title} (${v.valueName}) — details`}
        className={cn(
          "grid w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-highlight focus-visible:bg-highlight",
          off && "text-muted-foreground",
        )}
        style={{ gridTemplateColumns: REG_ROW_COLS }}
      >
        <span className="min-w-0">
          <span
            className={cn("block truncate text-[12px] font-semibold", !off && "text-foreground")}
            title={v.title}
          >
            {v.title}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
            <span className="truncate">{v.valueName}</span>
            {v.restart && v.status === "applicable" && (
              <RotateCcw
                aria-label="Restart required"
                className="h-2.5 w-2.5 shrink-0 text-warning"
              />
            )}
          </span>
        </span>
        <span className="min-w-0 font-mono text-[10.5px]">
          <span
            className={cn("block truncate", off ? "text-muted-foreground" : "text-cyan")}
            title={v.target}
          >
            {v.target}
          </span>
          <span className="block truncate text-muted-foreground" title={v.current}>
            {v.current}
          </span>
        </span>
        <span className="flex justify-end">
          <RegValueBadge v={v} />
        </span>
      </button>
    </li>
  );
}

function RegGroup({
  group,
  values,
  onOpen,
  badge,
}: {
  group: RegistryGroup;
  values: RegistryValueEntry[];
  onOpen: (v: RegistryValueEntry) => void;
  badge?: ReactNode;
}) {
  return (
    <section aria-label={group.title} className="space-y-1">
      <div className="flex flex-wrap items-center gap-2 px-2.5 pt-2">
        <h3 className="text-[11px] font-bold tracking-wide text-foreground uppercase">
          {group.title}
        </h3>
        <Badge tone="cyan">{group.tag}</Badge>
        {badge}
        <span className="ml-auto text-[10.5px] text-muted-foreground">
          {values.length} {values.length === 1 ? "value" : "values"}
        </span>
      </div>
      {group.note && <p className="px-2.5 text-[11px] text-muted-foreground">{group.note}</p>}
      <ul className="divide-y divide-border/60">
        {values.map((v) => (
          <RegRow key={v.id} v={v} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}

const NATIVE_STEPS: [string, string][] = [
  ["Read", "Current value is read back before anything is offered."],
  ["Back up", "A snapshot of the previous value is saved before a write."],
  ["Write & verify", "The value is written, then read back to confirm it stuck."],
  [
    "Restart & check",
    "Restart-bound values are re-checked after the next boot; rollback stays available.",
  ],
];

export function RegistryValuesPage() {
  const [detail, setDetail] = useState<RegistryValueEntry | null>(null);
  const ram = registrySummary(RAM_REGISTRY_VALUES);
  const gpu = registrySummary(GPU_REGISTRY_VALUES);
  const hw = SAMPLE_REGISTRY_HW;
  const sampleTier = nearestRamTier(hw.ramGb);
  const gpuVendorGroups = GPU_REG_GROUPS.filter((g) => g.key !== "diagnostic");
  const diagGroup = GPU_REG_GROUPS.find((g) => g.key === "diagnostic");
  const isGpu = detail ? GPU_REGISTRY_VALUES.includes(detail) : false;
  const vendorBadge = (key: string) => {
    if (key === "nvidia")
      return hw.gpuVendor === "NVIDIA" ? (
        <Badge tone="success">IN SAMPLE</Badge>
      ) : (
        <Badge>NOT IN SAMPLE</Badge>
      );
    if (key === "amd")
      return hw.gpuVendor === "AMD" ? (
        <Badge tone="success">IN SAMPLE</Badge>
      ) : (
        <Badge>NOT IN SAMPLE</Badge>
      );
    return undefined;
  };
  return (
    <div className="space-y-4">
      <PageHeader
        title="Registry Values"
        sub="Hardware-aware RAM and GPU registry values, matched to sample hardware."
        actions={
          <>
            <Link to="/$page" params={{ page: "registry-values-ram" }}>
              <Btn size="sm">RAM page →</Btn>
            </Link>
            <Link to="/$page" params={{ page: "gpu-registry-values" }}>
              <Btn size="sm">GPU page →</Btn>
            </Link>
          </>
        }
      />
      <SimNotice>
        SAMPLE DATA: values are computed for sample hardware ({hw.ramGb} GB RAM · {hw.gpuName} ·{" "}
        {hw.laptop ? "laptop" : "desktop"} · {hw.profile} profile). No Windows registry is read or
        written.
      </SimNotice>
      <StatTiles
        items={[
          { label: "RAM VALUES", value: ram.total, sub: `${ram.applicable} applicable` },
          { label: "GPU VALUES", value: gpu.total, sub: `${gpu.applicable} applicable` },
          {
            label: "NOT APPLICABLE",
            value: ram.notApplicable + gpu.notApplicable,
            sub: "Hardware or profile gate",
          },
          { label: "READ-ONLY", value: gpu.diagnostic, sub: "Diagnostic, never applied" },
          {
            label: "NEED RESTART",
            value: ram.restart + gpu.restart,
            sub: "Of applicable values",
            tone: "warning",
          },
        ]}
      />
      {/* Landing overview: two balanced families, groups collapsed; every value stays one click away. */}
      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-2">
        {(
          [
            {
              key: "ram",
              title: "RAM REGISTRY VALUES",
              guide: "registry.ram-values" as const,
              sub: `Machine values · sample ${hw.ramGb} GB RAM, ${hw.logicalCores} threads`,
              page: "registry-values-ram",
              sum: ram,
              groups: RAM_GROUPS.map((g) => ({
                g,
                values: valuesInGroup(RAM_REGISTRY_VALUES, g.key),
                badge: undefined as ReactNode,
              })),
            },
            {
              key: "gpu",
              title: "GPU REGISTRY VALUES",
              guide: "gpu.groups" as const,
              sub: `Sample ${hw.gpuName} · ${hw.gpuCount} GPU · HAGS ${hw.supportsHags ? "supported" : "unsupported"}`,
              page: "gpu-registry-values",
              sum: gpu,
              groups: [...gpuVendorGroups, ...(diagGroup ? [diagGroup] : [])].map((g) => ({
                g,
                values: valuesInGroup(GPU_REGISTRY_VALUES, g.key),
                badge: vendorBadge(g.key),
              })),
            },
          ] as const
        ).map((fam) => (
          <Card key={fam.key} className="eo-rv-family">
            <SectionTitle
              title={fam.title}
              guide={fam.guide}
              sub={fam.sub}
              right={
                <Link to="/$page" params={{ page: fam.page }}>
                  <Btn size="sm" variant="ghost">
                    Full page →
                  </Btn>
                </Link>
              }
            />
            <dl className="eo-rv-mini">
              {(
                [
                  ["Values", fam.sum.total, "muted"],
                  ["Applicable", fam.sum.applicable, "success"],
                  ["Restart", fam.sum.restart, "warning"],
                  ["Gated", fam.sum.notApplicable + fam.sum.diagnostic, "muted"],
                ] as const
              ).map(([l, v, t]) => (
                <div key={l} data-tone={t}>
                  <dt className="eo-label text-[9px] text-muted-foreground">{l}</dt>
                  <dd className="eo-stat-value text-[18px] tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 divide-y divide-border/60">
              {fam.groups.map(({ g, values, badge }) => {
                const ok = values.filter((v) => v.status === "applicable").length;
                return (
                  <Details
                    key={g.key}
                    inline
                    title={g.title.toUpperCase()}
                    hint={`${ok}/${values.length} applicable · ${g.tag}`}
                  >
                    {(badge || g.note) && (
                      <div className="flex flex-wrap items-center gap-2 px-2.5 pb-1">
                        {badge}
                        {g.note && (
                          <span className="text-[11px] text-muted-foreground">{g.note}</span>
                        )}
                      </div>
                    )}
                    <RegTableHead />
                    <ul className="divide-y divide-border/60">
                      {values.map((v) => (
                        <RegRow key={v.id} v={v} onOpen={setDetail} />
                      ))}
                    </ul>
                  </Details>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <SectionTitle
          title="TECHNICAL REFERENCE"
          sub="Service Host tiers and how the native engine applies values"
        />
        <div className="divide-y divide-border/60">
          <Details
            inline
            title="SERVICE HOST THRESHOLD BY RAM TIER"
            hint={`SvcHostSplitThresholdInKB · sample tier ${sampleTier} GB`}
          >
            <table className="w-full text-[11.5px]">
              <caption className="sr-only">Service Host split threshold for each RAM tier</caption>
              <thead>
                <tr className="eo-label text-left text-[9px] text-muted-foreground">
                  <th scope="col" className="border-b border-border px-2.5 pb-1.5 font-semibold">
                    RAM tier
                  </th>
                  <th scope="col" className="border-b border-border px-2.5 pb-1.5 font-semibold">
                    DWORD
                  </th>
                  <th
                    scope="col"
                    className="border-b border-border px-2.5 pb-1.5 text-right font-semibold"
                  >
                    Threshold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {RAM_TIER_MAP.map(([gb, dword]) => {
                  const sample = gb === sampleTier;
                  return (
                    <tr
                      key={gb}
                      className={cn(
                        "transition-colors duration-150 hover:bg-highlight",
                        sample && "bg-cyan/5",
                      )}
                    >
                      <td className="px-2.5 py-1.5 font-semibold">
                        {gb} GB{" "}
                        {sample && (
                          <Badge tone="cyan" className="ml-1.5 align-middle">
                            SAMPLE
                          </Badge>
                        )}
                      </td>
                      <td
                        className={cn(
                          "px-2.5 py-1.5 font-mono text-[10.5px]",
                          sample && "text-cyan",
                        )}
                      >
                        {hex8(dword)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono text-[10.5px] text-muted-foreground">
                        {dword.toLocaleString("en-US")} KB
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 px-2.5 text-[11px] text-muted-foreground">
              Unset default: {hex8(SVCHOST_DEFAULT_KB)} (
              {SVCHOST_DEFAULT_KB.toLocaleString("en-US")} KB).
            </p>
          </Details>
          <Details
            inline
            title="HOW THE NATIVE ENGINE APPLIES VALUES"
            hint="Not run in this prototype"
          >
            <ol className="grid gap-2 sm:grid-cols-2">
              {NATIVE_STEPS.map(([k, d], i) => (
                <li key={k} className="flex gap-2.5 text-[11.5px]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan/40 font-mono text-[10px] text-cyan">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">{k}.</span>{" "}
                    <span className="text-muted-foreground">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Details>
        </div>
      </Card>
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? "Registry value"}
        sub={detail ? `${isGpu ? "GPU" : "RAM"} registry value · sample data` : undefined}
        footer={
          <>
            <Link
              to="/$page"
              params={{ page: isGpu ? "gpu-registry-values" : "registry-values-ram" }}
            >
              <Btn size="sm">{isGpu ? "Open GPU page" : "Open RAM page"}</Btn>
            </Link>
            <Btn variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Btn>
          </>
        }
      >
        {detail && (
          <div className="space-y-3">
            <p className="text-[12.5px] text-muted-foreground">{detail.description}</p>
            <div className="flex flex-wrap gap-1.5">
              <RegValueBadge v={detail} />
              {detail.restart && <Badge tone="warning">RESTART REQUIRED</Badge>}
              <Badge tone="cyan">{detail.category}</Badge>
            </div>
            <Cols cols="minmax(0, 1fr) minmax(0, 1fr)" gap={10} className="items-stretch">
              <div className="rounded-lg border border-border bg-window p-3">
                <Label>Current (sample)</Label>
                <div className="mt-1 font-mono text-[12px]">{detail.current}</div>
              </div>
              <div className="rounded-lg border border-success/30 bg-window p-3">
                <Label className="text-success">Target (sample)</Label>
                <div className="mt-1 font-mono text-[12px]">{detail.target}</div>
              </div>
            </Cols>
            <div>
              <KV k="Value name:" v={detail.valueName} mono />
              <KV k="Type:" v={detail.type} mono />
              <KV k="Registry path:" v={<span className="break-all">{detail.path}</span>} mono />
              <KV k="Hardware:" v={detail.hardware} />
              {detail.driver && <KV k="Driver:" v={detail.driver} />}
              <KV k="Sample applicability:" v={detail.reason} />
            </div>
            {detail.path.includes("<adapter>") && (
              <p className="text-[11px] text-muted-foreground">
                {"<adapter>"} is the display adapter subkey (for example 0000), resolved at runtime.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

const RAM_SIZES = [4, 8, 12, 16, 24, 32, 48, 64, 128];
export function RegistryValuesRamPage() {
  const [ram, setRam] = useState(32);
  const [open, setOpen] = useState(false);
  const kb = ram * 1024 * 1024;
  return (
    <div className="space-y-4">
      <PageHeader
        title="RAM Registry Values"
        sub="Preview the Service Host split threshold for sample RAM configurations."
        actions={
          <>
            <Link to="/$page" params={{ page: "registry-values" }}>
              <Btn size="sm" variant="ghost">
                ← Registry Values
              </Btn>
            </Link>
            <Btn onClick={() => simulate("Rescan registry")}>Rescan registry</Btn>
          </>
        }
      />
      <Card className="flex items-center justify-between">
        <div>
          <Label>TARGET VALUE</Label>
          <div className="mt-1 text-sm font-semibold">Service Host split threshold</div>
        </div>
        <Btn size="sm" variant="ghost" onClick={() => setOpen(true)}>
          Details
        </Btn>
      </Card>
      <Cols cols="minmax(0, 1fr) minmax(0, 1fr)" gap={14} className="items-stretch">
        <Card>
          <SectionTitle title="CHOOSE YOUR RAM SIZE" guide="ram.size" />
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            Select the physical RAM installed in your system.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <PremiumSelect
                label="Installed RAM size"
                value={String(ram)}
                onChange={(v) => setRam(+v)}
                options={RAM_SIZES.map((r) => ({ value: String(r), label: `${r} GB` }))}
              />
            </div>
            <Badge tone="cyan">Demo: 32 GB</Badge>
          </div>
          {ram !== 32 && (
            <p className="mt-2 text-[11.5px] text-warning">
              ⚠️ Selected RAM differs from sample hardware. Verify before applying.
            </p>
          )}
          <div className="mt-4 rounded-lg border border-border bg-window p-3">
            <Label className="mb-1">TARGET CONFIGURATION</Label>
            <KV k="Hex Value:" v={`0x${kb.toString(16).toUpperCase()}`} mono />
            <KV k="Decimal KB:" v={kb.toLocaleString()} mono />
            <KV k="Formula:" v={`${ram} GB × 1024 × 1024`} mono />
          </div>
        </Card>
        <Card>
          <SectionTitle title="CURRENT REGISTRY STATE" />
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            Sample registry readback; no live Windows access.
          </p>
          <div className="rounded-lg border border-border bg-window p-3">
            <Label className="mb-1">READBACK VALUE</Label>
            <KV k="Hex Value:" v="0x380000" mono />
            <KV k="Decimal KB:" v="3,670,016" mono />
          </div>
          <div className="mt-3">
            <StatTiles
              items={[
                { label: "SAMPLE INSTANCES", value: "74" },
                { label: "SAMPLE RAM USAGE", value: "1.1 GB" },
              ]}
            />
          </div>
        </Card>
      </Cols>
      <Card className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Btn variant="primary" onClick={() => simulate("Apply value")}>
            Apply value
          </Btn>
          <Btn onClick={() => simulate("Restore previous")}>Restore previous</Btn>
          <Btn variant="ghost" onClick={() => setRam(32)}>
            Reset selection
          </Btn>
        </div>
        <Btn variant="ghost" onClick={() => simulate("Schedule restart")}>
          Schedule restart
        </Btn>
      </Card>
      <SimNotice />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Technical value specification"
        footer={<Btn onClick={() => setOpen(false)}>Close details</Btn>}
      >
        {[
          ["Registry Path", "HKLM\\SYSTEM\\CurrentControlSet\\Control"],
          ["Value Name", "SvcHostSplitThresholdInKB"],
          ["Value Type", "REG_DWORD"],
          ["What It Controls", "Changes the configured Service Host split threshold."],
          ["Selected RAM Mapping", `${ram} GB`],
          ["Target Value", kb.toLocaleString() + " KB"],
          ["Backup State", "Automatic snapshot created prior to registry write."],
          ["Restart Requirement", "Requires Windows restart for full system effect."],
          ["Verification State", "Immediate readback verification required on write."],
        ].map(([k, v]) => (
          <div
            key={k}
            className="grid border-b border-border py-2 text-[12.5px]"
            style={{ gridTemplateColumns: "160px 1fr" }}
          >
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono text-[11.5px]">{v}</span>
          </div>
        ))}
      </Modal>
    </div>
  );
}

const GPU_GROUPS = [
  {
    name: "UNIVERSAL GPU",
    tag: "SYSTEM-WIDE",
    detected: true,
    items: [
      "Hardware-Accelerated GPU Scheduling (HAGS)",
      "GPU priority for games (MMCSS)",
      "TDR delay calibration",
    ],
  },
  {
    name: "NVIDIA GPU",
    tag: "GEFORCE / RTX",
    detected: true,
    items: ["NVIDIA PowerMizer Maximum Performance Mode", "Disable NVIDIA telemetry container"],
  },
  {
    name: "AMD GPU",
    tag: "RADEON / ADRENALIN",
    detected: false,
    items: ["AMD Radeon ULPS Disable", "AMD shader cache mode"],
  },
];
const GPU_ITEMS = GPU_GROUPS.flatMap((g) =>
  g.items.map((id) => ({ id, risk: "MEDIUM" as const, unsupported: !g.detected })),
);

export function GpuRegistryValuesPage() {
  const [policy, setPolicy] = useState("Recommended");
  // Each profile policy keeps its own selection; undetected vendors are never selectable.
  const gpu = useModedSelection(`gpu:${policy}`, GPU_ITEMS);
  const { sel, setSel } = gpu;
  const [detail, setDetail] = useState<string | null>(null);
  const groups = GPU_GROUPS;
  return (
    <div className="space-y-4">
      <PageHeader
        title="GPU Registry Values"
        sub="Hardware-aware GPU registry configuration, optimization and verification."
        actions={
          <>
            <Link to="/$page" params={{ page: "registry-values" }}>
              <Btn size="sm" variant="ghost">
                ← Registry Values
              </Btn>
            </Link>
            <Btn onClick={() => simulate("Rescan GPU")}>Rescan GPU</Btn>
            <Btn variant="primary" onClick={() => simulate("Apply all recommended")}>
              Apply all recommended
            </Btn>
          </>
        }
      />
      <Card>
        <Label className="mb-3 text-foreground">SAMPLE GRAPHICS HARDWARE</Label>
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1.1fr 1.1fr 1.8fr" }}>
          {[
            ["GPU Vendor", "NVIDIA"],
            ["Driver Version & Date", "566.36 · 2026-10"],
            ["WDDM Architecture", "WDDM 3.2"],
            ["OS Environment", HW.os],
          ].map(([k, v]) => (
            <div key={k}>
              <Label className="text-[9px]">{k}</Label>
              <div className="mt-0.5 text-sm font-semibold">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Badge tone="success">Sample hardware profile</Badge>
        </div>
      </Card>
      <Card className="flex items-center gap-3 py-3">
        <Label>PROFILE POLICY:</Label>
        <div className="w-48">
          <PremiumSelect
            size="sm"
            label="GPU profile policy"
            value={policy}
            onChange={setPolicy}
            options={["Recommended", "Performance", "Conservative"]}
          />
        </div>
      </Card>
      <SectionTitle
        title="HARDWARE-AWARE OPTIMIZATION GROUPS"
        guide="gpu.groups"
        right={
          <>
            <SelectionBar
              count={sel.size}
              total={gpu.eligibleCount}
              onAll={gpu.selectAll}
              onClear={() => setSel(new Set())}
              allLabel="Select all applicable"
              moded={gpu}
            />
            <Btn
              size="sm"
              variant="primary"
              disabled={!sel.size}
              onClick={() => simulate("Apply selected")}
            >
              Apply selected
            </Btn>
          </>
        }
      />
      {groups.map((g) => (
        <Card key={g.name} className={cn(!g.detected && "opacity-60")}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold text-foreground">{g.name}</h2>
            <Badge tone="cyan">{g.tag}</Badge>
            {!g.detected && <Badge>NOT IN SAMPLE</Badge>}
          </div>
          {!g.detected ? (
            <p className="text-xs text-muted-foreground">
              {g.name.split(" ")[0]} GPU is not part of the sample hardware. All{" "}
              {g.name.split(" ")[0]}-specific registry settings are skipped.
            </p>
          ) : (
            <div className="space-y-1.5">
              {g.items.map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
                >
                  <Check
                    on={sel.has(i)}
                    onChange={() =>
                      setSel((s) => {
                        return toggleInSet(s, i);
                      })
                    }
                  />
                  <span className="flex-1">{i}</span>
                  <RiskBadge risk="MEDIUM" />
                  <Btn size="sm" variant="ghost" onClick={() => setDetail(i)}>
                    Details
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
      <Card>
        <Details inline title="GPU diagnostic configuration" hint="Read-only">
          <p className="text-xs text-muted-foreground">
            Read-only diagnostic values. Never written.
          </p>
        </Details>
      </Card>
      <SimNotice />
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="GPU registry optimization"
        sub={detail ?? ""}
        footer={
          <>
            <Btn variant="primary" onClick={() => simulate("Apply")}>
              Apply
            </Btn>
            <Btn onClick={() => simulate("Restore")}>Restore</Btn>
            <Btn variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Btn>
          </>
        }
      >
        <Label className="mb-1 text-cyan">TECHNICAL SPECIFICATION</Label>
        <KV k="Optimization ID:" v="GPU.*" mono />
        <KV k="Registry Path:" v="Resolved at runtime" />
        <KV k="Hardware & Driver:" v="NVIDIA · 566.36" />
        <Label className="mt-4 mb-1 text-cyan">VALUE STATES</Label>
        <Cols cols="minmax(0, 1fr) minmax(0, 1fr)" gap={14} className="items-stretch">
          <div className="rounded-lg border border-border bg-window p-3 text-sm">
            Current Value: runtime
          </div>
          <div className="rounded-lg border border-success/30 bg-window p-3 text-sm">
            Target Calculated Value
          </div>
        </Cols>
        <Label className="mt-4 mb-1 text-cyan">SAFETY & VERIFICATION</Label>
        <KV k="Risk Classification:" v={<RiskBadge risk="MEDIUM" />} />
        <KV k="Restart Required:" v="Yes" />
        <KV k="Verification Method:" v="Readback" />
      </Modal>
    </div>
  );
}

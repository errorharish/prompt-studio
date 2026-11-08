// StartupManagerView, ServiceManagerView, NetworkView, StorageView, ToolsView, ProcessReductionView
import { useState, useMemo } from "react";
import { Check as CheckIcon, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import {
  Badge,
  Bar,
  Btn,
  Card,
  Check,
  Chips,
  Cols,
  Details,
  EmptyState,
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
  Toggle,
  simulate,
  useSimRun,
} from "../kit";
import { PremiumMultiSelect, PremiumSelect, FilterChip } from "../dropdown";
import {
  FILE_TYPES,
  MIN_SIZES,
  SORTS,
  filterFiles,
  type FileType,
  type SampleFile,
} from "@/lib/eo/fileFilters";
import { toggleInSet } from "@/lib/eo/selection";
import { cn } from "@/lib/utils";
import { useModedSelection, usePersistedSelection } from "../useSelection";

/* ───────── STARTUP MANAGER ───────── */
const STARTUP = [
  { name: "Steam Client Bootstrapper", pub: "Valve", impact: "HIGH", on: true, sys: false },
  { name: "Discord", pub: "Discord Inc.", impact: "HIGH", on: true, sys: false },
  { name: "Microsoft OneDrive", pub: "Microsoft", impact: "MEDIUM", on: true, sys: false },
  { name: "NVIDIA Display Container", pub: "NVIDIA", impact: "LOW", on: true, sys: true },
  { name: "Realtek Audio Console", pub: "Realtek", impact: "LOW", on: true, sys: true },
  { name: "Spotify", pub: "Spotify AB", impact: "MEDIUM", on: false, sys: false },
  { name: "Adobe Creative Cloud", pub: "Adobe", impact: "HIGH", on: true, sys: false },
  {
    name: "Windows Security notification",
    pub: "Microsoft",
    impact: "UNMEASURED",
    on: true,
    sys: true,
  },
];
export function StartupManagerPage() {
  const [items, setItems] = useState(STARTUP);
  const [f, setF] = useState("ALL");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<(typeof STARTUP)[number] | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const vis = items.filter(
    (i) =>
      i.name.toLowerCase().includes(q.toLowerCase()) &&
      (f === "ALL" ||
        (f === "ENABLED" && i.on) ||
        (f === "DISABLED" && !i.on) ||
        (f === "HIGH IMPACT" && i.impact === "HIGH") ||
        (f === "MEDIUM" && i.impact === "MEDIUM") ||
        (f === "LOW" && i.impact === "LOW") ||
        (f === "USER APPS" && !i.sys) ||
        (f === "SYSTEM" && i.sys) ||
        (f === "UNMEASURED" && i.impact === "UNMEASURED")),
  );
  const flip = (n: string) =>
    setItems((s) => s.map((i) => (i.name === n ? { ...i, on: !i.on } : i)));
  return (
    <div className="space-y-4">
      <PageHeader
        title="Startup Manager"
        badges={<Badge tone="cyan">BOOT ACCELERATION</Badge>}
        sub="Review sample startup apps and their boot impact."
        actions={<Btn onClick={() => simulate("Rescan startup")}>Rescan startup</Btn>}
      />
      <StatTiles
        items={[
          { label: "TOTAL APPS", value: items.length },
          { label: "ENABLED", value: items.filter((i) => i.on).length, tone: "success" },
          { label: "DISABLED", value: items.filter((i) => !i.on).length },
          {
            label: "HIGH IMPACT",
            value: items.filter((i) => i.impact === "HIGH").length,
            tone: "danger",
          },
          {
            label: "MEDIUM IMPACT",
            value: items.filter((i) => i.impact === "MEDIUM").length,
            tone: "warning",
          },
          {
            label: "LOW IMPACT",
            value: items.filter((i) => i.impact === "LOW").length,
            tone: "cyan",
          },
        ]}
      />
      <Card>
        <div className="mb-3">
          <SearchBox placeholder="Search startup items…" value={q} onChange={setQ} />
        </div>
        <Chips
          options={[
            "ALL",
            "ENABLED",
            "DISABLED",
            "HIGH IMPACT",
            "MEDIUM",
            "LOW",
            "USER APPS",
            "SYSTEM",
            "UNMEASURED",
          ]}
          value={f}
          onChange={setF}
        />
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <div
            className="grid items-center gap-3 bg-window px-3 py-2 text-[10px] font-bold tracking-wide text-subtle"
            style={{ gridTemplateColumns: "minmax(0, 1fr) 110px 100px 70px 40px" }}
          >
            <span>APPLICATION</span>
            <span>PUBLISHER</span>
            <span>IMPACT</span>
            <span>TYPE</span>
            <span>ON</span>
          </div>
          {vis.map((i) => (
            <div
              key={i.name}
              className="grid items-center gap-3 border-t border-border px-3 py-2 text-[12.5px]"
              style={{ gridTemplateColumns: "minmax(0, 1fr) 110px 100px 70px 40px" }}
            >
              <button
                className="min-w-0 text-left font-semibold hover:text-cyan"
                onClick={() => setDetail(i)}
              >
                {i.name}
              </button>
              <span className="text-muted-foreground">{i.pub}</span>
              <Badge
                tone={i.impact === "HIGH" ? "danger" : i.impact === "MEDIUM" ? "warning" : "muted"}
              >
                {i.impact}
              </Badge>
              {i.sys ? <Badge tone="cyan">SYSTEM</Badge> : <span />}
              <Toggle
                label={`Startup for ${i.name}`}
                on={i.on}
                onChange={() => (i.sys && i.on ? setConfirm(i.name) : flip(i.name))}
              />
            </div>
          ))}
          {!vis.length && (
            <EmptyState
              title="NO STARTUP ITEMS MATCH CRITERIA"
              sub="No startup applications or background entries match your current search."
              action={
                <Btn
                  size="sm"
                  onClick={() => {
                    setF("ALL");
                    setQ("");
                  }}
                >
                  Reset all filters
                </Btn>
              }
            />
          )}
        </div>
      </Card>
      <SimNotice />
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
        footer={<Btn onClick={() => setDetail(null)}>Close details</Btn>}
      >
        {detail && (
          <div className="space-y-4">
            <div>
              <Label className="mb-1 text-cyan">
                SECTION 1: APPLICATION IDENTITY & CLASSIFICATION
              </Label>
              <KV k="Category / Type" v={detail.sys ? "System component" : "User app"} />
              <KV k="Publisher" v={detail.pub} />
              <KV k="Disk file verification" v="Signed" />
            </div>
            <Details title="SECTION 2–3: STARTUP COMMAND, EXECUTION PATH & REGISTRY SOURCE">
              <p className="font-mono text-[11px] text-muted-foreground">
                Raw command line, executable path and Run-key location are shown here in the native
                app.
              </p>
            </Details>
            <div>
              <Label className="mb-1 text-cyan">SECTION 4: SYSTEM IMPACT & REQUIREMENTS</Label>
              <KV k="Boot impact" v={detail.impact} />
              <KV k="Elevated admin" v={detail.sys ? "Yes" : "No"} />
              <KV k="Restart required" v="No" />
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="⚠️ Disable system startup entry?"
        sub="Safety confirmation required"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                if (confirm) flip(confirm);
                setConfirm(null);
              }}
            >
              Disable anyway
            </Btn>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This entry is identified as an IMPORTANT SYSTEM OR DRIVER COMPONENT. Disabling it may
          affect hardware features.
        </p>
      </Modal>
    </div>
  );
}

/* ───────── SERVICE MANAGER ───────── */
const SERVICES = [
  {
    name: "Connected User Experiences and Telemetry",
    run: true,
    safety: "SAFE TO STOP",
    start: "Automatic",
    ms: true,
  },
  {
    name: "Windows Search",
    run: true,
    safety: "WITH CAUTION",
    start: "Automatic (Delayed)",
    ms: true,
  },
  { name: "Print Spooler", run: true, safety: "SAFE TO STOP", start: "Automatic", ms: true },
  {
    name: "Remote Procedure Call (RPC)",
    run: true,
    safety: "DO NOT STOP",
    start: "Automatic",
    ms: true,
  },
  { name: "Steam Client Service", run: false, safety: "SAFE TO STOP", start: "Manual", ms: false },
  { name: "Xbox Live Auth Manager", run: false, safety: "WITH CAUTION", start: "Manual", ms: true },
  { name: "Fax", run: false, safety: "SAFE TO STOP", start: "Disabled", ms: true },
];
export function ServiceManagerPage() {
  const [f, setF] = useState("ALL");
  const [q, setQ] = useState("");
  const [d, setD] = useState<(typeof SERVICES)[number] | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const vis = SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) &&
      (f === "ALL" ||
        (f === "RUNNING" && s.run) ||
        (f === "STOPPED" && !s.run) ||
        s.safety === f ||
        (f === "THIRD PARTY" && !s.ms) ||
        (f === "MICROSOFT" && s.ms) ||
        (f === "DISABLED" && s.start === "Disabled")),
  );
  const tone = (s: string) =>
    (s === "SAFE TO STOP" ? "success" : s === "WITH CAUTION" ? "warning" : "danger") as
      "success" | "warning" | "danger";
  return (
    <div className="space-y-4">
      <PageHeader
        title="Service Manager"
        sub="Review sample services, startup modes, and action safety."
        actions={<Btn onClick={() => simulate("Rescan services")}>Rescan services</Btn>}
      />
      <StatTiles
        items={[
          { label: "TOTAL SERVICES", value: 284 },
          { label: "RUNNING", value: 112, tone: "success" },
          { label: "STOPPED", value: 172 },
          { label: "SAFE TO STOP", value: 21, tone: "cyan" },
          { label: "WITH CAUTION", value: 34, tone: "warning" },
          { label: "DO NOT STOP", value: 57, tone: "danger" },
        ]}
      />
      <Card>
        <Cols cols="1fr auto" className="mb-3 items-center">
          <SearchBox placeholder="Search services…" value={q} onChange={setQ} />
          <span className="text-[10px] font-bold tracking-widest text-subtle">
            SORT: ACTION SAFETY · NAME · STATE · STARTUP · PUBLISHER
          </span>
        </Cols>
        <Chips
          options={[
            "ALL",
            "RUNNING",
            "STOPPED",
            "SAFE TO STOP",
            "WITH CAUTION",
            "THIRD PARTY",
            "MICROSOFT",
            "DISABLED",
          ]}
          value={f}
          onChange={setF}
        />
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <div
            className="grid items-center gap-3 bg-window px-3 py-2 text-[10px] font-bold tracking-wide text-subtle"
            style={{ gridTemplateColumns: "minmax(0, 1fr) 80px 130px 115px" }}
          >
            <span>SERVICE</span>
            <span>STATUS</span>
            <span>STARTUP</span>
            <span>SAFETY</span>
          </div>
          {vis.map((s) => (
            <button
              key={s.name}
              onClick={() => setD(s)}
              className="grid w-full items-center gap-3 border-t border-border px-3 py-2 text-left text-[12.5px] hover:bg-window"
              style={{ gridTemplateColumns: "minmax(0, 1fr) 80px 130px 115px" }}
            >
              <span className="font-semibold">{s.name}</span>
              <Badge tone={s.run ? "success" : "muted"}>{s.run ? "RUNNING" : "STOPPED"}</Badge>
              <span className="text-muted-foreground">{s.start}</span>
              <Badge tone={tone(s.safety)}>{s.safety}</Badge>
            </button>
          ))}
          {!vis.length && (
            <EmptyState
              title="NO SERVICES MATCH CRITERIA"
              sub="No Windows services match your current search query or filter selection."
              action={
                <Btn
                  size="sm"
                  onClick={() => {
                    setF("ALL");
                    setQ("");
                  }}
                >
                  Reset all filters
                </Btn>
              }
            />
          )}
        </div>
      </Card>
      <SimNotice />
      <Modal
        open={!!d}
        onClose={() => setD(null)}
        title={d?.name ?? ""}
        width="max-w-3xl"
        footer={
          <>
            <Btn onClick={() => simulate("Start")}>Start</Btn>
            <Btn
              variant={d?.safety === "DO NOT STOP" ? "ghost" : "danger"}
              disabled={d?.safety === "DO NOT STOP"}
              onClick={() => d && setConfirm(d.name)}
            >
              Stop
            </Btn>
            <Btn onClick={() => simulate("Restart")}>Restart</Btn>
            <Btn variant="ghost" onClick={() => setD(null)}>
              Close details
            </Btn>
          </>
        }
      >
        {d && (
          <div className="space-y-4">
            <div>
              <Label className="mb-1 text-cyan">SECTION 1: SERVICE IDENTITY & DESCRIPTION</Label>
              <Cols cols="1fr 1fr">
                <KV k="Publisher" v={d.ms ? "Microsoft" : "Third party"} />
                <KV k="Account context" v="LocalSystem" />
              </Cols>
            </div>
            <Details title="SECTION 2: BINARY & EXECUTION PATH">
              <p className="font-mono text-[11px] text-muted-foreground">
                Executable path and process type are shown here in the native app.
              </p>
            </Details>
            <div>
              <Label className="mb-1 text-cyan">SECTION 3: ACTION SAFETY & RISK ANALYSIS</Label>
              <Cols cols="1fr 1fr">
                <KV k="Windows critical service" v={d.safety === "DO NOT STOP" ? "Yes" : "No"} />
                <KV k="Microsoft signature" v={d.ms ? "Verified" : "—"} />
              </Cols>
            </div>
            <div>
              <Label className="mb-1 text-cyan">SECTION 4: DEPENDENCIES & ACTIVE DEPENDENTS</Label>
              <Cols cols="1fr 1fr">
                <KV k="Depends on" v="RPCSS" />
                <KV k="Active dependents" v="0" />
              </Cols>
            </div>
            <div>
              <Label className="mb-2 text-cyan">
                SECTION 5: STARTUP CONFIGURATION QUICK ACTIONS
              </Label>
              <div className="flex gap-1.5">
                {["AUTOMATIC", "AUTOMATIC (DELAYED)", "MANUAL", "DISABLED"].map((x) => (
                  <Btn key={x} size="sm" onClick={() => simulate(`Set startup ${x}`)}>
                    {x}
                  </Btn>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="⚠️ Action requires explicit user confirmation"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirm(null)}>
              Cancel (safe)
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                setConfirm(null);
                simulate(`Stop ${confirm}`);
              }}
            >
              Confirm & proceed
            </Btn>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Stopping “{confirm}” may affect dependent features.
        </p>
      </Modal>
    </div>
  );
}

/* ───────── NETWORK BOOST ───────── */
const NET = [
  ["Disable Multimedia Network Throttling Index", "MMCSS", "PENDING"],
  ["TCP Window Auto-Tuning Calibration (Normal)", "TCP/IP", "OPTIMIZED"],
  ["Receive Side Scaling (RSS)", "HARDWARE", "OPTIMIZED"],
  ["TCP ACK frequency", "TCP/IP", "PENDING"],
  ["Interrupt moderation", "HARDWARE", "PENDING"],
  ["System responsiveness reservation", "MMCSS", "PENDING"],
];
export function NetworkPage() {
  const [f, setF] = useState("ALL");
  const [q, setQ] = useState("");
  const t = useSimRun(3000);
  const [tested, setTested] = useState(false);
  const vis = NET.filter(
    (n) =>
      n[0]?.toLowerCase().includes(q.toLowerCase()) && (f === "ALL" || n[1] === f || n[2] === f),
  );
  return (
    <div className="space-y-4">
      <PageHeader
        title="Network Boost"
        sub="Inspect sample connectivity and simulate network optimization."
        actions={
          <>
            <Btn
              variant="primary"
              disabled={t.running}
              onClick={() => t.start(() => setTested(true))}
            >
              ⚡ Run network test
            </Btn>
            <Btn variant="ghost" onClick={() => simulate("Restore backup")}>
              ↺ Restore backup
            </Btn>
            <Btn variant="ghost" onClick={() => simulate("Refresh")}>
              ↻ Refresh
            </Btn>
          </>
        }
      />
      {t.running && <Bar value={t.progress ?? 0} />}
      <Card>
        <SectionTitle
          title="SAMPLE NETWORK OVERVIEW"
          sub="Ethernet · Realtek 2.5GbE · Connected"
          right={<Badge tone="success">ONLINE</Badge>}
        />
        <StatTiles
          items={[
            { label: "LATENCY", value: tested ? "11 ms" : "—" },
            { label: "JITTER", value: tested ? "1.4 ms" : "—" },
            { label: "LOSS", value: tested ? "0%" : "—" },
            { label: "DNS TIME", value: tested ? "9 ms" : "—" },
            { label: "DOWN · Mbps", value: tested ? "912" : "—", tone: "cyan" },
            { label: "UP · Mbps", value: tested ? "486" : "—", tone: "cyan" },
          ]}
        />
        <Details inline title="Interface & target inventory" hint="2.5 Gbps · MTU 1500">
          <div className="grid grid-cols-2 gap-x-3.5">
            <KV k="Gateway · reachable" v="192.168.1.1" />
            <KV k="IPv4" v="192.168.1.24" />
            <KV k="DNS servers" v="1.1.1.1, 8.8.8.8" />
            <KV k="Target inventory" v="24 total · 22 supported · 18 applicable" />
            <KV k="Sample target status" v="4 pending · 14 optimized · 4 not applicable" />
          </div>
        </Details>
      </Card>
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-3.5">
          <SearchBox placeholder="Search network targets…" value={q} onChange={setQ} />
          <Chips
            options={["ALL", "TCP/IP", "MMCSS", "HARDWARE", "PENDING", "OPTIMIZED"]}
            value={f}
            onChange={setF}
          />
        </div>
        <SectionTitle
          title="PERSISTENT NETWORK TARGETS"
          guide="network.targets"
          sub="Simulated backup, apply, and readback; no settings change."
          right={
            <Btn variant="primary" onClick={() => simulate("Batch network optimization")}>
              Optimize all pending
            </Btn>
          }
        />
        <div className="space-y-1.5">
          {vis.map((n) => (
            <div
              key={n[0]}
              className="flex items-center justify-between eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
            >
              <span className="font-semibold">{n[0]}</span>
              <span className="flex gap-1.5">
                <Badge>{n[1]}</Badge>
                <Badge tone={n[2] === "OPTIMIZED" ? "success" : "warning"}>{n[2]}</Badge>
              </span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle title="ONE-TIME NETWORK ACTIONS & MAINTENANCE" guide="network.actions" />
        <div
          className="grid items-center gap-4 rounded-lg border border-border bg-window p-3"
          style={{ gridTemplateColumns: "auto 1fr auto auto" }}
        >
          <span className="text-xl">🌐</span>
          <div>
            <div className="text-[13px] font-semibold">
              DNS Resolver Cache Flush{" "}
              <span className="text-[11px] text-cyan">• Maintenance Action</span>
            </div>
            <p className="text-[11.5px] text-muted-foreground">
              Flushes and purges the Windows DNS client resolver cache to resolve domain lookup
              issues.
            </p>
          </div>
          <Badge>SESSION STATUS: READY</Badge>
          <Btn size="sm" onClick={() => simulate("Flush DNS cache")}>
            🚀 Flush DNS cache
          </Btn>
        </div>
      </Card>
      <SimNotice />
    </div>
  );
}

/* ───────── STORAGE OPTIMIZER (Unified Smart + Deep Clean) ───────── */
export interface StorageCleanItem {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  risk: Risk;
  category: "SMART" | "DEEP";
  eligible: boolean;
  status: "ELIGIBLE" | "ALREADY_CLEAN" | "PROTECTED";
  desc: string;
}

const STORAGE_CATALOG: StorageCleanItem[] = [
  // ── Smart Clean: Safe System & App Caches (~3.33 GB)
  {
    id: "win-temp",
    name: "Windows temporary files",
    size: "1.2 GB",
    sizeBytes: 1288490188,
    risk: "SAFE",
    category: "SMART",
    eligible: true,
    status: "ELIGIBLE",
    desc: "Application %TEMP% files, crash triage files and staging logs.",
  },
  {
    id: "shader-cache",
    name: "DirectX shader cache",
    size: "640 MB",
    sizeBytes: 671088640,
    risk: "SAFE",
    category: "SMART",
    eligible: true,
    status: "ELIGIBLE",
    desc: "DirectX 11/12 and Vulkan shader compile caches.",
  },
  {
    id: "win-update",
    name: "Windows Update cleanup",
    size: "1.1 GB",
    sizeBytes: 1181116006,
    risk: "SAFE",
    category: "SMART",
    eligible: true,
    status: "ELIGIBLE",
    desc: "Superseded update components and staging packages.",
  },
  {
    id: "thumb-cache",
    name: "Thumbnail & icon cache",
    size: "180 MB",
    sizeBytes: 188743680,
    risk: "SAFE",
    category: "SMART",
    eligible: true,
    status: "ELIGIBLE",
    desc: "Windows Explorer icon and thumbnail database.",
  },
  {
    id: "delivery-opt",
    name: "Delivery Optimization cache",
    size: "210 MB",
    sizeBytes: 220200960,
    risk: "SAFE",
    category: "SMART",
    eligible: true,
    status: "ELIGIBLE",
    desc: "Peer-to-peer distribution cache for updates and Store apps.",
  },

  // ── Deep Clean: Maintenance & Diagnostic Dumps (~887 MB)
  {
    id: "crash-dumps",
    name: "Crash dumps & error reports",
    size: "380 MB",
    sizeBytes: 398458880,
    risk: "LOW",
    category: "DEEP",
    eligible: true,
    status: "ELIGIBLE",
    desc: "Kernel MEMORY.DMP archives and Windows Error Reporting logs.",
  },
  {
    id: "sys-logs",
    name: "System diagnostic log archives",
    size: "95 MB",
    sizeBytes: 99614720,
    risk: "LOW",
    category: "DEEP",
    eligible: true,
    status: "ELIGIBLE",
    desc: "CBS and DISM log archives from past maintenance cycles.",
  },
  {
    id: "recycle-bin",
    name: "Recycle Bin (system drive)",
    size: "412 MB",
    sizeBytes: 432013312,
    risk: "MEDIUM",
    category: "DEEP",
    eligible: true,
    status: "ELIGIBLE",
    desc: "User-deleted files staged in $Recycle.Bin on drive C:.",
  },

  // ── Ineligible & Protected Categories (Exclusion Guarantee)
  {
    id: "browser-auth",
    name: "Browser session & authentication data",
    size: "—",
    sizeBytes: 0,
    risk: "PROTECTED",
    category: "SMART",
    eligible: false,
    status: "PROTECTED",
    desc: "Passwords, cookies, active sessions and personal documents are strictly protected.",
  },
  {
    id: "driver-store",
    name: "Active device driver store",
    size: "—",
    sizeBytes: 0,
    risk: "PROTECTED",
    category: "DEEP",
    eligible: false,
    status: "PROTECTED",
    desc: "Required hardware drivers and critical kernel firmware.",
  },
  {
    id: "branch-cache",
    name: "BranchCache peer staging",
    size: "0 B",
    sizeBytes: 0,
    risk: "SAFE",
    category: "DEEP",
    eligible: false,
    status: "ALREADY_CLEAN",
    desc: "Local BranchCache folder is already clean.",
  },
];

const SAMPLE_FILES: SampleFile[] = [
  {
    name: "gameplay_capture_0412.mp4",
    path: "D:\\Captures",
    sizeGb: 8.4,
    type: "Videos",
    modified: "2026-10-12",
  },
  {
    name: "win11_24h2.iso",
    path: "D:\\Downloads",
    sizeGb: 5.8,
    type: "ISO",
    modified: "2026-09-03",
  },
  {
    name: "project_backup.zip",
    path: "C:\\Users\\Demo",
    sizeGb: 2.1,
    type: "Archives",
    modified: "2026-10-28",
  },
  {
    name: "raw_photos_2026.cr3",
    path: "D:\\Pictures",
    sizeGb: 1.4,
    type: "Images",
    modified: "2026-08-19",
  },
  {
    name: "unreal_project",
    path: "C:\\Dev",
    sizeGb: 3.2,
    type: "Projects",
    modified: "2026-11-01",
  },
  {
    name: "setup_tools.exe",
    path: "C:\\Users\\Demo\\Downloads",
    sizeGb: 0.6,
    type: "Applications",
    modified: "2026-07-22",
  },
  {
    name: "podcast_master.wav",
    path: "D:\\Audio",
    sizeGb: 0.3,
    type: "Audio",
    modified: "2026-10-05",
  },
];

export function StoragePage() {
  const [fileSel, setFileSel] = useState<Set<string>>(new Set());
  const [drive, setDrive] = useState("All drives");
  const [minimum, setMinimum] = useState("100 MB");
  const [sortFiles, setSortFiles] = useState("Size");
  const [fileQuery, setFileQuery] = useState("");
  const [types, setTypes] = useState<Set<FileType>>(new Set());
  const [explorer, setExplorer] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Unified Storage Optimization Execution State
  const [unifiedModal, setUnifiedModal] = useState(false);
  const [unifiedProgress, setUnifiedProgress] = useState(0);
  const [unifiedRunning, setUnifiedRunning] = useState(false);
  const [unifiedStage, setUnifiedStage] = useState<
    "READY" | "ANALYZING" | "SMART_CLEAN" | "DEEP_CLEAN" | "COMPLETED"
  >("READY");

  const storageSel = useModedSelection("storage:unified", STORAGE_CATALOG);
  const selectedItems = useMemo(
    () => STORAGE_CATALOG.filter((i) => storageSel.sel.has(i.id)),
    [storageSel.sel],
  );
  const eligibleItems = useMemo(
    () => STORAGE_CATALOG.filter((i) => i.eligible),
    [],
  );
  const smartCleanItems = useMemo(
    () => STORAGE_CATALOG.filter((i) => i.category === "SMART"),
    [],
  );
  const deepCleanItems = useMemo(
    () => STORAGE_CATALOG.filter((i) => i.category === "DEEP"),
    [],
  );

  const totalReclaimableBytes = useMemo(
    () => selectedItems.reduce((acc, cur) => acc + cur.sizeBytes, 0),
    [selectedItems],
  );
  const totalReclaimableGB = (totalReclaimableBytes / (1024 * 1024 * 1024)).toFixed(2);

  const fileRows = SAMPLE_FILES.map((f) => [f.name, f.path, `${f.sizeGb} GB`, f.type, f.modified]);
  const visibleFiles = filterFiles(SAMPLE_FILES, {
    drive,
    minimum,
    sort: sortFiles,
    types,
    query: fileQuery,
  }).map((f) => [f.name, f.path, `${f.sizeGb} GB`, f.type, f.modified]);

  const handleStartUnifiedClean = () => {
    setUnifiedRunning(true);
    setUnifiedProgress(0);
    setUnifiedStage("ANALYZING");

    // Stepped prototype simulation: analyzes, smart clean, deep clean, completed
    setTimeout(() => {
      setUnifiedProgress(30);
      setUnifiedStage("SMART_CLEAN");
    }, 800);

    setTimeout(() => {
      setUnifiedProgress(70);
      setUnifiedStage("DEEP_CLEAN");
    }, 1700);

    setTimeout(() => {
      setUnifiedProgress(100);
      setUnifiedStage("COMPLETED");
      setUnifiedRunning(false);
    }, 2600);
  };

  const handleOpenModal = () => {
    setUnifiedModal(true);
    setUnifiedProgress(0);
    setUnifiedStage("READY");
    setUnifiedRunning(false);
  };

  if (explorer)
    return (
      <div className="space-y-4">
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <Btn variant="ghost" onClick={() => setExplorer(false)}>
            ◄ Back to overview
          </Btn>
          <div>
            <h1 className="text-xl font-bold tracking-wide">FULL FILE EXPLORER</h1>
            <p className="text-xs text-muted-foreground">
              Inspect sample files and simulate storage management.
            </p>
          </div>
          <Btn variant="primary" onClick={() => setScanned(true)}>
            Scan files
          </Btn>
        </div>
        <Card>
          <Label className="mb-2 text-foreground">FILESYSTEM SCAN SUMMARY</Label>
          <div className="flex flex-wrap gap-2 text-[11.5px]">
            {[
              "📁 ALL: 128",
              "🎬 VIDEOS: 22",
              "🖼️ IMAGES: 41",
              "🎵 AUDIO: 9",
              "📄 DOCS: 18",
              "⚙️ APPS: 7",
              "📦 ARCHIVES: 12",
              "💿 ISO: 2",
              "💻 PROJECTS: 11",
              "📁 OTHER: 6",
            ].map((x) => (
              <span key={x} className="rounded-md border border-border bg-window px-2 py-1">
                {x}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="mb-1">DRIVE</Label>
              <PremiumSelect
                label="Drive"
                value={drive}
                onChange={setDrive}
                options={["All drives", "C:", "D:"]}
              />
            </div>
            <div>
              <Label className="mb-1">MINIMUM SIZE</Label>
              <PremiumSelect
                label="Minimum size"
                value={minimum}
                onChange={setMinimum}
                options={MIN_SIZES}
              />
            </div>
            <div>
              <Label className="mb-1">SORT BY</Label>
              <PremiumSelect
                label="Sort by"
                value={sortFiles}
                onChange={setSortFiles}
                options={SORTS}
              />
            </div>
            <div>
              <Label className="mb-1">FILE TYPES</Label>
              <PremiumMultiSelect
                label="File types"
                allLabel="All types"
                value={types}
                onChange={setTypes}
                options={FILE_TYPES}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="min-w-[220px] flex-1">
              <SearchBox
                placeholder="Search sample files…"
                value={fileQuery}
                onChange={setFileQuery}
              />
            </div>
            {[...types].map((t) => (
              <FilterChip
                key={t}
                onRemove={() =>
                  setTypes((cur) => {
                    const n = new Set(cur);
                    n.delete(t);
                    return n;
                  })
                }
              >
                {t}
              </FilterChip>
            ))}
            <span className="text-[11px] text-subtle tabular-nums">
              {visibleFiles.length} of {SAMPLE_FILES.length} sample files
            </span>
          </div>
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-warning">— User review required before deletion</span>
            <div className="flex gap-1.5">
              <Btn size="sm" onClick={() => setFileSel(new Set(fileRows.map((r) => r[0] ?? "")))}>
                Select all
              </Btn>
              <Btn
                size="sm"
                onClick={() => setFileSel(new Set(visibleFiles.map((r) => r[0] ?? "")))}
              >
                Select filtered
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => setFileSel(new Set())}>
                Deselect all
              </Btn>
              <Btn
                size="sm"
                variant="danger"
                disabled={!fileSel.size}
                onClick={() => {
                  simulate(`Move ${fileSel.size} sample files to Recycle Bin`);
                  setFileSel(new Set());
                }}
              >
                Delete selected
              </Btn>
            </div>
          </div>
          {!scanned ? (
            <EmptyState
              title="No files scanned yet."
              sub="Scan your drives to find large files and manage storage."
              action={<Btn onClick={() => setScanned(true)}>Scan files</Btn>}
            />
          ) : (
            <div className="eo-data-table rounded-lg border border-border">
              <div
                className="grid bg-window px-3 py-2 eo-label text-[10px] text-subtle"
                style={{ gridTemplateColumns: "34px 1fr 72px 72px 120px 90px 95px" }}
              >
                <span />
                <span>FILE & LOCATION</span>
                <span>SIZE</span>
                <span>TYPE</span>
                <span>SAFETY</span>
                <span>MODIFIED</span>
                <span>ACTIONS</span>
              </div>
              {visibleFiles.length === 0 && (
                <div className="border-t border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
                  No sample files match these filters.
                </div>
              )}
              {visibleFiles.map((r) => (
                <div
                  key={r[0]}
                  className="grid items-center border-t border-border px-3 py-2 text-[12px]"
                  style={{ gridTemplateColumns: "34px 1fr 72px 72px 120px 90px 95px" }}
                >
                  <Check
                    label={`Select ${r[0]}`}
                    on={fileSel.has(r[0] ?? "")}
                    onChange={(v) =>
                      setFileSel((current) => {
                        const next = new Set(current);
                        if (v) next.add(r[0] ?? "");
                        else next.delete(r[0] ?? "");
                        return next;
                      })
                    }
                  />
                  <div>
                    <div className="font-semibold">{r[0]}</div>
                    <div className="text-[10.5px] text-subtle">{r[1]}</div>
                  </div>
                  <span>{r[2]}</span>
                  <span>{r[3]}</span>
                  <Badge tone="warning">USER FILE</Badge>
                  <span className="text-subtle">{r[4]}</span>
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => simulate(`Reveal sample location for ${r[0]}`)}
                  >
                    Reveal
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </Card>
        <SimNotice>Sample file list. The prototype cannot see your files.</SimNotice>
      </div>
    );

  const renderCleanRow = (i: StorageCleanItem) => {
    const isChecked = storageSel.sel.has(i.id);
    const isLocked = !i.eligible;
    return (
      <div
        key={i.id}
        onClick={() => !isLocked && storageSel.toggle(i.id)}
        className={cn(
          "flex items-center justify-between gap-3 eo-list-row rounded-lg border border-border bg-window px-3 py-2.5 text-[12.5px] transition-colors",
          !isLocked ? "cursor-pointer hover:border-cyan/40 hover:bg-window/90 select-none" : "cursor-not-allowed opacity-75",
          isChecked ? "border-cyan/40 bg-cyan/5" : "border-border bg-window",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span
            className={cn(
              "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
              isLocked
                ? "border-border bg-window text-subtle"
                : isChecked
                  ? "border-cyan bg-cyan text-sidebar-primary-foreground shadow-sm"
                  : "border-border-strong bg-window text-subtle",
            )}
            aria-hidden="true"
          >
            {isLocked ? (
              <Lock className="h-2.5 w-2.5" />
            ) : (
              isChecked && <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-medium">
              <span>{i.name}</span>
              <span className="text-xs text-subtle">({i.size})</span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{i.desc}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <RiskBadge risk={i.risk} />
          {i.status === "ELIGIBLE" ? (
            isChecked ? (
              storageSel.mode === "CUSTOM" ? (
                <Badge tone="cyan" className="text-[9.5px] font-bold tracking-wide">
                  CUSTOM SELECTED
                </Badge>
              ) : (
                <Badge tone="success" className="text-[9.5px] font-bold tracking-wide">
                  AUTO-SELECTED — ELIGIBLE
                </Badge>
              )
            ) : (
              <Badge tone="muted" className="text-[9.5px] font-semibold tracking-wide">
                NOT SELECTED
              </Badge>
            )
          ) : i.status === "ALREADY_CLEAN" ? (
            <Badge tone="muted" className="text-[9.5px] font-semibold">
              ALREADY CLEAN
            </Badge>
          ) : (
            <Badge tone="warning" className="text-[9.5px] font-semibold">
              PROTECTED
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Storage Optimizer"
        badges={
          <>
            <Badge tone="cyan">UNIFIED STORAGE CLEAN</Badge>
            <Badge tone="success">ELIGIBLE OPTIMIZATIONS ONLY</Badge>
          </>
        }
        sub="Unified Smart Clean and Deep Clean coordination · Automatic eligibility selection."
        actions={
          <>
            <Btn variant="primary" onClick={handleOpenModal} className="font-bold tracking-wider">
              OPTIMIZE STORAGE
            </Btn>
            <Btn variant="ghost" onClick={() => simulate("Refresh")}>
              Refresh
            </Btn>
          </>
        }
      />

      <StatTiles
        items={[
          { label: "STORAGE HEALTH", value: "100%", tone: "success" },
          { label: "FREE SPACE", value: "1.08 TB" },
          { label: "USED SPACE", value: "920 GB" },
          {
            label: "RECLAIMABLE SPACE",
            value: `${totalReclaimableGB} GB`,
            sub: `${eligibleItems.length} eligible operations auto-selected`,
            tone: "cyan",
          },
        ]}
      />

      <Card>
        <Label className="mb-3 text-foreground">DETECTED DRIVES</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["C:  Samsung 990 PRO", 46, "NVMe · 2 TB"],
            ["D:  WD Blue SN580", 71, "NVMe · 1 TB"],
          ].map(([n, u, s]) => (
            <div key={n as string} className="rounded-lg border border-border bg-window p-3">
              <div className="flex justify-between text-[13px] font-semibold">
                <span>{n}</span>
                <span className="text-muted-foreground">{u}%</span>
              </div>
              <Bar
                value={u as number}
                tone={(u as number) > 70 ? "warning" : "cyan"}
                className="my-2"
              />
              <div className="text-[11px] text-subtle">{s}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── UNIFIED STORAGE CLEAN CARD (Combining Smart Clean & Deep Clean) ── */}
      <Card>
        <SectionTitle
          title="UNIFIED STORAGE OPTIMIZATION"
          guide="storage.clean"
          sub="Single coordinated workflow combining Smart Clean caches with Deep Clean system logs & dumps."
          right={
            <Btn variant="primary" onClick={handleOpenModal} className="font-bold">
              OPTIMIZE STORAGE ({totalReclaimableGB} GB)
            </Btn>
          }
        />

        <div className="mb-4 pb-2 border-b border-border">
          <SelectionBar
            count={storageSel.sel.size}
            total={storageSel.eligibleCount}
            moded={storageSel}
            title="Storage Optimization"
          />
        </div>

        <div className="space-y-4">
          {/* Smart Clean Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="eo-label text-[10.5px] text-cyan font-bold tracking-wider">
                ⚡ SECTION A — SMART CLEAN SCOPE (SAFE TEMPORARY & SYSTEM CACHES)
              </div>
              <span className="text-xs text-muted-foreground">5 categories · ~3.33 GB</span>
            </div>
            <div className="space-y-1.5">
              {smartCleanItems.map(renderCleanRow)}
            </div>
          </div>

          {/* Deep Clean Section */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="eo-label text-[10.5px] text-cyan font-bold tracking-wider">
                🛡️ SECTION B — DEEP CLEAN SCOPE (DIAGNOSTIC ARCHIVES & RECYCLE BIN)
              </div>
              <span className="text-xs text-muted-foreground">6 categories · ~887 MB</span>
            </div>
            <div className="space-y-1.5">
              {deepCleanItems.map(renderCleanRow)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">
            Strict user data protection guarantee: Passwords, cookies, active browser sessions, and personal documents are never touched.
          </span>
          <Btn variant="primary" onClick={handleOpenModal} className="font-bold">
            OPTIMIZE STORAGE
          </Btn>
        </div>
      </Card>

      <Cols cols="1fr 1fr" gap={12}>
        <Card>
          <SectionTitle
            title="WINDOWS RECYCLE BIN"
            guide="storage.recycle"
            sub="Safely empty the Recycle Bin to immediately free up space."
          />
          <div className="grid grid-cols-2 gap-2">
            <KV k="SIZE" v="412 MB" />
            <KV k="ITEMS" v="38" />
          </div>
          <Btn className="mt-3" onClick={() => simulate("Empty Recycle Bin")}>
            Empty Recycle Bin
          </Btn>
        </Card>
        <Card>
          <SectionTitle
            title="FULL FILE EXPLORER"
            guide="storage.explorer"
            sub="Inspect sample files and simulate storage management."
          />
          <Btn variant="primary" onClick={() => setExplorer(true)}>
            Open file explorer
          </Btn>
        </Card>
      </Cols>
      <SimNotice />

      {/* ── UNIFIED STORAGE OPTIMIZATION WORKFLOW MODAL ── */}
      <Modal
        open={unifiedModal}
        onClose={() => {
          if (!unifiedRunning) setUnifiedModal(false);
        }}
        title="⚡ Unified Storage Optimization"
        sub="Coordinated Smart Clean & Deep Clean Execution · Prototype Simulation"
        width="max-w-2xl"
        footer={
          unifiedStage === "COMPLETED" ? (
            <Btn variant="primary" onClick={() => setUnifiedModal(false)}>
              Finish & Close
            </Btn>
          ) : (
            <>
              <Btn
                variant="ghost"
                disabled={unifiedRunning}
                onClick={() => setUnifiedModal(false)}
              >
                Cancel
              </Btn>
              <Btn
                variant="primary"
                disabled={unifiedRunning}
                onClick={handleStartUnifiedClean}
                className="font-bold"
              >
                {unifiedRunning ? "Optimizing Storage..." : "Start Unified Storage Optimization"}
              </Btn>
            </>
          )
        }
      >
        <div className="space-y-4">
          {/* Stepper / Progress Status */}
          <div className="rounded-lg border border-border bg-window p-3">
            <div className="flex items-center justify-between text-[12px] font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Badge tone="cyan">
                  {unifiedStage === "READY"
                    ? "PREPARED"
                    : unifiedStage === "ANALYZING"
                      ? "ANALYZING ELIGIBILITY"
                      : unifiedStage === "SMART_CLEAN"
                        ? "EXECUTING SMART CLEAN"
                        : unifiedStage === "DEEP_CLEAN"
                          ? "EXECUTING DEEP CLEAN"
                          : "OPTIMIZATION COMPLETE"}
                </Badge>
              </span>
              <span className="tabular-nums text-foreground font-bold">{unifiedProgress}%</span>
            </div>
            <Bar value={unifiedProgress} className="h-2" />
          </div>

          {/* Safety & Exclusion Guarantee Banner */}
          <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-[11.5px] text-foreground">
            <div className="flex items-center gap-2 font-bold text-success mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>SAFETY & USER DATA PROTECTION GUARANTEE</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The unified storage engine automatically excludes all browser cookies, saved passwords, active authentication tokens, browser history, personal documents, and user projects. Only verified temporary system caches, shader binaries, outdated update staging files, crash dumps, and Recycle Bin items are cleaned.
            </p>
          </div>

          {/* Operations Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-window p-2.5 text-center">
              <div className="text-lg font-bold text-cyan tabular-nums">{totalReclaimableGB} GB</div>
              <div className="text-[10px] text-muted-foreground font-semibold">RECLAIMABLE SPACE</div>
            </div>
            <div className="rounded-lg border border-border bg-window p-2.5 text-center">
              <div className="text-lg font-bold text-foreground tabular-nums">5 Smart + 3 Deep</div>
              <div className="text-[10px] text-muted-foreground font-semibold">COORDINATED TASKS</div>
            </div>
            <div className="rounded-lg border border-border bg-window p-2.5 text-center">
              <div className="text-lg font-bold text-success tabular-nums">0 B</div>
              <div className="text-[10px] text-muted-foreground font-semibold">PERSONAL FILES TOUCHED</div>
            </div>
          </div>

          {/* Consolidated Result Report when Completed */}
          {unifiedStage === "COMPLETED" ? (
            <div className="rounded-xl border border-success/40 bg-success/10 p-3.5 space-y-2 text-center animate-in fade-in">
              <div className="flex items-center justify-center gap-2 text-success font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>UNIFIED STORAGE OPTIMIZATION COMPLETED SUCCESSFULLY</span>
              </div>
              <p className="text-xs text-muted-foreground">
                All 8 eligible Smart Clean and Deep Clean operations have been simulated. In the native app, this would free approximately {totalReclaimableGB} GB of drive storage while preserving all personal data.
              </p>
              <div className="text-[10.5px] text-subtle font-mono">
                [sim] Prototype mode: 0 bytes altered on host computer • Zero risk verification passed.
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Queued Unified Targets (8 Auto-Selected):
              </div>
              {eligibleItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded border border-border/70 bg-window"
                >
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-subtle">{item.size}</span>
                    <Badge tone="success" className="text-[9px]">ELIGIBLE</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ───────── SYSTEM TOOLS ───────── */
const TOOLS = [
  ["System File Checker (SFC)", "REPAIR & INTEGRITY", true],
  ["DISM Component Store Repair", "REPAIR & INTEGRITY", true],
  ["Check Disk (read-only scan)", "HARDWARE & BIOS", true],
  ["Memory Diagnostic Scheduler", "MEMORY", true],
  ["Clear Standby Memory", "MEMORY", true],
  ["Temp & Cache Cleanup", "CLEANUP", false],
  ["Component Store Cleanup", "CLEANUP", true],
  ["Reset Windows Update Cache", "WINDOWS OS", true],
  ["Rebuild Icon & Thumbnail Cache", "WINDOWS OS", false],
  ["Reset Network Stack (Winsock)", "NETWORK", true],
  ["Flush DNS Resolver Cache", "NETWORK", false],
  ["Restart Graphics Driver", "GPU & DISPLAY", false],
  ["Clear DirectX Shader Cache", "GPU & DISPLAY", false],
  ["Battery & Energy Report", "HARDWARE & BIOS", true],
  ["Re-register Store Apps", "ADVANCED", true],
  ["Reboot to UEFI Firmware", "ADVANCED", true],
] as const;
export function ToolsPage() {
  const [c, setC] = useState("ALL TOOLS");
  const [q, setQ] = useState("");
  const [activity, setActivity] = useState<string[]>([]);
  const [runT, setRunT] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const r = useSimRun(3000);
  const stage = ["PREPARING", "SCANNING", "VERIFYING", "REPAIRING", "FINALIZING"][
    Math.min(4, Math.floor((r.progress ?? 0) / 20))
  ];
  const vis = TOOLS.filter(
    (t) => (c === "ALL TOOLS" || t[1] === c) && t[0].toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <PageHeader
        title="System Tools & Health Diagnostics"
        sub="Unified toolbox — 16 advanced Windows diagnostics, repair, and cleanup tools."
        actions={
          <Btn variant="ghost" onClick={() => simulate("Refresh")}>
            Refresh
          </Btn>
        }
      />
      <Card
        className="grid items-center gap-5"
        style={{ gridTemplateColumns: "auto 1fr auto" } as React.CSSProperties}
      >
        <div className="text-center">
          <div className="text-4xl font-black text-success">92</div>
          <div className="text-[10px] font-bold text-subtle">/ 100</div>
        </div>
        <p className="text-sm text-muted-foreground">
          System health score based on integrity, storage and memory checks (sample).
        </p>
        <div className="flex gap-2">
          <Btn variant="primary" onClick={() => simulate("One-click optimize")}>
            One-click optimize
          </Btn>
          <Btn onClick={() => simulate("Re-scan health")}>Re-scan health</Btn>
        </div>
      </Card>
      <SearchBox placeholder="Search tools, categories, or components…" value={q} onChange={setQ} />
      <Chips
        options={[
          "ALL TOOLS",
          "CLEANUP",
          "MEMORY",
          "REPAIR & INTEGRITY",
          "HARDWARE & BIOS",
          "WINDOWS OS",
          "NETWORK",
          "GPU & DISPLAY",
          "ADVANCED",
        ]}
        value={c}
        onChange={setC}
      />
      <div className="grid grid-cols-2 items-stretch gap-3.5 xl:grid-cols-3">
        {vis.map(([n, cat, elev]) => (
          <div key={n} className="eo-card flex min-w-0 flex-col p-3">
            <Label className="text-cyan">{cat}</Label>
            <div className="mt-1.5 flex-1 text-[13px] font-bold">{n}</div>
            <div className="mt-3 flex items-center justify-between">
              {elev ? (
                <Badge tone="warning">REQUIRES ELEVATION</Badge>
              ) : (
                <Badge tone="success">STANDARD</Badge>
              )}
              <span className="flex gap-1">
                <Btn size="sm" variant="ghost" onClick={() => setInfo(n)}>
                  Info
                </Btn>
                <Btn
                  size="sm"
                  onClick={() => {
                    setRunT(n);
                    r.start(() => setActivity((a) => [`${n} — simulated completion`, ...a]));
                  }}
                >
                  Run
                </Btn>
              </span>
            </div>
          </div>
        ))}
      </div>
      {!vis.length && (
        <EmptyState
          title="NO TOOLS FOUND"
          sub="No system tools or diagnostics match your current search query or active category."
          action={
            <Btn
              size="sm"
              onClick={() => {
                setC("ALL TOOLS");
                setQ("");
              }}
            >
              Reset all filters
            </Btn>
          }
        />
      )}
      <Card>
        <SectionTitle title="RECENT TOOL ACTIVITY" />
        <p className="text-xs text-muted-foreground">
          {activity.length ? activity.join(" · ") : "No tool actions executed in this session yet."}
        </p>
      </Card>
      <SimNotice />
      <Modal
        open={!!runT}
        onClose={() => setRunT(null)}
        title={`TOOL: ${runT ?? ""}`}
        sub="SERVICE: simulated"
        footer={
          <>
            <span className="mr-auto text-[11px] text-success">
              ● Transactional safety (simulated)
            </span>
            <Btn
              variant="ghost"
              onClick={() => {
                r.cancel();
                setRunT(null);
              }}
            >
              {r.running ? "Cancel" : "Close"}
            </Btn>
          </>
        }
      >
        <div className="mb-2 flex justify-between text-[10px] font-bold tracking-widest">
          <span className="text-cyan">
            {r.running ? stage : "✓ SIMULATION COMPLETE • NO CHANGES MADE"}
          </span>
          <span>{(r.progress ?? 100).toFixed(0)}%</span>
        </div>
        <Bar value={r.progress ?? 100} tone={r.running ? "cyan" : "success"} />
        <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 90px 1fr" }}>
          <KV k="TARGET" v="Local PC" />
          <KV k="PROCESS" v="sim" />
          <KV k="ELAPSED" v="3 s" />
          <KV k="BACKEND" v="Simulated" />
        </div>
      </Modal>
      <Modal
        open={!!info}
        onClose={() => setInfo(null)}
        title={info ?? ""}
        footer={<Btn onClick={() => setInfo(null)}>Close</Btn>}
      >
        {[
          "FUNCTION OVERVIEW",
          "TECHNICAL SPECIFICATION & ENGINE",
          "AFFECTED SUBSYSTEMS & COMPONENTS",
        ].map((s) => (
          <div key={s} className="mb-3">
            <Label className="mb-1 text-cyan">{s}</Label>
            <p className="text-xs text-muted-foreground">
              Described in the native app from tool metadata.
            </p>
          </div>
        ))}
        <Label className="mb-1 text-cyan">SECURITY & EXECUTION ARCHITECTURE</Label>
        <Cols cols="1fr 1fr">
          <KV k="SAFETY LEVEL" v="Safe" />
          <KV k="ELEVATION" v="Admin" />
          <KV k="EXECUTION METHOD" v="Native" />
          <KV k="VERIFICATION" v="Exit code + readback" />
        </Cols>
      </Modal>
    </div>
  );
}

/* ───────── PROCESS INTELLIGENCE ───────── */
const PROCS = [
  {
    n: "OneDrive.exe",
    mem: 182,
    cpu: 0.4,
    s: "SAFE TO TERMINATE",
    why: "Sync client, restarts on demand",
    pid: 8412,
  },
  {
    n: "Teams.exe",
    mem: 420,
    cpu: 1.6,
    s: "SAFE TO TERMINATE",
    why: "Background chat client",
    pid: 6120,
  },
  {
    n: "SearchHost.exe",
    mem: 96,
    cpu: 0.1,
    s: "CAUTION",
    why: "Windows search UI host",
    pid: 3304,
  },
  {
    n: "explorer.exe",
    mem: 140,
    cpu: 0.6,
    s: "PROTECTED / SYSTEM",
    why: "Windows shell",
    pid: 4120,
  },
  {
    n: "AdobeUpdateService.exe",
    mem: 38,
    cpu: 0,
    s: "SAFE TO TERMINATE",
    why: "Updater service",
    pid: 2288,
  },
  {
    n: "csrss.exe",
    mem: 6,
    cpu: 0,
    s: "PROTECTED / SYSTEM",
    why: "Critical system process",
    pid: 712,
  },
];
// Only "safe to terminate" rows are selectable; caution and system processes never are.
const PROC_ITEMS = PROCS.map((p) => ({
  id: p.pid,
  risk: p.s === "SAFE TO TERMINATE" ? ("SAFE" as const) : ("PROTECTED" as const),
}));
export function ProcessReductionPage() {
  const [f, setF] = useState("ALL");
  const [sort, setSort] = useState("SAFETY + RAM");
  const procSel = useModedSelection("process-reduction", PROC_ITEMS);
  const { sel, setSel } = procSel;
  const [confirm, setConfirm] = useState(false);
  const [d, setD] = useState<(typeof PROCS)[number] | null>(null);
  const vis = PROCS.filter(
    (p) =>
      f === "ALL" ||
      p.s === f ||
      (f === "HIGH MEMORY (>100MB)" && p.mem > 100) ||
      (f === "HIGH CPU (>1%)" && p.cpu > 1),
  ).sort((a, b) =>
    sort === "RAM"
      ? b.mem - a.mem
      : sort === "CPU"
        ? b.cpu - a.cpu
        : sort === "NAME"
          ? a.n.localeCompare(b.n)
          : a.s.localeCompare(b.s) || b.mem - a.mem,
  );
  const tone = (s: string) =>
    (s === "SAFE TO TERMINATE" ? "success" : s === "CAUTION" ? "warning" : "cyan") as
      "success" | "warning" | "cyan";
  return (
    <div className="space-y-4">
      <PageHeader
        title="Process Intelligence"
        badges={<Badge tone="cyan">PROTECTED SYSTEM PROCESSES</Badge>}
        sub="Review sample background processes and simulate memory recovery."
        actions={<Btn onClick={() => simulate("Rescan")}>↻ Refresh / Rescan</Btn>}
      />
      <StatTiles
        items={[
          {
            label: "SAFE TO TERMINATE",
            value: PROCS.filter((p) => p.s === "SAFE TO TERMINATE").length,
            sub: "Classified as safe",
            tone: "success",
          },
          { label: "SELECTED", value: sel.size, sub: "Marked for safe termination", tone: "cyan" },
          {
            label: "RAM RECLAIMABLE",
            value: `${PROCS.filter((p) => sel.has(p.pid)).reduce((a, p) => a + p.mem, 0)} MB`,
            sub: "From selected processes",
          },
          {
            label: "SYSTEM STATUS",
            value: "Healthy",
            sub: "Based on process & memory state",
            tone: "success",
          },
        ]}
      />
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3.5">
          <Chips
            options={[
              "ALL",
              "SAFE TO TERMINATE",
              "CAUTION",
              "PROTECTED / SYSTEM",
              "HIGH MEMORY (>100MB)",
              "HIGH CPU (>1%)",
            ]}
            value={f}
            onChange={setF}
          />
          <div className="flex gap-1.5">
            <SelectionBar
              count={sel.size}
              total={procSel.eligibleCount}
              onAll={procSel.selectAll}
              onClear={() => setSel(new Set())}
              allLabel="Select all safe"
              autoLabel="ALL SAFE"
              moded={procSel}
            />
          </div>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <Label>SORT:</Label>
          <Chips options={["SAFETY + RAM", "RAM", "CPU", "NAME"]} value={sort} onChange={setSort} />
        </div>
        <Label className="mb-2 text-foreground">BACKGROUND PROCESS CANDIDATES</Label>
        <div className="eo-data-table rounded-lg border border-border">
          <div
            className="grid bg-window px-3 py-2 eo-label text-[10px] text-subtle"
            style={{
              gridTemplateColumns:
                "26px 60px minmax(130px, 1fr) 45px 145px minmax(90px, 1fr) 45px 50px",
            }}
          >
            <span>SEL</span>
            <span>MEMORY</span>
            <span>PROCESS & IDENTITY</span>
            <span>CPU</span>
            <span>SAFETY LEVEL</span>
            <span>REASON</span>
            <span>PID</span>
            <span>ACTION</span>
          </div>
          {vis.map((p) => (
            <div
              key={p.pid}
              className="grid items-center border-t border-border px-3 py-2 text-[12px]"
              style={{
                gridTemplateColumns:
                  "26px 60px minmax(130px, 1fr) 45px 145px minmax(90px, 1fr) 45px 50px",
              }}
            >
              {p.s === "SAFE TO TERMINATE" ? (
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-cyan bg-cyan text-sidebar-primary-foreground shadow-sm"
                  aria-hidden="true"
                >
                  <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
                </span>
              ) : (
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-window text-subtle"
                  aria-hidden="true"
                >
                  <Lock className="h-2 w-2" />
                </span>
              )}
              <span>{p.mem} MB</span>
              <span className="font-semibold">{p.n}</span>
              <span>{p.cpu}%</span>
              <Badge tone={tone(p.s)}>{p.s}</Badge>
              <span className="text-muted-foreground">{p.why}</span>
              <span className="font-mono text-subtle">{p.pid}</span>
              <Btn size="sm" variant="ghost" onClick={() => setD(p)}>
                Info
              </Btn>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <Btn variant="danger" disabled={!sel.size} onClick={() => setConfirm(true)}>
            Terminate selected
          </Btn>
        </div>
      </Card>
      <SimNotice />
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Terminate selected processes?"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                setConfirm(false);
                simulate(`Terminate ${sel.size} selected processes`);
              }}
            >
              Confirm terminate
            </Btn>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Warning: the selected background processes will be terminated immediately. Unsaved data in
          them may be lost.
        </p>
      </Modal>
      <Modal
        open={!!d}
        onClose={() => setD(null)}
        title={d?.n ?? ""}
        footer={<Btn onClick={() => setD(null)}>Close</Btn>}
      >
        {d && (
          <>
            <KV k="Process ID (PID):" v={d.pid} />
            <KV k="Publisher / Company:" v="Sample publisher" />
            <KV k="Working Set Memory:" v={`${d.mem} MB`} />
            <KV k="CPU Usage (Approx):" v={`${d.cpu}%`} />
            <KV k="Safety Level:" v={d.s} />
            <KV k="Analysis Reason:" v={d.why} />
          </>
        )}
      </Modal>
    </div>
  );
}

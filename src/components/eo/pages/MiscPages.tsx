// AiOptimizationView, BackupRestoreView, SettingsView, AboutView, PerformanceTuningView
import { useState, useMemo, type ReactNode } from "react";
import {
  Badge,
  Bar,
  Btn,
  Card,
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
  Stepper,
  SimNotice,
  StatTiles,
  Toggle,
  simulate,
} from "../kit";
import { GuideTip } from "../Guide";
import { useAppearance } from "../Appearance";
import { EffectsSettingsCard } from "../EffectsSettings";
import { resetEffects } from "../effectsStore";
import { CountUp, NumberField, RangeSlider, Segmented } from "../controls";
import { RAM_DEFAULTS, setRamState, useRamState } from "../ramLimiterStore";
import {
  MANUAL_MAX_MB,
  MANUAL_MIN_MB,
  RAM_MODES,
  SAMPLE_APPS,
  clampManualMb,
  defaultManualMb,
  fmtMb,
  standbyPurgeMb,
  summarize,
  type RamMode,
} from "@/lib/eo/ramLimiter";
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Cpu,
  Eye,
  Feather,
  FileCode,
  Flame,
  Folder,
  Info,
  Layers,
  Maximize2,
  MemoryStick,
  Monitor,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Square,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import { RestorePointDialog } from "../RestorePoint";
import { PremiumSelect } from "../dropdown";
import { setRestoreState, useRestoreState } from "../restorePointStore";
import { PROTECTION_SCENARIOS, SYSTEM_DRIVE } from "@/lib/eo/restorePoint";
import { CATALOG, HW, PROFILES, type Risk } from "@/lib/eo/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ───────── AI OPTIMIZATION (3 sub-modules via top segmented control) ───────── */
const SYSTEM_RAM_GB = 32; // sample system memory (HW.ram)
const SAMPLE_SYS_TOTAL_MB = SYSTEM_RAM_GB * 1024;
const PRESSURE_OPTIONS: [string, number][] = [
  ["LOW 45%", 0.45],
  ["NORMAL 62%", 0.62],
  ["HIGH 78%", 0.78],
  ["CRITICAL 90%", 0.9],
];

interface EligibleWorkload {
  name: string;
  category: "GAMES" | "CREATIVE" | "VIDEO AI" | "EMULATORS";
  exe: string;
  compatibleProfile: string;
}

const DEFAULT_ELIGIBLE_WORKLOADS: EligibleWorkload[] = [
  { name: "Valorant", category: "GAMES", exe: "VALORANT-Win64-Shipping.exe", compatibleProfile: "High-Priority Execution & Anti-Lag Affinity" },
  { name: "Counter-Strike 2", category: "GAMES", exe: "cs2.exe", compatibleProfile: "High-Priority Execution & Anti-Lag Affinity" },
  { name: "Cyberpunk 2077", category: "GAMES", exe: "Cyberpunk2077.exe", compatibleProfile: "High-Priority Execution & GPU Boost" },
  { name: "Adobe Premiere Pro", category: "CREATIVE", exe: "Adobe Premiere Pro.exe", compatibleProfile: "Multi-Thread CPU Affinity & Standby Memory Shield" },
  { name: "DaVinci Resolve", category: "CREATIVE", exe: "Resolve.exe", compatibleProfile: "Multi-Thread CPU Affinity & Standby Memory Shield" },
  { name: "After Effects", category: "CREATIVE", exe: "AfterFX.exe", compatibleProfile: "Multi-Thread CPU Affinity & Standby Memory Shield" },
  { name: "Blender", category: "CREATIVE", exe: "blender.exe", compatibleProfile: "Multi-Thread CPU Affinity & Render Boost" },
  { name: "Topaz Video AI", category: "VIDEO AI", exe: "Topaz Video AI.exe", compatibleProfile: "GPU Compute Boost & Background Throttle" },
  { name: "ComfyUI", category: "VIDEO AI", exe: "python.exe", compatibleProfile: "GPU Compute Boost & Background Throttle" },
  { name: "MSI App Player 5", category: "EMULATORS", exe: "HD-Player.exe", compatibleProfile: "Virtualization Thread Isolation & High Timer Resolution" },
  { name: "LDPlayer 9", category: "EMULATORS", exe: "dnplayer.exe", compatibleProfile: "Virtualization Thread Isolation & High Timer Resolution" },
];

interface ActiveWorkloadState {
  name: string;
  category: string;
  profile: string;
  pid: number;
}

interface PowerPlanItem {
  name: string;
  guid: string;
  type: "AI_CUSTOM" | "WINDOWS_STANDARD" | "WINDOWS_ULTIMATE" | "CUSTOM_USER";
  description: string;
  cpuMin: number;
  cpuMax: number;
  cooling: "Active" | "Passive";
}

const DEFAULT_POWER_PLANS: PowerPlanItem[] = [
  {
    name: "AI Max Performance",
    guid: "eo-ai-max-perf",
    type: "AI_CUSTOM",
    description: "Dynamic AI scheme: 100% min/max processor state, active cooling, zero core parking.",
    cpuMin: 100,
    cpuMax: 100,
    cooling: "Active",
  },
  {
    name: "AI Battery Efficiency",
    guid: "eo-ai-battery",
    type: "AI_CUSTOM",
    description: "Adaptive power saver: 5% min state, dynamic throttle, passive cooling during idle.",
    cpuMin: 5,
    cpuMax: 80,
    cooling: "Passive",
  },
  {
    name: "Ultimate Performance",
    guid: "e9a42b02-d5df-448d-aa00-03f14749eb61",
    type: "WINDOWS_ULTIMATE",
    description: "OEM high-performance workstation scheme with disabled micro-latencies.",
    cpuMin: 100,
    cpuMax: 100,
    cooling: "Active",
  },
  {
    name: "High performance",
    guid: "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
    type: "WINDOWS_STANDARD",
    description: "Favors performance over energy consumption across all CPU p-states.",
    cpuMin: 100,
    cpuMax: 100,
    cooling: "Active",
  },
  {
    name: "Balanced",
    guid: "381b4222-f694-41f0-9685-ff5bb260df2e",
    type: "WINDOWS_STANDARD",
    description: "Standard Windows dynamic scaling balancing performance and power usage.",
    cpuMin: 5,
    cpuMax: 100,
    cooling: "Active",
  },
  {
    name: "Power saver",
    guid: "a1841308-3541-4fab-bc81-f71556f20b4a",
    type: "WINDOWS_STANDARD",
    description: "Reduces processor performance to save energy and extend laptop battery life.",
    cpuMin: 5,
    cpuMax: 70,
    cooling: "Passive",
  },
];

export function AiOptimizationPage() {
  // Master AI Optimization ON/OFF Switch
  const [aiMasterEnabled, setAiMasterEnabled] = useState(true);

  // Active Sub-Module Navigation (RAM LIMITER | WORKLOAD OPTIMIZATION | POWER PLAN OPTIMIZATION)
  const [mod, setMod] = useState("RAM LIMITER");

  /* ────────────────── 1. RAM LIMITER STATE ────────────────── */
  const [query, setQuery] = useState("");
  // One shared RAM Limiter configuration (persisted); every panel below reads it.
  const ram = useRamState();
  const { mode, trimInterval, foregroundProtection: fg, standbyPurged } = ram;
  const [selectedApp, setSelectedApp] = useState("chrome.exe");
  const [aggressiveConfirm, setAggressiveConfirm] = useState(false);
  const [modeBusy, setModeBusy] = useState(false);
  const sys = useMemo(() => ({ totalMb: SAMPLE_SYS_TOTAL_MB, pressure: ram.pressure }), [ram.pressure]);
  const ramSummary = useMemo(
    () =>
      summarize(
        SAMPLE_APPS,
        { mode, foregroundProtection: fg, manualMb: ram.manualMb, excluded: ram.excluded },
        sys,
        standbyPurged,
      ),
    [mode, fg, ram.manualMb, ram.excluded, sys, standbyPurged],
  );

  /* ────────────── 2. WORKLOAD OPTIMIZER STATE ────────────── */
  const [inv, setInv] = useState("ALL");
  const [eligibleWorkloads, setEligibleWorkloads] = useState<EligibleWorkload[]>(DEFAULT_ELIGIBLE_WORKLOADS);

  // Multiple running workloads supported independently
  const [activeWorkloads, setActiveWorkloads] = useState<ActiveWorkloadState[]>([
    {
      name: "Valorant",
      category: "GAMES",
      profile: "High-Priority Execution & Anti-Lag Affinity",
      pid: 9428,
    },
  ]);

  const [workloadOptions, setWorkloadOptions] = useState<Record<string, boolean>>({
    "Foreground CPU priority boost": true,
    "Anti-Lag affinity isolation": true,
    "Suspend background updaters": true,
    "Standby memory refresh on launch": true,
  });
  const [bgCpuThrottlePercent, setBgCpuThrottlePercent] = useState(25);
  const [savedProfiles, setSavedProfiles] = useState<string[]>([
    "Valorant · High Priority Boost, Affinity Lock, 25% Throttle",
  ]);

  /* ────────────── 3. POWER PLAN GOVERNOR STATE ────────────── */
  const [powerPlans, setPowerPlans] = useState<PowerPlanItem[]>(DEFAULT_POWER_PLANS);
  const [activePowerPlan, setActivePowerPlan] = useState("AI Max Performance");
  const [autoPowerPlan, setAutoPowerPlan] = useState(true); // Automatic power-plan selection
  const [autoStartupPower, setAutoStartupPower] = useState(false);
  const [cpuGovernor, setCpuGovernor] = useState(true);
  const [thermalFreqLimit, setThermalFreqLimit] = useState(95);

  /* Modal state for creating power plan */
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("EO Custom Performance");
  const [newPlanBaseScheme, setNewPlanBaseScheme] = useState("High performance");
  const [newPlanCpuMin, setNewPlanCpuMin] = useState(100);
  const [newPlanCpuMax, setNewPlanCpuMax] = useState(100);
  const [newPlanCooling, setNewPlanCooling] = useState<"Active" | "Passive">("Active");

  /* Modal state for adding custom application */
  const [addAppOpen, setAddAppOpen] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppCategory, setNewAppCategory] = useState("GAMES");

  /* Filtered eligible background applications */
  const visiblePlans = useMemo(() => {
    const q = query.toLowerCase();
    return ramSummary.plans.filter(
      (p) => p.app.name.toLowerCase().includes(q) || p.app.title.toLowerCase().includes(q),
    );
  }, [ramSummary.plans, query]);
  const manualPlans = visiblePlans.filter((p) => p.status === "ELIGIBLE");
  const selectedPlan = ramSummary.plans.find((p) => p.app.name === selectedApp && p.status === "ELIGIBLE")
    ?? ramSummary.plans.find((p) => p.status === "ELIGIBLE");

  const applyMode = (m: RamMode) => {
    if (modeBusy || m === mode) return;
    setModeBusy(true);
    setRamState({ mode: m });
    window.setTimeout(() => setModeBusy(false), 350);
    const next = summarize(
      SAMPLE_APPS,
      { mode: m, foregroundProtection: fg, manualMb: ram.manualMb, excluded: ram.excluded },
      sys,
      standbyPurged,
    );
    toast.success(`RAM Limiter Mode: ${m}`, {
      description:
        m === "MANUAL"
          ? "Manual mode active. Set an independent target for each background application."
          : `${next.limited} background apps retargeted · ${fmtMb(next.reclaimMb)} reclaimable. (Simulated)`,
    });
  };
  const requestMode = (m: string) => {
    if (m === "AGGRESSIVE" && mode !== "AGGRESSIVE") setAggressiveConfirm(true);
    else applyMode(m as RamMode);
  };

  /* Handlers */
  const handleRefresh = () => {
    simulate("Refresh");
    toast.info("AI Optimization Refreshed", {
      description: "Sample hardware metrics and optimization telemetry synchronized.",
    });
  };

  const handleSimulateStandbyFlush = () => {
    if (standbyPurged) return;
    const purged = ramSummary.standbyMb;
    setRamState({ standbyPurged: true });
    toast.success("Standby Memory Purged", {
      description: `Purged ${fmtMb(purged)} inactive standby cache. Free RAM: ${fmtMb(ramSummary.availableMb + purged)}. (Simulated)`,
    });
  };

  const handleResetRamLimiter = () => {
    setRamState({ ...RAM_DEFAULTS });
    toast.info("RAM Limiter Reset", {
      description: "Restored recommended defaults (Auto mode, 10 MIN interval, Foreground shield active, manual targets cleared).",
    });
  };

  const handleResetWorkloadOptimizer = () => {
    setWorkloadOptions({
      "Foreground CPU priority boost": true,
      "Anti-Lag affinity isolation": true,
      "Suspend background updaters": true,
      "Standby memory refresh on launch": true,
    });
    setBgCpuThrottlePercent(25);
    toast.info("Workload Optimizer Reset", {
      description: "Restored recommended defaults (Foreground boost, Affinity lock, 25% throttle).",
    });
  };

  const handleSaveWorkloadProfile = () => {
    const primaryName = activeWorkloads[0]?.name || "Default Workload";
    const profileSummary = `${primaryName} · Foreground Boost, Affinity Lock, ${bgCpuThrottlePercent}% Throttle`;
    if (!savedProfiles.includes(profileSummary)) {
      setSavedProfiles((prev) => [profileSummary, ...prev]);
    }
    toast.success("Workload Profile Saved", {
      description: `Saved configuration profile with ${bgCpuThrottlePercent}% background CPU throttle. (Simulated)`,
    });
  };

  const handleResetPowerGovernor = () => {
    setCpuGovernor(true);
    setAutoPowerPlan(true);
    setThermalFreqLimit(95);
    toast.info("Power Plan Governor Reset", {
      description: "Restored recommended defaults (Dynamic Governor active, Automatic Power Plan selection enabled).",
    });
  };

  const handleActivatePowerPlan = (p: string) => {
    setActivePowerPlan(p);
    toast.success(`Power Plan Activated: ${p}`, {
      description: `Enforced ${p} as the active system power scheme. (Simulated)`,
    });
  };

  // Launch workload with automatic compatible profile activation
  const handleLaunchWorkload = (workload: EligibleWorkload) => {
    if (activeWorkloads.some((w) => w.name === workload.name)) {
      // Stop running workload
      setActiveWorkloads((prev) => prev.filter((w) => w.name !== workload.name));
      toast.info(`Workload Terminated: ${workload.name}`, {
        description: "Restored safe background execution priorities.",
      });
      if (activeWorkloads.length <= 1 && autoPowerPlan) {
        setActivePowerPlan("Balanced");
      }
    } else {
      // Launch workload and activate compatible profile
      const newEntry: ActiveWorkloadState = {
        name: workload.name,
        category: workload.category,
        profile: workload.compatibleProfile,
        pid: Math.floor(1000 + Math.random() * 9000),
      };
      setActiveWorkloads((prev) => [...prev, newEntry]);
      toast.success(`Workload Launched: ${workload.name}`, {
        description: `Automatic Profile Activated: ${workload.compatibleProfile}. (Simulated)`,
      });
      if (autoPowerPlan) {
        setActivePowerPlan("AI Max Performance");
      }
    }
  };

  const handleStopWorkload = (workloadName: string) => {
    setActiveWorkloads((prev) => prev.filter((w) => w.name !== workloadName));
    toast.info(`Workload Terminated: ${workloadName}`, {
      description: "Safe state restored. Normal background priorities resumed.",
    });
    if (activeWorkloads.length <= 1 && autoPowerPlan) {
      setActivePowerPlan("Balanced");
    }
  };

  const handleAddCustomApp = () => {
    const raw = newAppName.trim();
    if (!raw) return;

    // Prevent unsupported system critical applications from receiving arbitrary profiles
    const systemCritical = ["explorer.exe", "dwm.exe", "csrss.exe", "svchost.exe", "winlogon.exe", "lsass.exe", "services.exe"];
    const cleanName = raw.toLowerCase().endsWith(".exe") ? raw : `${raw}.exe`;

    if (systemCritical.includes(cleanName.toLowerCase())) {
      toast.error("Unsupported Process", {
        description: `${cleanName} is a system critical component and cannot be assigned workload profiles.`,
      });
      return;
    }

    // Determine compatible profile based on selected category
    let profile = "High-Priority Execution & Anti-Lag Affinity";
    if (newAppCategory === "CREATIVE") {
      profile = "Multi-Thread CPU Affinity & Standby Memory Shield";
    } else if (newAppCategory === "VIDEO AI") {
      profile = "GPU Compute Boost & Background Throttle";
    } else if (newAppCategory === "EMULATORS") {
      profile = "Virtualization Thread Isolation & High Timer Resolution";
    }

    const appDisplayName = cleanName.replace(/\.exe$/i, "");
    setEligibleWorkloads((prev) => [
      ...prev,
      {
        name: appDisplayName,
        category: newAppCategory as EligibleWorkload["category"],
        exe: cleanName,
        compatibleProfile: profile,
      },
    ]);

    toast.success("Custom Workload Registered", {
      description: `Registered ${cleanName} under ${newAppCategory} with ${profile}.`,
    });
    setNewAppName("");
    setAddAppOpen(false);
  };

  const handleCreatePowerPlan = () => {
    if (!newPlanName.trim()) return;
    const name = newPlanName.trim();
    const newPlan: PowerPlanItem = {
      name,
      guid: `custom-${Date.now()}`,
      type: "CUSTOM_USER",
      description: `User Custom: Base ${newPlanBaseScheme}, ${newPlanCpuMin}%-${newPlanCpuMax}% CPU, ${newPlanCooling} cooling.`,
      cpuMin: newPlanCpuMin,
      cpuMax: newPlanCpuMax,
      cooling: newPlanCooling,
    };
    setPowerPlans((prev) => [newPlan, ...prev]);
    setActivePowerPlan(name);
    setPlanModalOpen(false);
    toast.success("Power Plan Created & Activated", {
      description: `Enforced ${name} (${newPlanCpuMin}%-${newPlanCpuMax}% CPU state). (Simulated)`,
    });
  };

  // Dynamic auto actions count
  const autoActionCount =
    (aiMasterEnabled ? 1 : 0) +
    (workloadOptions["Foreground CPU priority boost"] ? 1 : 0) +
    (cpuGovernor ? 1 : 0) +
    (autoPowerPlan ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <PageHeader
        title="AI Optimization"
        badges={
          <>
            <Badge tone="cyan">3 MODULES</Badge>
            <Badge tone="warning">SAMPLE DATA</Badge>
            <Badge tone={aiMasterEnabled ? "success" : "muted"}>
              {aiMasterEnabled ? "AI READY" : "AI PAUSED"}
            </Badge>
          </>
        }
        sub="Sample RAM limits, workload profiles and power recommendations; confirmation required."
      />

      {/* 2. Top Navigation Toolbar */}
      <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
        <Segmented
          label="AI module"
          options={["RAM LIMITER", "WORKLOAD OPTIMIZATION", "POWER PLAN OPTIMIZATION"]}
          value={mod}
          onChange={setMod}
        />
        <div className="flex items-center gap-3">
          <Btn size="sm" variant="ghost" onClick={handleRefresh}>
            Refresh
          </Btn>
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <Label className="text-[10.5px] font-bold tracking-wider text-muted-foreground">
              MASTER AI
            </Label>
            <Toggle
              label="Master AI Optimization"
              on={aiMasterEnabled}
              onChange={(v) => {
                setAiMasterEnabled(v);
                toast.info(v ? "Master AI Enabled" : "Master AI Paused", {
                  description: v
                    ? "Autonomous optimization engine resumed."
                    : "Autonomous optimization engine safely paused.",
                });
              }}
            />
          </div>
        </div>
      </Card>

      {/* 3. StatTiles */}
      <StatTiles
        items={[
          {
            label: "RAM USAGE · SAMPLE",
            value: standbyPurged ? "32%" : "38%",
            sub: `${SYSTEM_RAM_GB} GB system memory`,
          },
          { label: "AUTO ACTIONS", value: autoActionCount },
          { label: "BACKGROUND APPS", value: eligibleBgApps.length },
          { label: "ACTIVE WORKLOADS", value: activeWorkloads.length },
          { label: "SAFE", value: 6, tone: "success" },
          { label: "MEDIUM RISK", value: 1, tone: "warning" },
          { label: "HIGH RISK", value: 0, tone: "danger" },
        ]}
      />

      {/* 4. Sub-Module Status Banner */}
      <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">{mod}</span> · Passive monitoring ·
          Foreground shield
        </div>
        <Badge tone={aiMasterEnabled ? "success" : "muted"}>
          {aiMasterEnabled ? "AI READY" : "AI PAUSED"}
        </Badge>
      </Card>

      {/* 5. Dynamic Module Content */}
      <div
        key={mod}
        className={cn(
          "eo-swap space-y-4 transition-opacity duration-200",
          !aiMasterEnabled && "opacity-60 pointer-events-none"
        )}
      >
        {/* ── SUB-OPTIMIZATION A: RAM LIMITER ── */}
        {mod === "RAM LIMITER" && (
          <>
            <Card
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: "repeat(5,1fr) auto" } as React.CSSProperties}
            >
              {[
                ["ENGINE", "RAM Limiter (sample)"],
                ["ACTIVE MODE", mode],
                ["STRATEGY", mode === "MANUAL" ? "Per-Application Manual Limits" : "Working-set trim & standby purge"],
                ["LIMITED APPS", `${ramSummary.limited} limited · ${ramSummary.protectedCount} protected`],
                ["STATUS", aiMasterEnabled ? "Monitoring · simulated" : "Disabled"],
              ].map(([k, v]) => (
                <div key={k}>
                  <Label className="text-[10px]">{k}</Label>
                  <div key={v} className="eo-swap text-[13px] font-semibold">{v}</div>
                </div>
              ))}
              <Badge tone={aiMasterEnabled ? "cyan" : "muted"}>
                {aiMasterEnabled ? "RAM CONTROL: ON" : "RAM CONTROL: OFF"}
              </Badge>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-1">
                <Label as="h2" className="text-foreground">
                  PROFILE / TARGET CONFIGURATION
                </Label>
                <Badge tone="success">
                  <span key={mode} className="eo-swap">
                    {mode === "MANUAL" ? "MANUAL APPLICATION MODE" : `${mode} PRESET ACTIVE`}
                  </span>
                </Badge>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Per-application working-set targets are recalculated from system memory, memory pressure, app category and focus whenever the mode changes. Foreground applications and critical Windows processes are never limited. Targets are a preview — the browser cannot limit real processes.
              </p>
              <div className="mb-3 flex flex-wrap items-center gap-4">
                <div className={cn("flex items-center gap-2", modeBusy && "pointer-events-none")} aria-busy={modeBusy}>
                  <Label>ACTIVE MODE</Label>
                  <Segmented
                    label="RAM limiter mode"
                    options={RAM_MODES}
                    value={mode}
                    onChange={requestMode}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label>AUTO TRIM INTERVAL</Label>
                  <Chips
                    options={["5 MIN", "10 MIN", "15 MIN", "30 MIN"]}
                    value={trimInterval}
                    onChange={(v) => setRamState({ trimInterval: v })}
                  />
                </div>
                <span className="ml-auto flex items-center gap-2">
                  <Label>FOREGROUND PROTECTION</Label>
                  <Toggle
                    label="Foreground protection"
                    on={fg}
                    onChange={(v) => {
                      setRamState({ foregroundProtection: v });
                      toast.info(v ? "Foreground Shield On" : "Foreground Shield Off", {
                        description: v
                          ? "The app in focus is exempt from RAM targets."
                          : "The app in focus now receives a target like other background apps. (Simulated)",
                      });
                    }}
                  />
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-foreground">
                  SEARCH RUNNING BACKGROUND APPLICATIONS
                </Label>
                <Btn size="sm" onClick={() => setAddAppOpen(true)}>
                  + Add custom app
                </Btn>
              </div>
              <SearchBox
                placeholder="Search eligible background applications…"
                value={query}
                onChange={setQuery}
              />
            </Card>

            {/* AUTOMATIC PRESET CARD: Displayed when in AUTO, LIGHT, or AGGRESSIVE mode (RAM slider is hidden) */}
            {mode !== "MANUAL" && (
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Label as="h2" className="text-foreground font-bold">
                      AUTOMATIC {mode} PRESET ACTIVE
                    </Label>
                    <Badge tone="success">SIMULATED ENFORCEMENT</Badge>
                  </div>
                  <Btn size="sm" variant="outline" disabled={standbyPurged} onClick={handleSimulateStandbyFlush}>
                    <Trash2 aria-hidden="true" className="h-3 w-3 mr-1" />
                    Purge Standby ({standbyPurged ? "Clean" : fmtMb(ramSummary.standbyMb)})
                  </Btn>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  {mode === "AUTO" &&
                    "Adaptive Working-Set Trim — targets follow memory pressure: almost no trimming below 60%, progressively tighter targets up to 90%, foreground applications stay responsive."}
                  {mode === "LIGHT" &&
                    "Gentle Maintenance — keeps about 85% of each background working set and purges half of the standby cache. Ideal for general desktop multitasking."}
                  {mode === "AGGRESSIVE" &&
                    "Aggressive Background Trimming — keeps about 55% of each background working set (never below the app's safe floor) and purges the full standby cache. Maximizes free RAM for competitive games."}
                </p>
                {mode === "AUTO" && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Label>SIMULATED MEMORY PRESSURE</Label>
                    <Chips
                      label="Simulated memory pressure"
                      options={PRESSURE_OPTIONS.map(([l]) => l)}
                      value={PRESSURE_OPTIONS.find(([, v]) => v === ram.pressure)?.[0] ?? "NORMAL 62%"}
                      onChange={(l) => {
                        const v = PRESSURE_OPTIONS.find(([x]) => x === l)?.[1] ?? 0.62;
                        setRamState({ pressure: v });
                      }}
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 gap-3 border-t border-border pt-3 text-[11.5px]">
                  <div>
                    <Label className="text-[10px]">AUTO TRIM INTERVAL</Label>
                    <div className="font-semibold text-foreground">{trimInterval}</div>
                  </div>
                  <div>
                    <Label className="text-[10px]">STANDBY CACHE PURGE</Label>
                    <div className="font-semibold text-cyan tabular-nums">
                      {standbyPurged ? "Clean (0 MB)" : `${fmtMb(ramSummary.standbyMb)} Pending`}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">PENDING RECLAIM</Label>
                    <div className="font-semibold text-foreground tabular-nums">
                      <CountUp value={ramSummary.reclaimMb} /> MB · {ramSummary.limited} apps
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">FOREGROUND SHIELD</Label>
                    <div className={cn("font-semibold", fg ? "text-success" : "text-warning")}>
                      {fg ? "Active · Protected" : "Exemptions Off"}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* MANUAL MODE: RAM Slider is displayed ONLY in Manual mode for individually selected application */}
            {mode === "MANUAL" && (
              <>
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground">SELECT APPLICATION FOR INDEPENDENT RAM LIMIT</Label>
                    <Badge tone="cyan">{manualPlans.length} ELIGIBLE BACKGROUND APPS</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {manualPlans.map((p) => {
                      const isSelected = selectedPlan?.app.name === p.app.name;
                      return (
                        <button
                          type="button"
                          key={p.app.name}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedApp(p.app.name)}
                          className={cn(
                            "flex flex-col gap-1 p-2.5 rounded-lg border cursor-pointer transition-colors text-left text-[12px]",
                            isSelected
                              ? "border-cyan/60 bg-cyan/10 shadow-sm shadow-cyan/10"
                              : "border-border bg-window hover:border-border-strong"
                          )}
                        >
                          <div className="flex w-full items-center justify-between font-semibold">
                            <span className="truncate">{p.app.name}</span>
                            <Badge tone={isSelected ? "cyan" : "muted"}>{p.manualOverride ? "CUSTOM" : p.app.category}</Badge>
                          </div>
                          <div className="flex w-full items-center justify-between text-[11px] text-muted-foreground">
                            <span>{p.app.workingSetMb} MB current</span>
                            <span className="font-mono text-cyan font-bold tabular-nums">{p.targetMb} MB target</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {selectedPlan && selectedPlan.targetMb !== null && (
                  <RamLimiterPanel
                    key={selectedPlan.app.name}
                    appName={selectedPlan.app.name}
                    workingSetMb={selectedPlan.app.workingSetMb}
                    savedMb={selectedPlan.targetMb}
                    defaultMb={defaultManualMb(selectedPlan.app, sys)}
                    overridden={selectedPlan.manualOverride}
                    onSave={(mb) => {
                      setRamState((s) => ({ manualMb: { ...s.manualMb, [selectedPlan.app.name]: mb } }));
                      toast.success("Manual RAM Target Saved", {
                        description: `${selectedPlan.app.name}: ${fmtMb(mb)} working-set target. Other apps unchanged. (Simulated)`,
                      });
                    }}
                    onReset={() => {
                      setRamState((s) => {
                        const next = { ...s.manualMb };
                        delete next[selectedPlan.app.name];
                        return { manualMb: next };
                      });
                      toast.info("Limit Reset", {
                        description: `Reset ${selectedPlan.app.name} to its ${fmtMb(defaultManualMb(selectedPlan.app, sys))} default target.`,
                      });
                    }}
                    mode={mode}
                    foreground={fg}
                    standbyPurged={standbyPurged}
                    standbyMb={ramSummary.standbyMb}
                    freeMb={ramSummary.availableMb + (standbyPurged ? standbyPurgeMb(mode, sys) : 0)}
                    onPurgeStandby={handleSimulateStandbyFlush}
                  />
                )}
              </>
            )}

            {/* Configured targets for the active mode */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground">CONFIGURED {mode} TARGETS</Label>
                <Badge tone="cyan">{ramSummary.limited} TARGETS · {fmtMb(ramSummary.reclaimMb)} RECLAIM</Badge>
              </div>
              <div className="space-y-2">
                {ramSummary.plans
                  .filter((p) => p.targetMb !== null)
                  .map((p) => (
                    <div
                      key={p.app.name}
                      className="grid items-center gap-3 eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
                      style={{ gridTemplateColumns: "minmax(0,1fr) 160px 150px auto" }}
                    >
                      <span className="font-semibold">{p.app.name}</span>
                      <Bar value={((p.targetMb ?? 0) / p.app.workingSetMb) * 100} />
                      <span className="text-right font-mono text-[11.5px] text-muted-foreground tabular-nums">
                        {p.targetMb} / {p.app.workingSetMb} MB
                      </span>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRamState((s) => ({ excluded: [...s.excluded, p.app.name] }));
                          toast.info("App Excluded", { description: `${p.app.name} will not receive a RAM target.` });
                        }}
                        title="Exclude this app from the RAM Limiter"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </Btn>
                    </div>
                  ))}
                {ramSummary.limited === 0 && (
                  <p className="text-xs text-muted-foreground">No application receives a target in this configuration.</p>
                )}
              </div>
            </Card>

            {/* Eligible Background Applications */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground">ELIGIBLE BACKGROUND APPLICATIONS</Label>
                <Badge tone={fg ? "success" : "warning"}>{fg ? "FOREGROUND SHIELD ACTIVE" : "FOREGROUND SHIELD OFF"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Sample running processes with the target the {mode} configuration assigns. The app in focus is shielded while protection is on; critical Windows processes are never limited. No process is ever terminated.
              </p>
              <div className="space-y-1.5">
                {visiblePlans.map((p) => (
                  <div
                    key={p.app.name}
                    className="flex flex-wrap items-center justify-between gap-2 eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.app.name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.app.title}</span>
                      <span className="font-mono text-[10.5px] text-muted-foreground">PID: {p.app.pid}</span>
                      <Badge tone="muted">{p.app.category}</Badge>
                      {p.app.foreground && <Badge tone="cyan">IN FOCUS</Badge>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11.5px] text-muted-foreground">
                        {p.app.workingSetMb} MB working set
                      </span>
                      <span className="w-[92px] text-right font-mono text-[11.5px] font-bold text-cyan tabular-nums">
                        {p.targetMb === null ? "—" : <><CountUp value={p.targetMb} /> MB</>}
                      </span>
                      <span className="w-[64px] text-right font-mono text-[11px] text-success tabular-nums">
                        {p.reclaimMb > 0 ? `−${p.reclaimMb} MB` : "±0 MB"}
                      </span>
                      {p.status === "ELIGIBLE" && <Badge tone="success">ELIGIBLE</Badge>}
                      {p.status === "PROTECTED_FOREGROUND" && <Badge tone="cyan">PROTECTED · FOCUS</Badge>}
                      {p.status === "CRITICAL" && <Badge tone="warning">CRITICAL · NEVER LIMITED</Badge>}
                      {p.status === "EXCLUDED" && <Badge tone="muted">EXCLUDED</Badge>}
                      {!p.app.critical && !(p.app.foreground && fg) && (
                        <Toggle
                          label={`Apply RAM target to ${p.app.name}`}
                          on={p.status === "ELIGIBLE"}
                          onChange={(on) =>
                            setRamState((s) => ({
                              excluded: on ? s.excluded.filter((x) => x !== p.app.name) : [...s.excluded, p.app.name],
                            }))
                          }
                        />
                      )}
                      {p.status === "ELIGIBLE"
                        ? <span title="Background eligible"><ShieldCheck className="h-4 w-4 text-success" /></span>
                        : <span title="Not limited"><ShieldAlert className="h-4 w-4 text-muted-foreground" /></span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Modal
              open={aggressiveConfirm}
              onClose={() => setAggressiveConfirm(false)}
              title="Apply Aggressive preset?"
              sub="Simulated preview. No Windows process is changed."
              tone="warning"
              width="max-w-md"
              icon={<Flame className="h-4 w-4" />}
              footer={
                <>
                  <Btn variant="ghost" onClick={() => setAggressiveConfirm(false)}>Cancel</Btn>
                  <Btn
                    variant="primary"
                    onClick={() => {
                      setAggressiveConfirm(false);
                      applyMode("AGGRESSIVE");
                    }}
                  >
                    Apply Aggressive
                  </Btn>
                </>
              }
            >
              <p className="text-[12.5px] text-muted-foreground">
                Background apps keep only about 55% of their working set (never below each app's safe floor), and the full standby cache is purged every cycle. Heavily trimmed apps may feel slower when you switch back to them. Foreground and critical Windows processes stay protected.
              </p>
            </Modal>
          </>
        )}

        {/* ── SUB-OPTIMIZATION B: WORKLOAD OPTIMIZATION ── */}
        {mod === "WORKLOAD OPTIMIZATION" && (
          <>
            {/* Multiple Running Workloads Card */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Label className="text-foreground">CURRENTLY RUNNING WORKLOADS</Label>
                  <Badge tone={activeWorkloads.length > 0 ? "success" : "muted"}>
                    {activeWorkloads.length} ACTIVE
                  </Badge>
                </div>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const valorant = eligibleWorkloads.find((w) => w.name === "Valorant");
                    if (valorant) handleLaunchWorkload(valorant);
                  }}
                >
                  {activeWorkloads.some((w) => w.name === "Valorant")
                    ? "Stop Valorant Simulation"
                    : "Simulate Launch: Valorant"}
                </Btn>
              </div>

              {activeWorkloads.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border-strong p-4">
                  <span className="text-xl">🎮</span>
                  <div>
                    <div className="text-[13px] font-bold">NO SUPPORTED WORKLOAD RUNNING</div>
                    <p className="text-xs text-muted-foreground">
                      Launch any supported game, emulator, creative tool, or video AI workload to automatically activate its compatible profile.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeWorkloads.map((aw) => (
                    <div
                      key={aw.name}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan/40 bg-cyan/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">⚡</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-foreground">
                              {aw.name.toUpperCase()}
                            </span>
                            <Badge tone="cyan">{aw.category}</Badge>
                            <span className="font-mono text-[10.5px] text-muted-foreground">PID: {aw.pid}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Profile: <span className="text-foreground font-medium">{aw.profile}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="success">OPTIMIZING · ACTIVE</Badge>
                        <Btn size="sm" variant="ghost" onClick={() => handleStopWorkload(aw.name)}>
                          Stop Workload
                        </Btn>
                      </div>
                    </div>
                  ))}
                  {activeWorkloads.length > 1 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-window text-[11px] text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-cyan" />
                      <span>
                        Autonomous Conflict Resolution: Multiple simultaneous workloads active. Independent CPU core affinity partitions and priority boosts applied without conflict.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Installed Workload Inventory Card */}
            <Card>
              <Label className="mb-3 text-foreground">INSTALLED WORKLOAD INVENTORY</Label>
              <div className="mb-3 flex items-center justify-between">
                <Chips
                  options={["ALL", "GAMES", "CREATIVE", "VIDEO AI", "EMULATORS"]}
                  value={inv}
                  onChange={setInv}
                />
                <Btn size="sm" onClick={() => setAddAppOpen(true)}>
                  + Add custom app
                </Btn>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {eligibleWorkloads
                  .filter((x) => inv === "ALL" || x.category === inv)
                  .map((w) => {
                    const isRunning = activeWorkloads.some((aw) => aw.name === w.name);
                    return (
                      <div
                        key={w.name}
                        className={cn(
                          "flex flex-col justify-between gap-2 eo-list-row rounded-lg border bg-window p-3 text-[12.5px]",
                          isRunning ? "border-cyan/60 bg-cyan/5 shadow-sm shadow-cyan/10" : "border-border"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{w.name}</span>
                          <Badge tone={isRunning ? "cyan" : "muted"}>{w.category}</Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1" title={w.compatibleProfile}>
                          {w.compatibleProfile}
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                          <span className="font-mono text-[10px] text-subtle truncate max-w-[140px]">
                            {w.exe}
                          </span>
                          <Btn
                            size="sm"
                            variant={isRunning ? "ghost" : "outline"}
                            onClick={() => handleLaunchWorkload(w)}
                          >
                            {isRunning ? "Stop" : "Simulate Launch"}
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <Btn
                size="sm"
                variant="ghost"
                className="mt-3"
                onClick={() => {
                  simulate("Force rescan inventory");
                  toast.info("Inventory Rescanned", {
                    description: "Rescanned installed games, emulators and creative applications.",
                  });
                }}
              >
                Force rescan inventory
              </Btn>
            </Card>

            {/* Target Configuration Card */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-foreground">WORKLOAD PROFILE PARAMETERS</Label>
                <div className="flex items-center gap-2">
                  <Btn size="sm" variant="ghost" onClick={handleResetWorkloadOptimizer}>
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset to recommended
                  </Btn>
                  <Btn size="sm" variant="primary" onClick={handleSaveWorkloadProfile}>
                    Save profile
                  </Btn>
                </div>
              </div>

              {/* 2x2 Grid of Sub-Optimization Toggles */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  "Foreground CPU priority boost",
                  "Anti-Lag affinity isolation",
                  "Suspend background updaters",
                  "Standby memory refresh on launch",
                ].map((o) => (
                  <div
                    key={o}
                    className="flex items-center justify-between eo-list-row rounded-lg border border-border bg-window px-3 py-2.5 text-[12.5px]"
                  >
                    <span>{o}</span>
                    <Toggle
                      label={o}
                      on={workloadOptions[o] !== false}
                      onChange={(v) => setWorkloadOptions((s) => ({ ...s, [o]: v }))}
                    />
                  </div>
                ))}
              </div>

              {/* Background CPU Throttle Slider (10% to 50%) */}
              <div className="rounded-lg border border-border bg-window p-3">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-foreground text-xs">
                    BACKGROUND CPU THROTTLE LIMIT
                  </Label>
                  <span className="font-mono text-xs font-bold text-cyan">
                    {bgCpuThrottlePercent}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Caps background task CPU usage to eliminate frame stutters while running games or creative workloads. (Default: 25%)
                </p>
                <RangeSlider
                  id="eo-bg-cpu-throttle"
                  label="Background CPU throttle limit"
                  value={bgCpuThrottlePercent}
                  onChange={setBgCpuThrottlePercent}
                  min={10}
                  max={50}
                  step={5}
                  valueText={`${bgCpuThrottlePercent}%`}
                  marks={[
                    { value: 10, label: "10% MIN" },
                    { value: 25, label: "25% RECOMMENDED", tone: "success" },
                    { value: 50, label: "50% MAX" },
                  ]}
                />
              </div>
            </Card>

            {/* Saved Custom Profiles */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground">SAVED CUSTOM PROFILES</Label>
                <Badge tone="cyan">{savedProfiles.length} SAVED</Badge>
              </div>
              <div className="space-y-1.5">
                {savedProfiles.map((sp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-[12.5px]"
                  >
                    <span className="font-mono text-[12px]">{sp}</span>
                    <Badge tone="success">SAVED</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── SUB-OPTIMIZATION C: POWER PLAN OPTIMIZATION ── */}
        {mod === "POWER PLAN OPTIMIZATION" && (
          <>
            <Card>
              <Label className="mb-3 text-cyan">AI POWER RECOMMENDATION</Label>
              <div className="grid grid-cols-4 gap-3.5">
                {[
                  ["RECOMMENDED PLAN:", "AI Max Performance"],
                  ["HARDWARE:", "Desktop · 8C/16T"],
                  [
                    "WORKLOAD:",
                    activeWorkloads.length > 0
                      ? activeWorkloads.map((w) => w.name).join(", ")
                      : "Idle / Multitasking",
                  ],
                  ["CURRENT ACTIVE:", activePowerPlan],
                ].map(([k, v]) => (
                  <div key={k}>
                    <Label className="text-[10px]">{k}</Label>
                    <div className="text-[13px] font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn variant="primary" onClick={() => setPlanModalOpen(true)}>
                  + Create power plan
                </Btn>
                <Btn onClick={() => handleActivatePowerPlan("Balanced")}>
                  Restore Balanced
                </Btn>
                <Btn variant="ghost" onClick={handleRefresh}>
                  Refresh
                </Btn>
              </div>
            </Card>

            {/* Power Plan Governor Configuration Card */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-foreground">POWER PLAN GOVERNOR CONFIGURATION</Label>
                  <Badge tone="cyan">ACTIVE TUNING</Badge>
                </div>
                <Btn size="sm" variant="ghost" onClick={handleResetPowerGovernor}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset to defaults
                </Btn>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center justify-between eo-list-row rounded-lg border border-border bg-window px-3 py-2.5 text-[12.5px]">
                  <div>
                    <div className="font-semibold">Dynamic CPU Power Governor</div>
                    <p className="text-[10.5px] text-muted-foreground">
                      Automated CPU frequency scaling based on real-time execution load
                    </p>
                  </div>
                  <Toggle
                    label="Dynamic CPU Power Governor"
                    on={cpuGovernor}
                    onChange={setCpuGovernor}
                  />
                </div>
                <div className="flex items-center justify-between eo-list-row rounded-lg border border-border bg-window px-3 py-2.5 text-[12.5px]">
                  <div>
                    <div className="font-semibold">Automatic Power Plan Selection</div>
                    <p className="text-[10.5px] text-muted-foreground">
                      Auto-switches to AI Max Performance when games/workloads start, restores on exit
                    </p>
                  </div>
                  <Toggle
                    label="Automatic Power Plan Selection"
                    on={autoPowerPlan}
                    onChange={(v) => {
                      setAutoPowerPlan(v);
                      toast.info(v ? "Automatic Power Plan Engaged" : "Manual Plan Selection Active", {
                        description: v
                          ? "Power plan will now track running games and creative workloads automatically."
                          : "Manual selection will remain active regardless of launched workloads.",
                      });
                    }}
                  />
                </div>
              </div>

              {/* Thermal Frequency Limit Slider */}
              <div className="rounded-lg border border-border bg-window p-3">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-foreground text-xs">
                    THERMAL FREQUENCY LIMIT
                  </Label>
                  <span className="font-mono text-xs font-bold text-cyan">
                    {thermalFreqLimit}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Limits peak turbo clock speed during sustained thermal saturation to prevent thermal throttling and unstable frametimes.
                </p>
                <RangeSlider
                  id="eo-thermal-limit"
                  label="Thermal frequency limit"
                  value={thermalFreqLimit}
                  onChange={setThermalFreqLimit}
                  min={80}
                  max={100}
                  step={1}
                  valueText={`${thermalFreqLimit}%`}
                  marks={[
                    { value: 80, label: "80%" },
                    { value: 95, label: "95% RECOMMENDED", tone: "success" },
                    { value: 100, label: "100% UNLIMITED" },
                  ]}
                />
              </div>
            </Card>

            <Card className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-bold">AUTO ENABLE ON WINDOWS STARTUP</div>
                <p className="text-xs text-muted-foreground">Continuous Power Governor Enforcement</p>
              </div>
              <Toggle
                label="Power plan startup policy"
                on={autoStartupPower}
                onChange={setAutoStartupPower}
              />
            </Card>

            <Card>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-foreground">ERROR OPTIMIZER AI</Label>
                    <Badge tone="cyan">MACHINE-SPECIFIC POLICIES</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Calibrated AI power schemes designed for balanced thermal headroom and latency reduction.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Btn
                    size="sm"
                    onClick={() => handleActivatePowerPlan("AI Battery Efficiency")}
                  >
                    AI battery efficiency
                  </Btn>
                  <Btn
                    size="sm"
                    variant="primary"
                    onClick={() => handleActivatePowerPlan("AI Max Performance")}
                  >
                    AI max performance
                  </Btn>
                </div>
              </div>
            </Card>

            {/* All Supported Power Plans */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-foreground">SUPPORTED POWER PLANS</Label>
                  <GuideTip id="ai.power" />
                  <Badge tone={autoPowerPlan ? "cyan" : "warning"}>
                    {autoPowerPlan ? "AUTO GOVERNOR ACTIVE" : "MANUAL SELECTION"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Select any plan to manually enforce
                </span>
              </div>
              <div className="space-y-1.5">
                {powerPlans.map((p) => {
                  const isActive = activePowerPlan === p.name;
                  return (
                    <div
                      key={p.name}
                      className={cn(
                        "flex items-center justify-between eo-list-row rounded-lg border bg-window px-3 py-2.5 text-[12.5px]",
                        isActive ? "border-cyan/60 bg-cyan/5 shadow-sm shadow-cyan/10" : "border-border"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{p.name}</span>
                          <Badge tone={p.type === "AI_CUSTOM" ? "cyan" : p.type === "CUSTOM_USER" ? "warning" : "muted"}>
                            {p.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{p.description}</p>
                      </div>
                      {isActive ? (
                        <Badge tone="success">ACTIVE</Badge>
                      ) : (
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => handleActivatePowerPlan(p.name)}
                        >
                          Activate
                        </Btn>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Simulated Notice */}
      <SimNotice />

      {/* Modal: Create Power Plan */}
      <Modal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Create new custom Windows power plan"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={handleCreatePowerPlan}>
              Create & verify in Windows
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Cols cols="1fr 1fr">
            <div>
              <Label className="mb-1">PLAN NAME</Label>
              <input
                className="h-9 w-full rounded-lg border border-border bg-window px-3 text-sm focus:outline-none focus:border-cyan"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="e.g. EO Custom Gaming Plan"
              />
            </div>
            <div>
              <Label className="mb-1">DUPLICATE REAL BASE SCHEME</Label>
              <PremiumSelect
                label="Duplicate real base scheme"
                value={newPlanBaseScheme}
                onChange={setNewPlanBaseScheme}
                options={["High performance", "Balanced", "Ultimate Performance"]}
              />
            </div>
          </Cols>

          <Cols cols="1fr 1fr">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>MIN PROCESSOR STATE</Label>
                <span className="font-mono text-xs text-cyan">{newPlanCpuMin}%</span>
              </div>
              <RangeSlider
                id="eo-new-plan-min"
                label="Minimum processor state"
                value={newPlanCpuMin}
                onChange={setNewPlanCpuMin}
                min={5}
                max={100}
                step={5}
                valueText={`${newPlanCpuMin}%`}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>MAX PROCESSOR STATE</Label>
                <span className="font-mono text-xs text-cyan">{newPlanCpuMax}%</span>
              </div>
              <RangeSlider
                id="eo-new-plan-max"
                label="Maximum processor state"
                value={newPlanCpuMax}
                onChange={setNewPlanCpuMax}
                min={50}
                max={100}
                step={5}
                valueText={`${newPlanCpuMax}%`}
              />
            </div>
          </Cols>

          <div>
            <Label className="mb-1">SYSTEM COOLING POLICY</Label>
            <PremiumSelect
              label="System Cooling Policy"
              value={newPlanCooling}
              onChange={(v) => setNewPlanCooling(v as "Active" | "Passive")}
              options={["Active", "Passive"]}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Active cooling increases fan speed before slowing the processor. Supported natively via Windows powercfg.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal: Add Custom Application */}
      <Modal
        open={addAppOpen}
        onClose={() => setAddAppOpen(false)}
        title="Register Custom Target Application"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setAddAppOpen(false)}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={handleAddCustomApp}>
              Register Application
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label className="mb-1">APPLICATION EXECUTABLE NAME</Label>
            <input
              className="h-9 w-full rounded-lg border border-border bg-window px-3 text-sm focus:outline-none focus:border-cyan"
              placeholder="e.g. premiere.exe or blender.exe"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1">CATEGORY</Label>
            <PremiumSelect
              label="Workload Category"
              value={newAppCategory}
              onChange={setNewAppCategory}
              options={["GAMES", "CREATIVE", "VIDEO AI", "EMULATORS"]}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Custom registered applications will automatically be protected by the RAM Limiter and receive high-priority thread allocation. System critical processes cannot be registered.
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ── RAM Limiter panel: slider + numeric field edit one draft; Save commits it to the shared store ── */
function RamLimiterPanel({
  appName,
  workingSetMb,
  savedMb,
  defaultMb,
  overridden,
  onSave,
  onReset,
  mode,
  foreground,
  standbyPurged,
  standbyMb,
  freeMb,
  onPurgeStandby,
}: {
  appName: string;
  workingSetMb: number;
  savedMb: number;
  defaultMb: number;
  overridden: boolean;
  onSave: (mb: number) => void;
  onReset: () => void;
  mode: string;
  foreground: boolean;
  standbyPurged: boolean;
  standbyMb: number;
  freeMb: number;
  onPurgeStandby: () => void;
}) {
  const [draftMb, setDraftMb] = useState(savedMb);
  const [unit, setUnit] = useState<"MB" | "GB">("MB");
  // Follow external changes (reset, reload) while there is no unsaved edit.
  const [lastSaved, setLastSaved] = useState(savedMb);
  if (lastSaved !== savedMb) {
    setLastSaved(savedMb);
    setDraftMb(savedMb);
  }
  const dirty = draftMb !== savedMb;
  const atDefault = draftMb === defaultMb;
  const share = (draftMb / (SYSTEM_RAM_GB * 1024)) * 100;
  const aboveWs = draftMb > workingSetMb;
  const isGb = unit === "GB";
  const shown = isGb ? draftMb / 1024 : draftMb;
  const setShown = (v: number) => setDraftMb(clampManualMb(isGb ? v * 1024 : v));
  return (
    <Card className="eo-hero eo-ram">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="eo-auto-mark" aria-hidden="true">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-black uppercase">RAM Limiter · Manual Target</h2>
              <GuideTip id="ai.ram-limiter" />
              <Badge tone="warning">MANUAL LIMIT</Badge>
            </div>
            <p className="mt-0.5 max-w-xl text-[11.5px] text-muted-foreground">
              Set the working-set target of {appName} only — other applications keep their own targets. In this prototype the target is a simulated preview; a native Windows service would enforce it.
            </p>
          </div>
        </div>
        <span aria-live="polite">
          {dirty ? (
            <Badge tone="warning">UNSAVED CHANGE</Badge>
          ) : overridden ? (
            <Badge tone="success">SAVED · SIMULATED</Badge>
          ) : (
            <Badge tone="muted">DEFAULT TARGET</Badge>
          )}
        </span>
      </div>

      <div className="eo-ram-grid mt-4 grid gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Label className="text-[10px]">TARGET APPLICATION</Label>
              <div className="text-[13px] font-bold">{appName}</div>
              <div className="text-[11px] text-muted-foreground">Current working set · {workingSetMb} MB</div>
            </div>
            <div className="text-right">
              <Label className="text-[10px]">SYSTEM MEMORY · SAMPLE</Label>
              <div className="text-[13px] font-semibold">
                {SYSTEM_RAM_GB} GB total · {fmtMb(freeMb)} free
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-end gap-3">
            <div className="eo-ram-readout tabular-nums" aria-hidden="true">
              {isGb ? (draftMb / 1024).toFixed(2) : draftMb}
              <span>{unit}</span>
            </div>
            <div className="pb-1.5 text-[11px] text-muted-foreground">
              target working set · {share.toFixed(1)}% of system memory
              <div className={cn("font-bold", aboveWs ? "text-warning" : atDefault ? "text-success" : "text-cyan")}>
                {aboveWs
                  ? `Above current working set (${workingSetMb} MB) — nothing will be trimmed`
                  : atDefault
                    ? "DEFAULT TARGET"
                    : `${draftMb > defaultMb ? "+" : "−"}${Math.abs(draftMb - defaultMb)} MB vs default · −${workingSetMb - draftMb} MB vs current`}
              </div>
            </div>
          </div>

          <RangeSlider
            id="eo-ram-limit"
            className="mt-3"
            label={`RAM target for ${appName}`}
            value={draftMb}
            onChange={(v) => setDraftMb(clampManualMb(v))}
            min={MANUAL_MIN_MB}
            max={MANUAL_MAX_MB}
            step={32}
            valueText={fmtMb(draftMb)}
            marks={[
              { value: MANUAL_MIN_MB, label: `MIN ${MANUAL_MIN_MB} MB` },
              { value: defaultMb, label: `DEFAULT ${defaultMb} MB`, tone: "success" },
              { value: 4096, label: "4 GB" },
              { value: MANUAL_MAX_MB, label: "MAX 8 GB" },
            ]}
          />

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] font-bold text-subtle">
              <span>LIMIT IN CONTEXT OF {SYSTEM_RAM_GB} GB SYSTEM MEMORY</span>
              <span>{share.toFixed(1)}%</span>
            </div>
            <div
              className="eo-ram-context"
              style={{ "--share": `${share}%` } as React.CSSProperties}
            >
              <span />
            </div>
          </div>
        </div>

        <div className="eo-ram-side flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="eo-ram-number" className="eo-label text-[10px] text-muted-foreground">
              EXACT TARGET
            </label>
            <Segmented label="Target unit" options={["MB", "GB"]} value={unit} onChange={(u) => setUnit(u as "MB" | "GB")} />
          </div>
          <NumberField
            key={unit}
            id="eo-ram-number"
            label={`RAM target for ${appName} in ${isGb ? "gigabytes" : "megabytes"}`}
            value={shown}
            onChange={setShown}
            min={isGb ? MANUAL_MIN_MB / 1024 : MANUAL_MIN_MB}
            max={isGb ? MANUAL_MAX_MB / 1024 : MANUAL_MAX_MB}
            step={isGb ? 0.125 : 1}
            decimals={isGb ? 3 : 0}
            unit={unit}
          />
          <p className="text-[10.5px] text-subtle">
            {MANUAL_MIN_MB} MB – 8 GB · arrow keys adjust · Escape restores
          </p>

          <Btn
            size="sm"
            variant="outline"
            disabled={standbyPurged}
            onClick={onPurgeStandby}
            title="Purge unused standby memory cache"
          >
            <Trash2 aria-hidden="true" className="h-3 w-3 mr-1" />
            Purge Standby ({standbyPurged ? "Clean" : fmtMb(standbyMb)})
          </Btn>

          <div className="grid grid-cols-2 gap-2">
            <Btn
              size="sm"
              variant="ghost"
              disabled={!overridden && atDefault}
              onClick={() => {
                setDraftMb(defaultMb);
                onReset();
              }}
              title={`Reset to the default target (${defaultMb} MB)`}
            >
              <RotateCcw aria-hidden="true" className="h-3 w-3" />
              Reset
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              disabled={!dirty}
              onClick={() => setDraftMb(savedMb)}
              title="Discard the change and return to the saved target"
            >
              Cancel
            </Btn>
          </div>
          <Btn variant="primary" size="lg" disabled={!dirty} onClick={() => onSave(draftMb)}>
            Save target
          </Btn>
          <p className="text-[10.5px] text-muted-foreground" aria-live="polite">
            Saved target: {fmtMb(savedMb)} (simulated).
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[11px]">
        <div>
          <Label className="text-[10px]">MODE</Label>
          <div className="font-semibold">{mode} · working-set trim</div>
        </div>
        <div>
          <Label className="text-[10px]">FOREGROUND SHIELD</Label>
          <div
            className={cn(
              "flex items-center gap-1 font-semibold",
              foreground ? "text-success" : "text-warning",
            )}
          >
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            {foreground ? "Protected while in focus" : "Off — limit applies in focus"}
          </div>
        </div>
        <div>
          <Label className="text-[10px]">HOW IT WORKS</Label>
          <div className="text-muted-foreground">
            Pages above the target are trimmed to standby; the app is never closed.
          </div>
        </div>
      </div>
    </Card>
  );
}


/* ───────── BACKUP & RESTORE ───────── */
const TX = [
  ["High Performance Power Plan Activation", "POWER", "Normal", "2026-11-05 10:12", true],
  ["Disable Mouse Acceleration", "INPUT", "Input Optimizer", "2026-11-05 10:13", true],
  ["DNS Resolver Cache Flush", "NETWORK", "Network", "2026-11-05 10:20", false],
  ["Svchost Split Threshold", "REGISTRY", "RAM Registry Values", "2026-11-04 21:44", true],
] as const;

export function BackupRestorePage() {
  const [query, setQuery] = useState("");
  const [f, setF] = useState("ALL");
  const [d, setD] = useState<(typeof TX)[number] | null>(null);
  const [restore, setRestore] = useState(false);
  const [createRp, setCreateRp] = useState(false);
  const rpState = useRestoreState();
  const scenario = PROTECTION_SCENARIOS.find((s) => s.id === rpState.scenario)!;
  const vis = TX.filter(
    (t) =>
      t[0].toLowerCase().includes(query.toLowerCase()) &&
      (f === "ALL" ||
        t[1] === f ||
        (f === "✓ RESTORABLE" && t[4]) ||
        (f === "NON-REVERSIBLE" && !t[4])),
  );
  return (
    <div className="space-y-4">
      <PageHeader
        title="Backup & Restore"
        badges={<Badge tone="cyan">UNIVERSAL TRANSACTION ENGINE</Badge>}
        sub="Sample transaction backups, profile containers and restore points."
        actions={
          <>
            <Btn variant="ghost" onClick={() => simulate("Refresh")}>
              Refresh
            </Btn>
            <Btn variant="primary" onClick={() => setCreateRp(true)}>
              Create restore point
            </Btn>
            <Btn variant="danger" onClick={() => setRestore(true)}>
              Restore entire system
            </Btn>
          </>
        }
      />
      <StatTiles
        items={[
          { label: "TOTAL BACKUPS", value: 14 },
          { label: "PROFILES", value: 3 },
          { label: "OPTIMIZATIONS", value: 9 },
          { label: "REGISTRY VALUES", value: 2 },
          { label: "SYSTEM RESTORE", value: 1, tone: "cyan" },
          { label: "RESTORABLE", value: 13, tone: "success" },
          { label: "NON-REVERSIBLE", value: 1, tone: "warning" },
        ]}
      />
      <Card className="eo-rp-device">
        <div className="min-w-0">
          <SectionTitle
            title="SYSTEM PROTECTION"
            guide="backup.restore-point"
            badge={<Badge tone="warning">SIMULATED DEVICE</Badge>}
            sub={`${SYSTEM_DRIVE.label} · ${scenario.desc}`}
          />
          <p className="-mt-1.5 pl-3 text-[11px] text-subtle">
            Last restore point:{" "}
            {rpState.last ? `“${rpState.last.name}” · ${rpState.last.at} (simulated)` : "none yet"}
          </p>
        </div>
        <Segmented
          label="Simulated System Protection state"
          options={PROTECTION_SCENARIOS.map((s) => s.label)}
          value={scenario.label}
          onChange={(v) => {
            const next = PROTECTION_SCENARIOS.find((s) => s.label === v);
            if (next) setRestoreState({ scenario: next.id });
          }}
        />
      </Card>
      <Card>
        <Label className="mb-3 text-foreground">PROFILE CONTAINERS</Label>
        <div className="grid grid-cols-3 items-stretch gap-3.5">
          {[
            ["Normal", 6],
            ["Input Optimizer", 2],
            ["Network", 1],
          ].map(([n, c]) => (
            <div
              key={n as string}
              className="flex items-center justify-between gap-3 border-r border-border px-3 py-2 last:border-r-0"
            >
              <div>
                <div className="text-[13px] font-bold">{n}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {c} transactions · restorable
                </div>
              </div>
              <Btn size="sm" onClick={() => setRestore(true)}>
                Restore profile
              </Btn>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Cols cols="1fr auto" className="mb-3">
          <SearchBox placeholder="Search transactions…" value={query} onChange={setQuery} />
          <Btn size="sm" variant="ghost" onClick={() => setF("ALL")}>
            Reset filters
          </Btn>
        </Cols>
        <Chips
          options={[
            "ALL",
            "REGISTRY",
            "POWER",
            "INPUT",
            "NETWORK",
            "STORAGE",
            "MEMORY",
            "SERVICES",
            "REPAIR",
            "✓ RESTORABLE",
            "NON-REVERSIBLE",
          ]}
          value={f}
          onChange={setF}
        />
        <Label className="mt-4 mb-2 text-foreground">TRANSACTION HISTORY</Label>
        {vis.length ? (
          <div className="space-y-1.5">
            {vis.map((t) => (
              <button
                key={t[0]}
                onClick={() => setD(t)}
                className="grid w-full items-center gap-3 eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-left text-[12.5px] hover:border-cyan/40"
                style={{ gridTemplateColumns: "minmax(0, 1fr) 80px 110px 120px 120px" }}
              >
                <span className="font-semibold">{t[0]}</span>
                <Badge>{t[1]}</Badge>
                <span className="text-muted-foreground">{t[2]}</span>
                <span className="font-mono text-[11px] text-subtle">{t[3]}</span>
                <Badge tone={t[4] ? "success" : "warning"}>
                  {t[4] ? "✓ RESTORABLE" : "NON-REVERSIBLE"}
                </Badge>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="NO BACKUP TRANSACTIONS RECORDED YET"
            sub="Universal transaction records and state backups will appear here automatically."
          />
        )}
      </Card>
      <SimNotice />
      <Modal
        open={!!d}
        onClose={() => setD(null)}
        title="Transaction details"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setD(null)}>
              Close
            </Btn>
            {d?.[4] && (
              <Btn
                variant="primary"
                onClick={() => {
                  setD(null);
                  setRestore(true);
                }}
              >
                Restore
              </Btn>
            )}
          </>
        }
      >
        {d && (
          <div className="space-y-4">
            <div>
              <KV k="Optimization:" v={d[0]} />
              <KV k="Profile / Module:" v={d[2]} />
              <KV k="Category & Risk:" v={d[1]} />
              <KV k="Timestamp:" v={d[3]} />
              <KV k="Machine Identity:" v="DEMO-PC" />
            </div>
            <Details title="TARGET KEY / PATH & STATE TRANSITION">
              <KV k="Before State:" v="Captured value" />
              <KV k="After State:" v="Applied value" />
            </Details>
            <div>
              <Label className="mb-1 text-cyan">ROLLBACK DIAGNOSTICS</Label>
              <KV k="Rollback Method:" v="Snapshot restore" />
              <KV k="Status:" v={d[4] ? "Available" : "Not reversible"} />
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={restore}
        onClose={() => setRestore(false)}
        title="Proceed with restore?"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setRestore(false)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                setRestore(false);
                simulate("Restore");
              }}
            >
              Proceed with restore
            </Btn>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Restored values are read back from Windows and verified (simulated in this prototype).
        </p>
      </Modal>
      <RestorePointDialog
        open={createRp}
        onClose={() => setCreateRp(false)}
        defaultName="Manual restore point"
      />
    </div>
  );
}

/* ───────── SETTINGS ───────── */
function Row({
  t,
  s,
  children,
}: {
  t: string | undefined;
  s: string | undefined;
  children: ReactNode;
}) {
  return (
    <div
      className="grid items-center gap-3.5 border-b border-border py-2 last:border-0"
      style={{ gridTemplateColumns: "minmax(150px, 1fr) auto" }}
    >
      <div>
        <div className="text-[13px] font-semibold">{t}</div>
        <div className="text-[11.5px] text-muted-foreground">{s}</div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-end">{children}</div>
    </div>
  );
}
function Tog({ init = true }: { init?: boolean }) {
  const [v, setV] = useState(init);
  return <Toggle on={v} onChange={setV} />;
}
function Seg({ o, d }: { o: string[]; d: string }) {
  const [v, setV] = useState(d);
  return <Chips options={o} value={v} onChange={setV} />;
}
function Rng({ d = 60, label = "Setting level" }: { d?: number; label?: string }) {
  const [v, setV] = useState(d);
  return (
    <div className="flex w-64 items-center gap-2">
      <RangeSlider
        className="flex-1"
        label={label}
        value={v}
        onChange={setV}
        min={0}
        max={100}
        step={1}
      />
      <span className="w-8 text-right font-mono text-[11px] tabular-nums">{v}</span>
    </div>
  );
}
const ACCENTS = ["Cyan", "Electric blue", "Emerald", "Amber", "Red", "Teal"];
export function SettingsPage() {
  const appearance = useAppearance();
  const acc = appearance.accent;
  const setAcc = appearance.setAccent;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Preferences & System Settings"
        sub="Session appearance, simulated startup policies and safety preferences."
        actions={
          <Btn
            variant="ghost"
            onClick={() => {
              setAcc(0);
              appearance.setReduced(false);
              appearance.setAnimations(true);
              appearance.setTransitions(true);
              appearance.setDepth("MEDIUM (3D)");
              resetEffects();
              simulate("Reset appearance defaults");
            }}
          >
            Reset defaults
          </Btn>
        }
      />
      <Card>
        <SectionTitle
          title="STARTUP & BACKGROUND RUNTIME"
          right={
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => simulate("Refresh sample startup status")}
            >
              Refresh status
            </Btn>
          }
        />
        <Row t="Start with Windows" s="Simulated Windows startup registration">
          <Tog init={false} />
        </Row>
        <Row t="Start Minimized" s="Launch silently to background">
          <Tog init={false} />
        </Row>
        <Details inline title="STARTUP STATUS" hint="Sample registration & bootstrap">
          <div className="grid grid-cols-3 gap-3.5">
            {[
              ["Windows Startup", "Not registered"],
              ["Startup Bootstrap", "Idle"],
              ["Last Startup", "—"],
            ].map(([k, v]) => (
              <KV key={k} k={k} v={v} />
            ))}
          </div>
        </Details>
      </Card>
      <Card>
        <SectionTitle title="AI ENGINE STARTUP POLICIES" />
        {[
          ["AI Power Plan Auto-Enable", "Activate scheme on Windows logon"],
          ["AI Workload Optimization", "Safe passive monitoring on boot"],
          ["AI RAM Limiter", "Memory pressure monitor on boot"],
          ["Smart Auto Optimize", "Simulated scheduler reconciliation"],
        ].map(([t, s]) => (
          <Row key={t} t={t} s={s}>
            <Tog init={false} />
          </Row>
        ))}
      </Card>
      <Card>
        <SectionTitle
          title="APPEARANCE & THEME ENGINE"
          sub="Accent, display and motion preferences for this session."
        />
        <Row t="Solid Accent Studio" s="Global brand & 100% unified hue">
          <div className="flex gap-1.5">
            {ACCENTS.map((c, i) => (
              <button
                key={c}
                aria-label={`${c} accent`}
                title={`${c} accent`}
                aria-pressed={acc === i}
                onClick={() => setAcc(i)}
                className={cn(
                  "h-6 w-6 rounded-full border-2",
                  acc === i ? "border-foreground" : "border-transparent",
                )}
                data-swatch={i}
              />
            ))}
          </div>
        </Row>
        <Details inline title="ACCENT & GLASS" hint="Fine-tuning and gradient direction">
          <Row t="Hue / Saturation / Brightness" s="Fine-tune the accent">
            <Rng label="Accent hue, saturation and brightness" />
          </Row>
          <Row t="Gradient Theme Studio" s="Multi-color atmospheric spectrum">
            <Seg
              o={["LEFT → RIGHT", "TOP → BOTTOM", "DIAGONAL", "DIAGONAL REV", "RADIAL"]}
              d="DIAGONAL"
            />
          </Row>
          <Row t="Gradient Animation" s="Slow atmospheric motion">
            <Seg o={["OFF", "SUBTLE (SLOW)", "DYNAMIC"]} d="SUBTLE (SLOW)" />
          </Row>
          <Row t="Window Glass Transparency" s="How much of the window behind is visible">
            <Rng d={20} label="Window glass transparency" />
          </Row>
          <Row t="Card / Panel Opacity" s="Opacity of internal cards and panels">
            <Rng d={90} label="Card and panel opacity" />
          </Row>
        </Details>
        <Row t="UI Animations" s="Tactile controls and depth transitions">
          <Toggle
            label="UI Animations"
            on={appearance.animations}
            onChange={appearance.setAnimations}
          />
        </Row>
        <Row t="Page Transitions" s="Directional fade between pages">
          <Toggle
            label="Page Transitions"
            on={appearance.transitions}
            onChange={appearance.setTransitions}
          />
        </Row>
        <Row t="Reduced Motion" s="Also respects your system accessibility preference">
          <Toggle label="Reduced Motion" on={appearance.reduced} onChange={appearance.setReduced} />
        </Row>
        <Row t="3D Spatial Depth" s="Restrained surface tilt and elevation">
          <Chips
            options={["LOW (2D)", "MEDIUM (3D)", "HIGH (DEEP)"]}
            value={appearance.depth}
            onChange={appearance.setDepth}
          />
        </Row>
      </Card>
      <EffectsSettingsCard />
      <Card>
        <SectionTitle title="PERFORMANCE & TELEMETRY ENGINE" />
        <Row t="System Performance Mode" s="Adaptive resource consumption budget">
          <Seg o={["AUTO", "LOW RESOURCE (SMOOTH)", "BALANCED", "HIGH TELEMETRY"]} d="AUTO" />
        </Row>
        <Row t="Monitor Update Interval" s="Live hardware metric polling rate">
          <Seg o={["1s (Fast)", "2s", "3s (Default)", "5s", "10s (Eco)"]} d="3s (Default)" />
        </Row>
      </Card>
      <Card>
        <SectionTitle title="SAFETY GUARDRAILS & TRANSACTIONAL RECOVERY" guide="settings.safety" />
        <Row t="Confirm Medium Risk" s="Prompt before moderate system changes">
          <Tog />
        </Row>
        <Row t="Confirm High Risk" s="Enforce dialogs on sensitive parameters">
          <Tog />
        </Row>
        <Row t="Automatic Transactional Backup" s="Pre-execution registry & service snapshots">
          <Tog />
        </Row>
      </Card>
      <Card>
        <SectionTitle title="AUDIT LOGGING & LOG RETENTION" />
        <Row t="Detailed Execution Logs" s="Record verbose API return codes & traces">
          <Tog init={false} />
        </Row>
        <Row t="Log Retention Period" s="Automatic cleanup of older transaction logs">
          <Seg o={["3 Days", "7 Days (Default)", "14 Days", "30 Days"]} d="7 Days (Default)" />
        </Row>
      </Card>
      <Card>
        <SectionTitle title="SYSTEM SPECIFICATIONS & VERSION" />
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Version", "V3 + V4 (prototype)"],
            ["Build Identifier", "browser-blueprint"],
            ["Optimization Architecture", "Unified Safe IPC Service"],
          ].map(([k, v]) => (
            <KV key={k} k={k} v={v} />
          ))}
        </div>
      </Card>
      <SimNotice>
        Appearance changes apply throughout this session. Windows and safety settings remain
        simulated; nothing is saved or changed on your computer.
      </SimNotice>
    </div>
  );
}

/* ───────── ABOUT ───────── */
export function AboutPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [d, setD] = useState<(typeof CATALOG)[number] | null>(null);
  const cats = ["ALL", ...Array.from(new Set(CATALOG.map((c) => c.cat)))];
  const vis = CATALOG.filter(
    (c) => (cat === "ALL" || c.cat === cat) && c.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <PageHeader
        title="About Error Optimizer"
        sub="Explore sample hardware, optimization profiles and recovery details."
      />
      <Card
        className="grid items-center gap-4"
        style={{ gridTemplateColumns: "auto 1fr auto" } as React.CSSProperties}
      >
        <Badge tone="warning">PROTOTYPE · SAMPLE STATE</Badge>
        <span className="text-xs text-muted-foreground">
          Core optimization engine loaded (prototype)
        </span>
        <span className="text-[11px] font-bold">
          INTEGRITY: <span className="text-muted-foreground">NOT ASSESSED (PROTOTYPE)</span>
        </span>
      </Card>
      <Card>
        <SectionTitle
          title="CONNECT WITH ERROR OPTIMIZER"
          sub="Official community, content and social channels."
        />
        <div className="grid grid-cols-2 items-stretch gap-3.5">
          {[
            ["DISCORD", "Community Server", "JOIN DISCORD →"],
            ["YOUTUBE", "@Errorfftamil", "WATCH YOUTUBE →"],
            ["INSTAGRAM", "@errorexeff", "OPEN INSTAGRAM →"],
            ["KICK", "Live Streaming", "WATCH ON KICK →"],
          ].map(([a, b, c]) => (
            <div
              key={a}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2"
            >
              <Label className="text-cyan">{a}</Label>
              <div className="mt-1 text-sm font-bold">{b}</div>
              <Btn size="sm" onClick={() => simulate(c)}>
                {c}
              </Btn>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle
          title="HARDWARE & ENGINE STATUS"
          right={
            <Btn size="sm" onClick={() => simulate("Rescan hardware")}>
              Rescan hardware
            </Btn>
          }
        />
        <div className="grid grid-cols-3 gap-3.5">
          {[
            ["LOCAL MACHINE", "DEMO-PC"],
            ["PLATFORM ARCHITECTURE", "x64"],
            ["CURRENT OS", HW.os],
            ["WINDOWS COMPATIBILITY", "Supported"],
            ["CPU / PROCESSOR", HW.cpu],
            ["GRAPHICS ADAPTER (GPU)", HW.gpu],
            ["PHYSICAL MEMORY (RAM)", "32 GB"],
            ["POWER SOURCE", "AC"],
            ["OPTIMIZATION ENGINE", "Loaded"],
            ["BACKEND SERVICE", "Simulated"],
            ["PROFILE ENGINE", "7 profiles"],
            ["TRANSACTIONAL BACKUP", "Armed"],
          ].map(([k, v]) => (
            <div key={k}>
              <Label className="text-[10px]">{k}</Label>
              <div className="text-[12.5px] font-semibold">{v}</div>
            </div>
          ))}
        </div>
      </Card>
      <StatTiles
        items={[
          { label: "TOTAL CATALOG", value: CATALOG.length },
          { label: "APPLICABLE", value: 22, tone: "cyan" },
          { label: "ALREADY OPT.", value: 6, tone: "success" },
          { label: "PENDING", value: 16, tone: "warning" },
          { label: "SAFE", value: CATALOG.filter((c) => c.risk === "LOW").length, tone: "success" },
          {
            label: "MEDIUM RISK",
            value: CATALOG.filter((c) => c.risk === "MEDIUM").length,
            tone: "warning",
          },
          { label: "HIGH RISK", value: 0, tone: "danger" },
        ]}
      />
      <Card>
        <SectionTitle title="SYSTEM OPTIMIZATION PROFILES" sub="7 Specialized Engine Profiles" />
        <div className="flex flex-wrap gap-2">
          {PROFILES.map((p) => (
            <div
              key={p}
              className="eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-center text-[12px] font-bold"
            >
              {p}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle
          title="OPTIMIZATION CATALOG & KNOWLEDGE BASE"
          sub="Registered catalog metadata (not the complete operation inventory)."
        />
        <Cols cols="2fr auto" className="mb-3 items-center">
          <SearchBox placeholder="Search the catalog…" value={q} onChange={setQ} />
          <span className="text-[10px] font-bold tracking-widest text-subtle">SORT: NAME</span>
        </Cols>
        <Chips options={cats} value={cat} onChange={setCat} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {vis.map((c) => (
            <button
              key={c.id}
              onClick={() => setD(c)}
              className="flex items-center justify-between eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-left text-[12.5px] hover:border-cyan/40"
            >
              <span>{c.name}</span>
              <span className="flex gap-1.5">
                <Badge>{c.cat}</Badge>
                <RiskBadge risk={c.risk} />
              </span>
            </button>
          ))}
        </div>
      </Card>
      <Modal
        open={!!d}
        onClose={() => setD(null)}
        title={d?.name ?? ""}
        width="max-w-3xl"
        footer={<Btn onClick={() => setD(null)}>Close details</Btn>}
      >
        {d &&
          [
            "SECTION 1: OVERVIEW & PURPOSE",
            "SECTION 2: WHAT DOES IT DO?",
            "SECTION 3: WHY IS IT USED?",
            "SECTION 4: WHAT IT CHANGES",
            "SECTION 5: CURRENT STATE vs TARGET OPTIMIZED STATE",
            "SECTION 6: APPLICABILITY & HARDWARE ENVIRONMENT",
            "SECTION 7: RISK CLASSIFICATION & SAFETY GUARANTEES",
            "SECTION 8: BACKUP & TRANSACTIONAL ROLLBACK",
            "SECTION 9: POST-EXECUTION READBACK & VERIFICATION",
          ].map((s) => (
            <div key={s} className="mb-3 rounded-lg border border-border bg-window p-3">
              <Label className="text-cyan">{s}</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.includes("RISK") ? (
                  <RiskBadge risk={d.risk} />
                ) : (
                  "Populated from OptimizationCatalog metadata in the native app."
                )}
              </p>
            </div>
          ))}
      </Modal>
    </div>
  );
}

/* ───────── PERFORMANCE TUNING ───────── */
export function PerformanceTuningPage() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Performance Tuning"
        sub="Simulated CPU and GPU tuning for supported hardware; no changes are applied."
        actions={
          <>
            <Btn variant="ghost" onClick={() => simulate("Revert to stock")}>
              Revert to stock
            </Btn>
            <Btn onClick={() => simulate("Rescan")}>Rescan</Btn>
          </>
        }
      />
      <Cols cols="1fr 1fr" gap={14} className="items-stretch">
        {[
          ["CPU PERFORMANCE", HW.cpu, "42°C"],
          ["GPU PERFORMANCE", HW.gpu, "44°C"],
        ].map(([t, n, temp]) => (
          <Card key={t}>
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-foreground">{t}</Label>
              <Badge tone="success">SUPPORTED</Badge>
            </div>
            <div className="text-sm font-semibold">{n}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <KV k="CURRENT STATE" v="Stock" />
              <KV k="TEMPERATURE" v={temp} />
            </div>
            <Btn
              variant="primary"
              className="mt-4 w-full"
              onClick={() => {
                setActive(t ?? "");
                simulate(`Review ${t}`);
              }}
            >
              Start {t?.split(" ")[0]} tuning
            </Btn>
          </Card>
        ))}
      </Cols>
      <StatTiles
        items={[
          { label: "THERMAL PROTECTION", value: "Active", tone: "success" },
          { label: "STABILITY MONITORING", value: "Ready", tone: "success" },
          { label: "POWER SOURCE", value: "AC" },
        ]}
      />
      <Card>
        <SectionTitle
          title="SESSION FLOW"
          sub={
            active
              ? `${active} · simulated compatibility review`
              : "Start CPU or GPU tuning to begin"
          }
          right={
            <Btn
              variant="danger"
              size="sm"
              disabled={!active}
              onClick={() => {
                setActive(null);
                simulate("Stop tuning preview");
              }}
            >
              Stop
            </Btn>
          }
        />
        <Stepper
          label="Tuning session flow"
          steps={["Check", "Test", "Tune", "Verify", "Decide"]}
          current={active ? 0 : -1}
        />
        {active && (
          <>
            <Bar value={20} className="mt-3" />
            <p className="mt-2 text-xs text-cyan">No tuning or benchmark has been performed.</p>
          </>
        )}
      </Card>
      <Details title="ADVANCED DETAILS — HARDWARE ENVELOPE & VERIFICATION DETAILS">
        <p className="text-xs text-muted-foreground">
          Evaluation Policy: evaluates maximum verified stable performance — never unverified
          overclocking.
        </p>
      </Details>
      <SimNotice />
    </div>
  );
}

// RAM (machine) and GPU registry values for the Registry Values overview.
// Transcribed from the original WPF engines: MachineRegistryValueEngine.cs (RAM page)
// and GpuRegistryValueEngine.cs (GPU page). Current values are the engines' own
// "unset / Windows default" fallbacks, and targets are what each engine computes
// for the SAMPLE hardware below. Nothing here reads or writes a real registry.
import { HW } from "./data";

export type RegRisk = "SAFE" | "LOW" | "MEDIUM" | "DIAGNOSTIC" | "EXPERIMENTAL";
/** applicable = offered for the sample hardware; diagnostic = read-only, never applied. */
export type RegStatus = "applicable" | "not-applicable" | "diagnostic";

export interface RegistryValueEntry {
  id: string;
  valueName: string;
  title: string;
  /** Group key within its section (RAM group or GPU vendor group). */
  group: string;
  /** Original engine category / sub-category label. */
  category: string;
  path: string;
  type: "REG_DWORD" | "REG_SZ";
  description: string;
  risk: RegRisk;
  restart: boolean;
  hardware: string;
  driver?: string;
  /** Sample current value — the engine's unset/default readback. */
  current: string;
  /** Sample target value the engine computes for the sample hardware. */
  target: string;
  status: RegStatus;
  /** Why it is (or is not) offered for the sample hardware. */
  reason: string;
}

export interface RegistryGroup {
  key: string;
  title: string;
  tag: string;
  note?: string;
}

export interface RegistryHardware {
  ramGb: number;
  logicalCores: number;
  laptop: boolean;
  gpuVendor: "NVIDIA" | "AMD" | "Intel";
  gpuName: string;
  gpuCount: number;
  supportsHags: boolean;
  /** Optimization profile the GPU engine scans with (source default: Normal). */
  profile: string;
}

/** Sample hardware the targets below are computed for (matches `HW` in data.ts). */
export const SAMPLE_REGISTRY_HW: RegistryHardware = {
  ramGb: 32,
  logicalCores: 16,
  laptop: false,
  gpuVendor: "NVIDIA",
  gpuName: HW.gpu,
  gpuCount: 1,
  supportsHags: true,
  profile: "Normal",
};

/* ───────── RAM: Service Host split threshold tiers ───────── */

/** Validated RAM tiers → SvcHostSplitThresholdInKB DWORD (from `_ramToCandidateMapping`). */
export const RAM_TIER_MAP: readonly (readonly [gb: number, dword: number])[] = [
  [4, 0x00400000],
  [8, 0x00800000],
  [12, 0x00c00000],
  [16, 0x01000000],
  [24, 0x01800000],
  [32, 0x02000000],
  [64, 0x04000000],
  [96, 0x06000000],
  [128, 0x08000000],
];

/** Same rule as `CalculateNearestRamTier`: within 0.6 GB matches, else nearest (higher wins ties). */
export function nearestRamTier(gb: number): number {
  const tiers = RAM_TIER_MAP.map(([t]) => t);
  const exact = tiers.find((t) => Math.abs(gb - t) <= 0.6);
  if (exact !== undefined) return exact;
  return [...tiers].sort((a, b) => Math.abs(a - gb) - Math.abs(b - gb) || b - a)[0] ?? 32;
}

export function svchostThreshold(gb: number): number {
  const tier = nearestRamTier(gb);
  return RAM_TIER_MAP.find(([t]) => t === tier)?.[1] ?? 0x02000000;
}

export const hex8 = (n: number) => `0x${(n >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;

/** Windows default when SvcHostSplitThresholdInKB is unset (engine fallback readback). */
export const SVCHOST_DEFAULT_KB = 0x00380000;

/* ───────── RAM registry values (MachineRegistryValueEngine) ───────── */

export const RAM_GROUPS: RegistryGroup[] = [
  { key: "memory", title: "Memory management", tag: "SERVICE HOST · I/O" },
  { key: "scheduling", title: "CPU & multimedia scheduling", tag: "PRIORITY · MMCSS" },
  { key: "network", title: "Network profile", tag: "MULTIMEDIA" },
];

function ramValues(hw: RegistryHardware = SAMPLE_REGISTRY_HW): RegistryValueEntry[] {
  const svc = svchostThreshold(hw.ramGb);
  const ioBytes = hw.ramGb >= 16 ? 536870912 : Math.floor((hw.ramGb * 1024 ** 3) / 16);
  const highCore = hw.logicalCores >= 8;
  return [
    {
      id: "val.svchost.split_threshold",
      valueName: "SvcHostSplitThresholdInKB",
      title: "Service Host process splitting & memory threshold",
      group: "memory",
      category: "Memory / Service Host",
      path: "HKLM\\SYSTEM\\CurrentControlSet\\Control",
      type: "REG_DWORD",
      description:
        "Per-process memory threshold for Windows Service Host (svchost.exe): isolates services on systems with ample RAM, groups them on constrained systems.",
      risk: "MEDIUM",
      restart: true,
      hardware: `Physical RAM · matched to the ${nearestRamTier(hw.ramGb)} GB tier`,
      current: `${hex8(SVCHOST_DEFAULT_KB)} (default, unset)`,
      target: `${hex8(svc)} (${svc.toLocaleString("en-US")} KB)`,
      status: "applicable",
      reason: `Calculated for ${nearestRamTier(hw.ramGb)} GB RAM. Impact must be checked after a restart.`,
    },
    {
      id: "val.memory.io_page_lock_limit",
      valueName: "IoPageLockLimit",
      title: "Direct I/O locked page buffer limit",
      group: "memory",
      category: "Memory Management / I/O Buffering",
      path: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management",
      type: "REG_DWORD",
      description:
        "Maximum number of bytes that can be locked for I/O operations at the same time.",
      risk: "MEDIUM",
      restart: true,
      hardware: "Physical RAM · storage type",
      current: "Default / unset",
      target: `${hex8(ioBytes)} (${Math.round(ioBytes / 1024 ** 2)} MB buffer)`,
      status: "applicable",
      reason:
        hw.ramGb >= 16
          ? "16 GB or more RAM: capped at a 512 MB buffer."
          : "Below 16 GB RAM: one sixteenth of installed memory.",
    },
    {
      id: "val.cpu.priority_separation",
      valueName: "Win32PrioritySeparation",
      title: "CPU thread quantum & foreground scheduling",
      group: "scheduling",
      category: "CPU Scheduling / Responsiveness",
      path: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl",
      type: "REG_DWORD",
      description:
        "How the Windows kernel splits CPU time slices between foreground apps and background threads.",
      risk: "LOW",
      restart: false,
      hardware: hw.laptop ? "Mobile / laptop" : "Desktop / workstation",
      current: "Default / unset",
      target: hw.laptop ? "0x00000026 (balanced, mobile)" : "0x00000028 (short variable quantum)",
      status: "applicable",
      reason: hw.laptop
        ? "Battery-powered: balanced quantum for the mobile thermal envelope."
        : "Desktop: tuned for foreground responsiveness.",
    },
    {
      id: "val.mmcss.system_responsiveness",
      valueName: "SystemResponsiveness",
      title: "Multimedia background CPU reservation",
      group: "scheduling",
      category: "MMCSS / Multimedia Scheduling",
      path: "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile",
      type: "REG_DWORD",
      description:
        "Share of CPU time Windows reserves for low-priority background tasks during games and playback.",
      risk: "LOW",
      restart: false,
      hardware: `${hw.logicalCores} logical cores`,
      current: "Default / unset",
      target: highCore ? "0x00000000 (0% reserved)" : "0x0000000A (10% reserved)",
      status: "applicable",
      reason: highCore
        ? "8+ logical cores: background reservation can go to 0% without starving the UI."
        : "Under 8 logical cores: keeps a balanced 10% reservation.",
    },
    {
      id: "val.network.throttling_index",
      valueName: "NetworkThrottlingIndex",
      title: "Network packet processing throttling index",
      group: "network",
      category: "Network / Multimedia Profile",
      path: "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile",
      type: "REG_DWORD",
      description:
        "Turns off non-multimedia packet rate limiting during high-throughput transfers.",
      risk: "LOW",
      restart: false,
      hardware: "Gigabit / high-speed network adapter",
      current: "Default / unset",
      target: "0xFFFFFFFF (throttling off)",
      status: "applicable",
      reason: "Removes the legacy 10-packets-per-millisecond limit on modern adapters.",
    },
  ];
}

/* ───────── GPU registry values (GpuRegistryValueEngine) ───────── */

export const GPU_REG_GROUPS: RegistryGroup[] = [
  { key: "universal", title: "Universal GPU", tag: "SYSTEM-WIDE" },
  { key: "nvidia", title: "NVIDIA-specific", tag: "GEFORCE / RTX" },
  { key: "amd", title: "AMD-specific", tag: "RADEON / ADRENALIN" },
  {
    key: "diagnostic",
    title: "Diagnostic configuration",
    tag: "READ-ONLY",
    note: "Diagnostic values are shown for reference and are never applied.",
  },
];

const GAMES =
  "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games";
const GFX = "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers";
const DWM = "HKLM\\SOFTWARE\\Microsoft\\Windows\\Dwm";
const ADAPTER =
  "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\<adapter>";
const AMD_CN = "HKLM\\SOFTWARE\\AMD\\CN";

function gpuValues(hw: RegistryHardware = SAMPLE_REGISTRY_HW): RegistryValueEntry[] {
  const nvidia = hw.gpuVendor === "NVIDIA";
  const amd = hw.gpuVendor === "AMD";
  const nvMulti = nvidia && hw.gpuCount > 1;
  const mpoProfile = ["Pro", "Ultimate", "MaxPerformance"].includes(hw.profile);
  const lowRes = hw.profile === "Debloat" || hw.profile === "BiosSafe";
  const na = "Not applicable";
  const vendor = (on: boolean, name: string) =>
    on ? `${name} GPU in sample hardware (${hw.gpuName}).` : `No ${name} GPU in sample hardware.`;

  const amdEntry = (
    e: Omit<RegistryValueEntry, "group" | "status" | "reason" | "current"> & { amdCurrent: string },
  ): RegistryValueEntry => {
    const { amdCurrent, ...rest } = e;
    return {
      ...rest,
      group: "amd",
      current: amd ? amdCurrent : na,
      status: amd ? "applicable" : "not-applicable",
      reason: vendor(amd, "AMD"),
    };
  };

  const tdr = (
    id: string,
    valueName: string,
    title: string,
    description: string,
    current: string,
    target: string,
  ): RegistryValueEntry => ({
    id,
    valueName,
    title,
    group: "diagnostic",
    category: "Diagnostic Recovery",
    path: GFX,
    type: "REG_DWORD",
    description,
    risk: "DIAGNOSTIC",
    restart: true,
    hardware: "All Windows GPUs (diagnostic workloads)",
    driver: "Standard display subsystem",
    current,
    target,
    status: "diagnostic",
    reason: "Reference for long compute or rendering workloads; never applied by the engine.",
  });

  return [
    // ── Universal
    {
      id: "gpu.universal.system_responsiveness",
      valueName: "SystemResponsiveness",
      title: "System responsiveness",
      group: "universal",
      category: "Multimedia Scheduling",
      path: "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile",
      type: "REG_DWORD",
      description:
        "Share of scheduling time Windows reserves for background tasks versus foreground games and media.",
      risk: "SAFE",
      restart: true,
      hardware: "All Windows systems",
      driver: "Any graphics driver",
      current: "20% (Windows default)",
      target: lowRes ? "10% (0x0A)" : "0% (0x00)",
      status: "applicable",
      reason: `Target follows the ${hw.profile} profile (Debloat and BIOS Safe keep 10%).`,
    },
    {
      id: "gpu.mmcss.gpu_priority",
      valueName: "GPU Priority",
      title: "MMCSS games GPU priority",
      group: "universal",
      category: "MMCSS Task Priority",
      path: GAMES,
      type: "REG_DWORD",
      description: "GPU scheduling priority for apps recognized as games or DirectX renderers.",
      risk: "SAFE",
      restart: true,
      hardware: "DirectX 11 / 12 GPU",
      driver: "WDDM 2.0+",
      current: "8 (default)",
      target: "8 (0x08)",
      status: "applicable",
      reason: "Written explicitly so the value is no longer left unset.",
    },
    {
      id: "gpu.mmcss.priority",
      valueName: "Priority",
      title: "MMCSS games CPU task priority",
      group: "universal",
      category: "MMCSS Task Priority",
      path: GAMES,
      type: "REG_DWORD",
      description: "Task priority for game worker threads in the Windows scheduler.",
      risk: "SAFE",
      restart: true,
      hardware: "Multi-core CPU & GPU",
      driver: "Standard Windows scheduler",
      current: "2 (default)",
      target: "6 (0x06)",
      status: "applicable",
      reason: "Raises game thread priority from normal (2) to high (6).",
    },
    {
      id: "gpu.mmcss.scheduling_category",
      valueName: "Scheduling Category",
      title: "Scheduling category",
      group: "universal",
      category: "MMCSS Task Priority",
      path: GAMES,
      type: "REG_SZ",
      description: "Scheduling bucket for gaming and graphics streaming tasks.",
      risk: "SAFE",
      restart: true,
      hardware: "All Windows systems",
      driver: "Standard Windows scheduler",
      current: "Medium (default)",
      target: "High",
      status: "applicable",
      reason: "Places game processes in the high-priority queue.",
    },
    {
      id: "gpu.mmcss.sfio_priority",
      valueName: "SFIO Priority",
      title: "SFIO disk / VRAM I/O priority",
      group: "universal",
      category: "MMCSS Task Priority",
      path: GAMES,
      type: "REG_SZ",
      description: "Sequential file I/O priority for texture streaming and shader cache loads.",
      risk: "SAFE",
      restart: true,
      hardware: "NVMe / SSD storage",
      driver: "Standard storage subsystem",
      current: "Normal (default)",
      target: "High",
      status: "applicable",
      reason: "Prioritizes asset streaming from disk to GPU memory.",
    },
    {
      id: "gpu.universal.hags",
      valueName: "HwSchMode",
      title: "Hardware-accelerated GPU scheduling",
      group: "universal",
      category: "GPU Scheduling Architecture",
      path: GFX,
      type: "REG_DWORD",
      description: "Moves frame scheduling from the CPU to the GPU's own scheduling processor.",
      risk: "SAFE",
      restart: true,
      hardware: "NVIDIA GTX 10xx+ / RTX, AMD RX 5000+, Intel Arc",
      driver: "WDDM 2.7+ required",
      current: "Disabled (Windows default)",
      target: hw.supportsHags ? "Enabled (0x02)" : "Not supported on this GPU",
      status: hw.supportsHags ? "applicable" : "not-applicable",
      reason: hw.supportsHags
        ? `Supported on the sample ${hw.gpuName}.`
        : "Needs a WDDM 2.7+ driver and a compatible GPU.",
    },
    {
      id: "gpu.universal.overlay_test_mode",
      valueName: "OverlayTestMode",
      title: "MPO (multi-plane overlay) display fix",
      group: "universal",
      category: "Desktop Window Manager",
      path: DWM,
      type: "REG_DWORD",
      description:
        "Turns off multi-plane overlays to address stutter, flicker or black screens on multi-monitor setups.",
      risk: "EXPERIMENTAL",
      restart: true,
      hardware: "Discrete GPU (multi-monitor / high refresh)",
      driver: "WDDM 2.0+",
      current: "0x00 (MPO active, default)",
      target: "0x05 (disable MPO)",
      status: mpoProfile ? "applicable" : "not-applicable",
      reason: mpoProfile
        ? `Offered under the ${hw.profile} profile.`
        : "Only offered under the Pro, Ultimate or Maximum Performance profiles.",
    },
    {
      id: "gpu.universal.hardware_fullscreen",
      valueName: "EnableHardwareFullscreen",
      title: "Hardware fullscreen exclusive promotion",
      group: "universal",
      category: "Desktop Window Manager",
      path: DWM,
      type: "REG_DWORD",
      description:
        "Hardware-level fullscreen promotion for borderless and fullscreen DirectX swapchains.",
      risk: "LOW",
      restart: true,
      hardware: "DirectX 11 / 12 GPU",
      driver: "Standard display driver",
      current: "0 (standard)",
      target: "1 (0x01)",
      status: "applicable",
      reason: "Lets flip-model apps bypass desktop composition.",
    },
    {
      id: "gpu.universal.power_attribute",
      valueName: "Attributes",
      title: "GPU power management in Power Options",
      group: "universal",
      category: "Power Configuration",
      path: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\36333b52-d141-42ff-b50f-5405c32b0d36",
      type: "REG_DWORD",
      description: "Shows the hidden graphics power management setting in the active power plan.",
      risk: "SAFE",
      restart: false,
      hardware: "All Windows systems",
      driver: "Standard power subsystem",
      current: "Hidden (default)",
      target: "Visible (0x02)",
      status: "applicable",
      reason: "Visibility only; no power behaviour changes by itself.",
    },
    // ── NVIDIA
    {
      id: "gpu.nvidia.powermizer_enable",
      valueName: "PowerMizerEnable",
      title: "NVIDIA PowerMizer low-latency clocks",
      group: "nvidia",
      category: "Power & Clock Management",
      path: ADAPTER,
      type: "REG_DWORD",
      description: "Disables aggressive PowerMizer clock step-down under active graphics load.",
      risk: hw.laptop ? "MEDIUM" : "LOW",
      restart: true,
      hardware: "NVIDIA GeForce / RTX / GTX / Quadro",
      driver: "NVIDIA Game Ready / Studio driver",
      current: nvidia ? "1 (dynamic clocks)" : na,
      target: "0 (low-latency static clocks)",
      status: nvidia ? "applicable" : "not-applicable",
      reason: vendor(nvidia, "NVIDIA"),
    },
    {
      id: "gpu.nvidia.powermizer_level",
      valueName: "PowerMizerLevel",
      title: "NVIDIA PowerMizer level (max performance)",
      group: "nvidia",
      category: "Power & Clock Management",
      path: ADAPTER,
      type: "REG_DWORD",
      description: "Starts the GPU core and memory at maximum performance P-states.",
      risk: "LOW",
      restart: true,
      hardware: "NVIDIA GeForce / RTX / GTX",
      driver: "NVIDIA display driver",
      current: nvidia ? "0 (dynamic)" : na,
      target: "1 (maximum performance)",
      status: nvidia ? "applicable" : "not-applicable",
      reason: vendor(nvidia, "NVIDIA"),
    },
    {
      id: "gpu.nvidia.perf_level_src",
      valueName: "PerfLevelSrc",
      title: "NVIDIA performance level source",
      group: "nvidia",
      category: "Power & Clock Management",
      path: ADAPTER,
      type: "REG_DWORD",
      description: "Sources driver performance levels from the maximum performance profile.",
      risk: "LOW",
      restart: true,
      hardware: "NVIDIA desktop / high-TDP discrete GPU",
      driver: "NVIDIA display driver",
      current: nvidia ? "0x3333 (dynamic source)" : na,
      target: "0x2222 (static performance)",
      status: nvidia ? "applicable" : "not-applicable",
      reason: vendor(nvidia, "NVIDIA"),
    },
    {
      id: "gpu.nvidia.force_p2p",
      valueName: "ForceP2P",
      title: "NVIDIA CUDA direct peer-to-peer (P2P)",
      group: "nvidia",
      category: "CUDA & Compute Acceleration",
      path: ADAPTER,
      type: "REG_DWORD",
      description: "Direct PCIe memory transfers between multiple NVIDIA GPUs without CPU staging.",
      risk: "LOW",
      restart: true,
      hardware: "Multi-GPU NVIDIA (SLI / NVLink / dual RTX)",
      driver: "NVIDIA CUDA driver",
      current: nvMulti ? "0 (disabled)" : `${na} (single GPU)`,
      target: "1 (enabled)",
      status: nvMulti ? "applicable" : "not-applicable",
      reason: nvMulti
        ? `${hw.gpuCount} NVIDIA GPUs in sample hardware.`
        : "Needs two or more NVIDIA GPUs; the sample has one.",
    },
    // ── AMD
    amdEntry({
      id: "gpu.amd.enable_telemetry",
      valueName: "EnableTelemetry",
      title: "AMD Software background telemetry",
      category: "Privacy & Background Services",
      path: AMD_CN,
      type: "REG_DWORD",
      description: "Turns off background diagnostic data collection in AMD Radeon Software.",
      risk: "SAFE",
      restart: false,
      hardware: "AMD Radeon GPU & Software",
      driver: "AMD Adrenalin driver",
      amdCurrent: "Enabled (default)",
      target: "Disabled (0x00)",
    }),
    amdEntry({
      id: "gpu.amd.enable_crash_reporting",
      valueName: "EnableCrashReporting",
      title: "AMD crash reporting service",
      category: "Privacy & Background Services",
      path: AMD_CN,
      type: "REG_DWORD",
      description: "Stops automatic crash dump uploads to AMD when an app closes unexpectedly.",
      risk: "SAFE",
      restart: false,
      hardware: "AMD Radeon GPU",
      driver: "AMD Adrenalin driver",
      amdCurrent: "Enabled (default)",
      target: "Disabled (0x00)",
    }),
    amdEntry({
      id: "gpu.amd.enable_customer_feedback",
      valueName: "EnableCustomerFeedback",
      title: "AMD user experience feedback",
      category: "Privacy & Background Services",
      path: AMD_CN,
      type: "REG_DWORD",
      description: "Turns off AMD User Experience Program prompts and polling.",
      risk: "SAFE",
      restart: false,
      hardware: "AMD Radeon GPU",
      driver: "AMD Adrenalin driver",
      amdCurrent: "Enabled (default)",
      target: "Disabled (0x00)",
    }),
    amdEntry({
      id: "gpu.amd.start_minimized",
      valueName: "StartMinimized",
      title: "AMD Software start minimized",
      category: "Privacy & Background Services",
      path: AMD_CN,
      type: "REG_DWORD",
      description:
        "Starts AMD Software in the notification area without a splash window at sign-in.",
      risk: "SAFE",
      restart: false,
      hardware: "AMD Radeon Software",
      driver: "AMD Adrenalin driver",
      amdCurrent: "0 (normal window)",
      target: "1 (start minimized)",
    }),
    amdEntry({
      id: "gpu.amd.enable_ulps",
      valueName: "EnableUlps",
      title: "AMD ULPS (ultra low power state) disable",
      category: "Power & Clock Management",
      path: ADAPTER,
      type: "REG_DWORD",
      description: "Disables ULPS to avoid wake-up stutter and black-screen wake freezes.",
      risk: hw.laptop ? "MEDIUM" : "LOW",
      restart: true,
      hardware: "AMD Radeon desktop / high-performance GPU",
      driver: "AMD display driver",
      amdCurrent: "Enabled (default)",
      target: "Disabled (0x00)",
    }),
    amdEntry({
      id: "gpu.amd.deepsleep_disable",
      valueName: "PP_Sclk_DeepSleep_Disable",
      title: "AMD core clock deep sleep disable",
      category: "Power & Clock Management",
      path: ADAPTER,
      type: "REG_DWORD",
      description: "Keeps PowerPlay from putting core clocks into deep sleep latency states.",
      risk: "MEDIUM",
      restart: true,
      hardware: "AMD Radeon GPU (desktop performance)",
      driver: "AMD display driver",
      amdCurrent: "0 (deep sleep active)",
      target: "1 (deep sleep disabled)",
    }),
    amdEntry({
      id: "gpu.amd.disable_power_gating",
      valueName: "DisablePowerGating",
      title: "AMD power gating latency reduction",
      category: "Power & Clock Management",
      path: ADAPTER,
      type: "REG_DWORD",
      description: "Reduces power gating transition delays across compute units.",
      risk: "MEDIUM",
      restart: true,
      hardware: "AMD Radeon RX architecture",
      driver: "AMD display driver",
      amdCurrent: "0 (power gating on)",
      target: "1 (power gating off)",
    }),
    amdEntry({
      id: "gpu.amd.surface_format_opt",
      valueName: "SurfaceFormatOptimization",
      title: "AMD surface format optimization",
      category: "Shader & Texture Pipeline",
      path: ADAPTER,
      type: "REG_DWORD",
      description: "Driver-level surface format substitution for texture throughput.",
      risk: "LOW",
      restart: true,
      hardware: "AMD Radeon GPU",
      driver: "AMD display driver",
      amdCurrent: "0 (disabled)",
      target: "1 (enabled)",
    }),
    // ── Diagnostic (read-only)
    tdr(
      "gpu.diagnostic.tdr_delay",
      "TdrDelay",
      "GPU TDR timeout delay",
      "Timeout Detection and Recovery delay, extended from 2 to 8 seconds for heavy compute.",
      "2 seconds (default)",
      "8 seconds (0x08)",
    ),
    tdr(
      "gpu.diagnostic.tdr_ddi_delay",
      "TdrDdiDelay",
      "GPU DDI driver recovery timeout",
      "How long Windows waits for a driver interface call before starting recovery.",
      "5 seconds (default)",
      "8 seconds (0x08)",
    ),
    tdr(
      "gpu.diagnostic.tdr_limit_count",
      "TdrLimitCount",
      "TDR reset limit count",
      "Recovery attempts allowed within the time window before Windows stops with a bugcheck.",
      "5 attempts (default)",
      "10 attempts",
    ),
    tdr(
      "gpu.diagnostic.tdr_limit_time",
      "TdrLimitTime",
      "TDR limit time window",
      "Window in seconds during which TdrLimitCount attempts are counted.",
      "60 seconds (default)",
      "60 seconds",
    ),
  ];
}

export const RAM_REGISTRY_VALUES = ramValues();
export const GPU_REGISTRY_VALUES = gpuValues();

export function valuesInGroup(list: RegistryValueEntry[], group: string) {
  return list.filter((v) => v.group === group);
}

export function registrySummary(list: RegistryValueEntry[]) {
  return {
    total: list.length,
    applicable: list.filter((v) => v.status === "applicable").length,
    notApplicable: list.filter((v) => v.status === "not-applicable").length,
    diagnostic: list.filter((v) => v.status === "diagnostic").length,
    restart: list.filter((v) => v.status === "applicable" && v.restart).length,
  };
}

/** Recompute for other sample hardware (used by tests). */
export const valuesForHardware = (hw: RegistryHardware) => ({
  ram: ramValues(hw),
  gpu: gpuValues(hw),
});

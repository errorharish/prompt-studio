// Sample data sourced from ERROR_OPTIMIZER_BACKEND_MANIFEST.json and XAML FallbackValues.
// All values are DEMO — the prototype never reads or changes a real system.
export type Risk = "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "PROTECTED";

export const ONE_CLICK_GROUPS = [
  { key: "SYSTEM PERFORMANCE", desc: "Improve Windows responsiveness and system scheduling." },
  { key: "BACKGROUND WORKLOAD", desc: "Reduce background CPU and memory pressure safely." },
  { key: "MEMORY", desc: "Optimize system memory footprint and working set behavior." },
  {
    key: "POWER / PERFORMANCE",
    desc: "Tune energy and responsiveness behavior for peak performance.",
  },
];

export const ONE_CLICK_ACTIONS = [
  {
    id: "visual-tweaks",
    title: "WINDOWS VISUAL RESPONSIVENESS",
    group: "SYSTEM PERFORMANCE",
    risk: "SAFE" as Risk,
    desc: "Make everyday Windows interactions feel faster and more responsive.",
    why: "Makes menus and window switching feel instant while reducing Desktop Window Manager overhead.",
    safety: "Safe • Reversible • Immediate",
    restart: false,
  },
  {
    id: "bcd-platform-timers",
    title: "SYSTEM TIMER & RESPONSIVENESS",
    group: "SYSTEM PERFORMANCE",
    risk: "LOW" as Risk,
    desc: "Improve system timing consistency for smoother real-time workloads.",
    why: "Helps reduce micro-stutter, audio crackle, and input delay in games and real-time apps.",
    safety: "Safe • Reversible • Requires restart",
    restart: true,
  },
  {
    id: "shader-cache",
    title: "GRAPHICS SHADER CACHE CLEANUP",
    group: "SYSTEM PERFORMANCE",
    risk: "SAFE" as Risk,
    desc: "Remove stale graphics cache data that can contribute to shader-related stutter.",
    why: "Prevents shader stutter and frees disk space after driver or game updates.",
    safety: "Safe • Non-destructive • Rebuilt automatically",
    restart: false,
  },
  {
    id: "fast-clean",
    title: "TEMPORARY SYSTEM CACHE CLEANUP",
    group: "SYSTEM PERFORMANCE",
    risk: "SAFE" as Risk,
    desc: "Remove safe temporary files that are no longer needed.",
    why: "Recovers storage space and reduces filesystem indexing overhead.",
    safety: "Safe • Unlocked temp files only",
    restart: false,
  },
  {
    id: "deep-clean",
    title: "DEEP SYSTEM & UPDATE CACHE CLEANUP",
    group: "SYSTEM PERFORMANCE",
    risk: "SAFE" as Risk,
    desc: "Clean obsolete system and update cache files without touching personal data.",
    why: "Reclaims wasted SSD space without touching personal data or logins.",
    safety: "Safe • Preserves logins, history, and bookmarks",
    restart: false,
  },
  {
    id: "background-workload",
    title: "REDUCE UNNECESSARY BACKGROUND WORK",
    group: "BACKGROUND WORKLOAD",
    risk: "SAFE" as Risk,
    desc: "Reduce safe background activity so your active apps can get more system resources.",
    why: "Protected applications are excluded by policy.",
    safety: "Safe • Protected apps excluded",
    restart: false,
  },
  {
    id: "ram-standby",
    title: "MEMORY CLEANUP & REFRESH",
    group: "MEMORY",
    risk: "SAFE" as Risk,
    desc: "Release unused memory from eligible background applications.",
    why: "Frees standby memory for the active workload.",
    safety: "Safe • Immediate • Protected apps excluded",
    restart: false,
  },
  {
    id: "power-performance",
    title: "SUSTAINED PERFORMANCE MODE",
    group: "POWER / PERFORMANCE",
    risk: "SAFE" as Risk,
    desc: "Use a consistent Windows performance mode during demanding work.",
    why: "Avoids frequency ramp-down during demanding sessions.",
    safety: "Safe • Reversible • Immediate",
    restart: false,
  },
];

export const CATALOG = [
  {
    id: "POWER.HIGH_PERFORMANCE_SCHEME",
    name: "High Performance Power Plan Activation",
    cat: "POWER",
    risk: "LOW" as Risk,
  },
  {
    id: "POWER.DISABLE_POWER_THROTTLING",
    name: "Disable Execution Power Throttling",
    cat: "POWER",
    risk: "LOW" as Risk,
  },
  {
    id: "INPUT.DISABLE_MOUSE_ACCEL",
    name: "Disable Mouse Acceleration (1:1 Raw Pointer Response)",
    cat: "INPUT",
    risk: "LOW" as Risk,
  },
  {
    id: "INPUT.KEYBOARD_REPEAT_RATE_MAX",
    name: "Keyboard Repeat Rate Maximization (31/31)",
    cat: "INPUT",
    risk: "LOW" as Risk,
  },
  {
    id: "RAM.DYNAMIC_SVCHOST_THRESHOLD",
    name: "Hardware-Aware Svchost Split Threshold",
    cat: "MEMORY",
    risk: "MEDIUM" as Risk,
  },
  {
    id: "RAM.DISABLE_PAGING_EXECUTIVE",
    name: "Disable Paging Executive (Kernel Resident in RAM)",
    cat: "MEMORY",
    risk: "HIGH" as Risk,
  },
  {
    id: "RAM.LARGE_SYSTEM_CACHE",
    name: "Large System Cache & Worker Thread Allocation",
    cat: "MEMORY",
    risk: "LOW" as Risk,
  },
  {
    id: "GPU.UNIVERSAL_HAGS",
    name: "Hardware-Accelerated GPU Scheduling (HAGS)",
    cat: "GPU",
    risk: "MEDIUM" as Risk,
  },
  {
    id: "GPU.NVIDIA_POWERMIZER_MAX_PERF",
    name: "NVIDIA PowerMizer Maximum Performance Mode",
    cat: "GPU",
    risk: "MEDIUM" as Risk,
  },
  {
    id: "GPU.AMD_DISABLE_ULPS",
    name: "AMD Radeon Ultra Low Power State (ULPS) Disable",
    cat: "GPU",
    risk: "HIGH" as Risk,
  },
  {
    id: "NETWORK.DISABLE_THROTTLING_INDEX",
    name: "Disable Multimedia Network Throttling Index",
    cat: "NETWORK",
    risk: "LOW" as Risk,
  },
  {
    id: "NETWORK.TCP_AUTOTUNING_NORMAL",
    name: "TCP Window Auto-Tuning Calibration (Normal)",
    cat: "NETWORK",
    risk: "LOW" as Risk,
  },
  {
    id: "STORAGE.DISABLE_8DOT3_NAMES",
    name: "Disable NTFS 8.3 Short Name Creation on Modern SSDs",
    cat: "NTFS",
    risk: "LOW" as Risk,
  },
  {
    id: "STORAGE.DISABLE_LAST_ACCESS_TIME",
    name: "Disable NTFS Last Access Timestamps",
    cat: "NTFS",
    risk: "LOW" as Risk,
  },
  {
    id: "STORAGE.TRIM_OPTIMIZATION",
    name: "NTFS NVMe/SSD TRIM Pass-Through Verification",
    cat: "NTFS",
    risk: "LOW" as Risk,
  },
  {
    id: "CPU.WIN32_PRIORITY_SEPARATION",
    name: "Win32 Priority Separation Foreground Quantum Boost",
    cat: "CPU",
    risk: "HIGH" as Risk,
  },
  {
    id: "CPU.CORE_PARKING_DISABLE",
    name: "Processor Core Parking Disablement",
    cat: "CPU",
    risk: "HIGH" as Risk,
  },
  {
    id: "SERVICE.DEMOTE_DIAGTRACK",
    name: "Demote Diagnostic Telemetry Service",
    cat: "TELEMETRY",
    risk: "LOW" as Risk,
  },
  {
    id: "GAMING.MMCSS_GAMES_PRIORITY",
    name: "MMCSS Games Priority & Scheduling Tuning",
    cat: "GAMING",
    risk: "LOW" as Risk,
  },
  {
    id: "GAMING.GAME_DVR_DISABLE",
    name: "Disable GameDVR & Background Broadcast Capture",
    cat: "GAMING",
    risk: "LOW" as Risk,
  },
  {
    id: "DEBLOAT.DISABLE_CORTANA",
    name: "Disable Cortana Voice Assistant Background Services",
    cat: "PRIVACY",
    risk: "LOW" as Risk,
  },
  {
    id: "DEBLOAT.DISABLE_WIDGETS_FEED",
    name: "Disable Windows 11 Widgets Feed & Taskbar Daemon",
    cat: "PRIVACY",
    risk: "LOW" as Risk,
  },
  {
    id: "AI.DYNAMIC_WORKING_SET_TRIM",
    name: "AI Dynamic Working Set Memory Optimizer",
    cat: "MEMORY",
    risk: "LOW" as Risk,
  },
  {
    id: "AI.FOREGROUND_THREAD_BOOST",
    name: "AI Active Workload Foreground Thread Priority Shield",
    cat: "CPU",
    risk: "LOW" as Risk,
  },
  {
    id: "BIOS.SECURE_BOOT_VERIFY",
    name: "UEFI Secure Boot State & Firmware Integrity",
    cat: "SYSTEM",
    risk: "LOW" as Risk,
  },
  {
    id: "BIOS.RESIZABLE_BAR_AUDIT",
    name: "PCI Express Resizable BAR / SAM Firmware Audit",
    cat: "SYSTEM",
    risk: "LOW" as Risk,
  },
];

export interface TierInfo {
  id: string;
  name: string;
  desc: string;
  color: "tier-normal" | "tier-pro" | "tier-ultimate" | "tier-debloat" | "tier-bios" | "primary";
  entries: number;
  extendsFrom?: string;
  reduction: string;
  toolbox?: "debloat" | "bios";
}

export const TIERS: Record<string, TierInfo> = {
  normal: {
    id: "Normal",
    name: "Normal Optimization",
    desc: "Safe everyday Windows optimization. Disables non-essential telemetry, retail, and background services. Machine-aware hardware and dependency gates applied per target.",
    color: "tier-normal",
    entries: 61,
    reduction: "20–45",
  },
  pro: {
    id: "Pro",
    name: "Pro Optimization",
    desc: "Advanced power-user optimization. Extends Normal with deeper service, registry, scheduled task, and hardware-gated targets.",
    color: "tier-pro",
    entries: 53,
    extendsFrom: "Normal",
    reduction: "—",
  },
  ultimate: {
    id: "Ultimate",
    name: "Ultimate Optimization",
    desc: "Deep system optimization for workstations and power users. Extends Pro with additional services, Windows features, scheduled tasks and visual effects.",
    color: "tier-ultimate",
    entries: 41,
    extendsFrom: "Pro",
    reduction: "—",
  },
  debloat: {
    id: "Debloat",
    name: "Debloat",
    desc: "Comprehensive Windows debloater and system customization engine with telemetry removal, app management, and UI tweaks.",
    color: "tier-debloat",
    entries: 23,
    extendsFrom: "Normal",
    reduction: "—",
    toolbox: "debloat",
  },
  "bios-safe": {
    id: "BiosSafe",
    name: "BIOS Safe",
    desc: "Universal hardware-aware and firmware-aware optimization engine for Windows and UEFI platforms.",
    color: "tier-bios",
    entries: 8,
    reduction: "—",
    toolbox: "bios",
  },
  "max-performance": {
    id: "MaximumPerformance",
    name: "Maximum Performance",
    desc: "Complete machine-specific performance optimization. Combines Ultimate + CPU performance + GPU scheduling + power policy + memory + storage + visual effects.",
    color: "primary",
    entries: 22,
    extendsFrom: "Ultimate",
    reduction: "—",
  },
};

export const PROFILES = [
  "Normal",
  "Pro",
  "Ultimate",
  "Debloat",
  "BIOS Safe",
  "Max Performance",
  "Emulator Max",
];

export const HW = {
  cpu: "AMD Ryzen 7 7800X3D",
  cpuSub: "8 Cores / 16 Threads · 4.2 GHz",
  gpu: "NVIDIA GeForce RTX 4080 Super",
  gpuSub: "16 GB GDDR6X · PCIe 4.0",
  ram: "32 GB DDR5-6000 CL30",
  ramSub: "2x 16GB · 6000 MT/s · AMD EXPO I",
  storage: "Samsung 990 PRO 2TB",
  storageSub: "PCIe Gen 4.0 x4 · 7,450 MB/s read",
  os: "Windows 11 Pro 24H2",
};

// Page registry derived from BiosOptimizer.GUI/Controls/GlassSidebarDock.xaml,
// MainWindow.xaml (V4 top nav) and MainViewModel.cs route factory.
export type Suite = "V3" | "V4";

export interface PageDef {
  slug: string; // URL slug in this prototype
  routeKey: string; // original NavigateCommand CommandParameter
  title: string;
  tooltip: string; // original dock ToolTip
  view: string; // original XAML view
  viewModel: string;
  suite: Suite;
  inDock: boolean; // reachable from GlassSidebarDock
  dockGroup?: number; // separator groups in dock order
  icon: string; // lucide icon name (original glyphs come from NavigationIcon Tag mapping — not exported)
  description: string;
}

export const PAGES: PageDef[] = [
  // ── Dock group 1
  {
    slug: "",
    routeKey: "Dashboard",
    title: "Dashboard",
    tooltip: "Dashboard",
    view: "DashboardView.xaml",
    viewModel: "DashboardViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 1,
    icon: "LayoutDashboard",
    description: "System overview and optimization status",
  },
  {
    slug: "input-optimizer",
    routeKey: "InputOptimizer",
    title: "Input Optimizer",
    tooltip: "Input Optimization",
    view: "InputOptimizerView.xaml",
    viewModel: "InputOptimizerViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 1,
    icon: "MousePointer2",
    description: "Pointer precision, repeat rates, timer resolution and jitter measurement.",
  },
  {
    slug: "system-info",
    routeKey: "SystemInfo",
    title: "System Telemetry",
    tooltip: "System Telemetry",
    view: "SystemInfoView.xaml",
    viewModel: "SystemInfoViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 1,
    icon: "Cpu",
    description: "Real-time hardware, Windows architecture and system health diagnostics.",
  },
  // ── Dock group 2
  {
    slug: "registry-tweak",
    routeKey: "RegistryTweak",
    title: "Registry Intelligence",
    tooltip: "Registry Optimization",
    view: "RegistryTweakView.xaml",
    viewModel: "RegistryTweakViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 2,
    icon: "Binary",
    description: "Registry optimization categorized by CPU scheduling, gaming, memory and more.",
  },
  {
    slug: "registry-values",
    routeKey: "RegistryValues",
    title: "Registry Values",
    tooltip: "Hardware Registry Values",
    view: "RegistryValuesView.xaml",
    viewModel: "RegistryValuesViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 2,
    icon: "SlidersHorizontal",
    description: "Hardware-aware RAM and GPU registry value configuration.",
  },
  // ── Dock group 3
  {
    slug: "startup-manager",
    routeKey: "StartupManager",
    title: "Startup Manager",
    tooltip: "Startup Manager",
    view: "StartupManagerView.xaml",
    viewModel: "StartupManagerViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 3,
    icon: "Rocket",
    description: "Manage startup applications and background tasks.",
  },
  {
    slug: "network",
    routeKey: "Network",
    title: "Network Boost",
    tooltip: "Network Optimization",
    view: "NetworkView.xaml",
    viewModel: "NetworkViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 3,
    icon: "Wifi",
    description: "Optimize the Windows network stack for lower latency.",
  },
  {
    slug: "storage",
    routeKey: "Storage",
    title: "Storage Optimizer",
    tooltip: "Storage Optimization",
    view: "StorageView.xaml",
    viewModel: "StorageViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 3,
    icon: "HardDrive",
    description: "Analyze storage, find unnecessary files, and safely manage disk space.",
  },
  {
    slug: "tools",
    routeKey: "Tools",
    title: "System Tools",
    tooltip: "System Tools",
    view: "ToolsView.xaml",
    viewModel: "ToolsViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 3,
    icon: "Wrench",
    description: "Unified toolbox — 16 diagnostics, repair and cleanup tools.",
  },
  // ── Dock group 4 (all TierView except AiOptimization)
  {
    slug: "normal",
    routeKey: "Normal",
    title: "Normal Optimization",
    tooltip: "Normal Profile",
    view: "TierView.xaml",
    viewModel: 'TierViewModel("Normal")',
    suite: "V3",
    inDock: true,
    dockGroup: 4,
    icon: "ShieldCheck",
    description: "Safe optimizations for everyday use.",
  },
  {
    slug: "pro",
    routeKey: "Pro",
    title: "Pro Optimization",
    tooltip: "Pro Profile",
    view: "TierView.xaml",
    viewModel: 'TierViewModel("Pro")',
    suite: "V3",
    inDock: true,
    dockGroup: 4,
    icon: "Gauge",
    description: "Advanced optimizations for power users.",
  },
  {
    slug: "ultimate",
    routeKey: "Ultimate",
    title: "Ultimate Optimization",
    tooltip: "Ultimate Profile",
    view: "TierView.xaml",
    viewModel: 'TierViewModel("Ultimate")',
    suite: "V3",
    inDock: true,
    dockGroup: 4,
    icon: "Flame",
    description: "Maximum system overhaul. High risk.",
  },
  {
    slug: "debloat",
    routeKey: "Debloat",
    title: "Debloat",
    tooltip: "Debloat Engine",
    view: "TierView.xaml",
    viewModel: 'TierViewModel("Debloat")',
    suite: "V3",
    inDock: true,
    dockGroup: 4,
    icon: "PackageX",
    description: "Removes telemetry, diagnostic tracking, and background Windows bloatware.",
  },
  {
    slug: "bios-safe",
    routeKey: "BiosSafe",
    title: "BIOS Safe",
    tooltip: "BIOS Safe Engine",
    view: "TierView.xaml",
    viewModel: 'TierViewModel("BiosSafe")',
    suite: "V3",
    inDock: true,
    dockGroup: 4,
    icon: "CircuitBoard",
    description: "Safe firmware-aware analysis and UEFI hardware optimization.",
  },
  {
    slug: "max-performance",
    routeKey: "MaxPerformance",
    title: "Maximum Performance",
    tooltip: "Maximum Performance Profile",
    view: "TierView.xaml",
    viewModel: 'TierViewModel("MaximumPerformance")',
    suite: "V3",
    inDock: true,
    dockGroup: 4,
    icon: "Zap",
    description: "Extreme optimizations for gaming and rendering.",
  },
  {
    slug: "ai-optimization",
    routeKey: "AiOptimization",
    title: "AI Optimization",
    tooltip: "AI Optimization",
    view: "AiOptimizationView.xaml",
    viewModel: "AiOptimizationViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 4,
    icon: "BrainCircuit",
    description: "RAM limiter, workload optimization and AI power plans.",
  },
  // ── Dock group 5
  {
    slug: "backup-restore",
    routeKey: "BackupRestore",
    title: "Backup & Restore",
    tooltip: "Backup & Restore",
    view: "BackupRestoreView.xaml",
    viewModel: "BackupRestoreViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 5,
    icon: "History",
    description: "Universal transaction engine, profile containers and restore points.",
  },
  {
    slug: "settings",
    routeKey: "Settings",
    title: "Settings",
    tooltip: "Settings & Preferences",
    view: "SettingsView.xaml",
    viewModel: "SettingsViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 5,
    icon: "Settings",
    description: "Startup, AI policies, appearance, performance and safety guardrails.",
  },
  {
    slug: "about",
    routeKey: "About",
    title: "About",
    tooltip: "About & Diagnostics",
    view: "AboutView.xaml",
    viewModel: "AboutViewModel",
    suite: "V3",
    inDock: true,
    dockGroup: 5,
    icon: "Info",
    description: "What Error Optimizer changes, profiles and the optimization catalog.",
  },

  // ── V3 routes not present in the dock XAML (reachable via in-page links)
  {
    slug: "one-click",
    routeKey: "OneClick",
    title: "1-Click Optimization",
    tooltip: "Dedicated 1-Click workflow",
    view: "OneClickOptimizationView.xaml",
    viewModel: "OneClickOptimizationViewModel",
    suite: "V3",
    inDock: false,
    icon: "MousePointerClick",
    description: "Find safe performance improvements and apply them with verification.",
  },
  {
    slug: "auto-optimize",
    routeKey: "AutoOptimize",
    title: "Auto Optimize",
    tooltip: "Gaming Mode / Auto Optimize",
    view: "AutoOptimizeView.xaml",
    viewModel: "AutoOptimizeViewModel",
    suite: "V3",
    inDock: false,
    icon: "CalendarClock",
    description: "Schedule safe recurring maintenance for selected cleanup actions.",
  },
  {
    slug: "process-reduction",
    routeKey: "ProcessReduction",
    title: "Process Intelligence",
    tooltip: "RAM Optimizer",
    view: "ProcessReductionView.xaml",
    viewModel: "ProcessReductionViewModel",
    suite: "V3",
    inDock: false,
    icon: "Activity",
    description: "Safe background process management.",
  },
  {
    slug: "service-manager",
    routeKey: "ServiceManager",
    title: "Service Manager",
    tooltip: "Services Manager",
    view: "ServiceManagerView.xaml",
    viewModel: "ServiceManagerViewModel",
    suite: "V3",
    inDock: false,
    icon: "Server",
    description: "Inspect, monitor and optimize Windows background services.",
  },
  {
    slug: "registry-values-ram",
    routeKey: "RegistryValuesRam",
    title: "RAM Registry Values",
    tooltip: "RAM Registry Values",
    view: "RegistryValuesRamView.xaml",
    viewModel: "RegistryValuesRamViewModel",
    suite: "V3",
    inDock: false,
    icon: "MemoryStick",
    description: "Svchost split threshold configuration.",
  },
  {
    slug: "gpu-registry-values",
    routeKey: "GpuRegistryValues",
    title: "GPU Registry Values",
    tooltip: "GPU Tuning",
    view: "GpuRegistryValuesView.xaml",
    viewModel: "GpuRegistryValuesViewModel",
    suite: "V3",
    inDock: false,
    icon: "MonitorCog",
    description: "Hardware-aware GPU registry configuration.",
  },
  {
    slug: "performance-tuning",
    routeKey: "PerformanceTuning",
    title: "Performance Tuning",
    tooltip: "CPU / GPU Performance Tuning",
    view: "PerformanceTuningView.xaml",
    viewModel: "PerformanceTuningViewModel",
    suite: "V3",
    inDock: false,
    icon: "Thermometer",
    description: "Optional CPU and GPU tuning for supported hardware.",
  },

  // ── V4 suite (MainWindow top nav has exactly 2 tabs)
  {
    slug: "v4-max-performance",
    routeKey: "V4MaxPerformance",
    title: "Maximum Performance",
    tooltip: "V4 Maximum Performance — Adaptive system latency reduction",
    view: "MaxPerformanceView.xaml",
    viewModel: "MaxPerformanceViewModel",
    suite: "V4",
    inDock: false,
    icon: "Zap",
    description: "Hardware-aware latency reduction, resource management and workload protection.",
  },
  {
    slug: "emulator-optimization",
    routeKey: "EmulatorOptimization",
    title: "Emulator Optimization",
    tooltip: "V4 Emulator Optimization Suite — MSI App Player 5",
    view: "EmulatorOptimizationPage.xaml",
    viewModel: "EmulatorOptimizationViewModel",
    suite: "V4",
    inDock: false,
    icon: "Gamepad2",
    description: "Unified MSI App Player 5 & Free Fire performance engine.",
  },
  {
    slug: "v4-dashboard",
    routeKey: "V4Dashboard",
    title: "V4 Performance Center",
    tooltip: "V4 Dashboard (routed to MaxPerformanceViewModel)",
    view: "V4DashboardView.xaml",
    viewModel: "V4DashboardViewModel",
    suite: "V4",
    inDock: false,
    icon: "LayoutGrid",
    description: "V4 Performance Center: host and emulator status, modules.",
  },
  {
    slug: "emulator-debloater",
    routeKey: "EmulatorDebloater",
    title: "Emulator Debloater",
    tooltip: "Emulator Debloater — packages, services and background components",
    view: "EmulatorDebloaterView.xaml",
    viewModel: "EmulatorDebloaterViewModel",
    suite: "V4",
    inDock: false,
    icon: "PackageCheck",
    description: "Scan, classify and safely disable emulator packages and background services.",
  },
  {
    slug: "emulator-advanced",
    routeKey: "EmulatorAdvanced",
    title: "Emulator Advanced Optimization",
    tooltip: "Emulator Advanced Optimization — rendering, memory and low-end profiles",
    view: "MsiAppPlayerPage.xaml + LowEndSteamPage.xaml",
    viewModel: "MsiAppPlayerViewModel",
    suite: "V4",
    inDock: false,
    icon: "Boxes",
    description: "Rendering, memory, background and low-end hardware emulator tuning.",
  },
];

export const pageBySlug = (slug: string) => PAGES.find((p) => p.slug === slug);
export const pageByKey = (key: string) => PAGES.find((p) => p.routeKey === key);
export const hrefFor = (slug: string) => (slug ? `/${slug}` : "/");

export const V4_TABS = ["v4-max-performance", "emulator-optimization"] as const;

/** References that could not be fully determined from the uploads. */
export const MISSING_REFERENCES: { area: string; detail: string }[] = [
  {
    area: "Auto Optimize task list",
    detail:
      "AutoOptimizeView.xaml only defines Clean Temp Files and Free Standby Memory. The other tasks (crash dumps, browser caches per browser, Recycle Bin, DirectX shader cache, DNS flush) are operations that already exist on the Storage and Tools pages. Per-browser cache cleanup and the 1-minute–24-hour schedule follow the user's brief; their native engine support must be confirmed in the C# source.",
  },
  {
    area: "Overall Optimization Score",
    detail:
      "No scoring logic exists in the supplied source. The score (weighted average of four categories in src/lib/eo/score.ts) is illustrative demo data, labelled as such, and is never changed by a simulated run.",
  },
  {
    area: "V4 live activity / log panels",
    detail:
      "MaxPerformanceView and EmulatorOptimizationPage had LIVE ACTIVITY / LIVE LOGS rails. By user direction they are replaced with engine-status and session rails; no fake log output is shown.",
  },
  {
    area: "Dock icon glyphs",
    detail:
      "GlassSidebarDock passes Tag to controls:NavigationIcon (NavigationIcon.cs). The glyph geometry mapping was not inspected in source form here; icons in this prototype are stand-ins.",
  },
  {
    area: "ItemsControl item templates",
    detail:
      "Many lists (CuratedGroups, TopRecommendations, VisibleItems, FilteredTools…) bind to ViewModel collections. Row layouts are reproduced from the in-file DataTemplates; row contents are sample data from the manifest, not live values.",
  },
  {
    area: "V4 top navigation",
    detail:
      "Build report lists 4 V4 tabs; MainWindow.xaml defines only 2 (MAXIMUM PERFORMANCE, EMULATOR OPTIMIZATION). Prototype follows the XAML. Debloater and Advanced are engine cards inside the suite page.",
  },
  {
    area: "Dashboard layout",
    detail:
      "DashboardView.xaml contains 5 telemetry tiles, a telemetry chart + Optimization Status, Hardware Information table, Quick Actions and Recent Activity; the build report describes a HealthGauge + 1-Click hero card. By explicit user direction the prototype now leads with an Overall Optimization Score + the Auto Optimize maintenance panel, keeps compact tiles plus a one-row System Information strip, removes Optimization Status and Recent Activity, and moves the telemetry chart to System Telemetry. The hardware table's content remains in the tiles and on System Telemetry.",
  },
  {
    area: "EmulatorDeepOptimizeTab",
    detail:
      "Contains no own layout — it hosts MsiAppPlayerPage plus a ToastHost. Rendered as the MSI module hub.",
  },
  {
    area: "DebloatView / BiosSafeView",
    detail:
      "Standalone XAML exists, but MainViewModel routes Debloat and BiosSafe to TierViewModel → TierView. The standalone views are documented in the blueprint but not routed.",
  },
  {
    area: "Unrouted pages in dock",
    detail:
      "OneClick, AutoOptimize, ProcessReduction, ServiceManager, PerformanceTuning and V4Dashboard have no dock entry. Their entry points are in-page links only (Dashboard quick actions, Registry Values tabs).",
  },
  {
    area: "Original reference files",
    detail:
      "ERROR_OPTIMIZER_UI_REFERENCE.zip, the source ZIP, the backend manifest and the build report are not attached to this project copy. The registry and layouts were kept from the original audit; they could not be re-checked against the XAML here.",
  },
  {
    area: "Stepper and loading skeletons",
    detail:
      "The workflow stepper (One-Click, run dialog) and skeleton loading rows are prototype additions with no XAML source. The blueprint suggests WPF equivalents but they are not original controls.",
  },
  {
    area: "3D depth HIGH (DEEP)",
    detail:
      "Settings offers LOW / MEDIUM / HIGH depth. Only LOW (no tilt) differs visually in the prototype; the original HIGH behaviour is not documented in the supplied material.",
  },
  {
    area: "Animated backgrounds",
    detail:
      "MetallicBackground / AuroraBackground / parallax starfield are C# render controls; only their static appearance is approximated.",
  },
];

/** V4 vertical sidebar: its own Dashboard plus every V4 destination, grouped. V3 pages never appear here. */
export const V4_NAV: { slug: string; label: string; group: "home" | "performance" | "emulator" }[] =
  [
    { slug: "v4-dashboard", label: "HOME", group: "home" },
    { slug: "v4-max-performance", label: "MAX PERF", group: "performance" },
    { slug: "emulator-optimization", label: "EMULATOR", group: "emulator" },
    { slug: "emulator-debloater", label: "DEBLOAT", group: "emulator" },
    { slug: "emulator-advanced", label: "ADVANCED", group: "emulator" },
  ];

/** Former V4 destinations folded into the five-page structure; old links redirect here. */
export const V4_REDIRECTS: Record<string, string> = {
  "v4-core-optimizer": "v4-max-performance",
  "emulator-modules": "emulator-advanced",
  "emulator-deployer": "emulator-debloater",
  "low-end-steam": "emulator-advanced",
};

import type { ReactNode } from "react";
import { DashboardPage } from "./pages/Dashboard";
import { OneClickPage } from "./pages/OneClick";
import { TierPage } from "./pages/Tier";
import {
  GpuRegistryValuesPage,
  InputOptimizerPage,
  RegistryTweakPage,
  RegistryValuesPage,
  RegistryValuesRamPage,
  SystemInfoPage,
} from "./pages/SystemPages";
import { AutoOptimizePage } from "./pages/AutoOptimize";
import {
  NetworkPage,
  ProcessReductionPage,
  ServiceManagerPage,
  StartupManagerPage,
  StoragePage,
  ToolsPage,
} from "./pages/ManagerPages";
import {
  AboutPage,
  AiOptimizationPage,
  BackupRestorePage,
  PerformanceTuningPage,
  SettingsPage,
} from "./pages/MiscPages";
import {
  EmulatorAdvancedPage,
  EmulatorDebloaterPage,
  EmulatorOptimizationPage,
  V4DashboardPage,
  V4MaxPerformancePage,
} from "./pages/V4Pages";

export const PAGE_COMPONENTS: Record<string, () => ReactNode> = {
  "": () => <DashboardPage />,
  "one-click": () => <OneClickPage />,
  "input-optimizer": () => <InputOptimizerPage />,
  "system-info": () => <SystemInfoPage />,
  "registry-tweak": () => <RegistryTweakPage />,
  "registry-values": () => <RegistryValuesPage />,
  "registry-values-ram": () => <RegistryValuesRamPage />,
  "gpu-registry-values": () => <GpuRegistryValuesPage />,
  "startup-manager": () => <StartupManagerPage />,
  "service-manager": () => <ServiceManagerPage />,
  network: () => <NetworkPage />,
  storage: () => <StoragePage />,
  tools: () => <ToolsPage />,
  "process-reduction": () => <ProcessReductionPage />,
  "auto-optimize": () => <AutoOptimizePage />,
  normal: () => <TierPage slug="normal" />,
  pro: () => <TierPage slug="pro" />,
  ultimate: () => <TierPage slug="ultimate" />,
  debloat: () => <TierPage slug="debloat" />,
  "bios-safe": () => <TierPage slug="bios-safe" />,
  "max-performance": () => <TierPage slug="max-performance" />,
  "ai-optimization": () => <AiOptimizationPage />,
  "backup-restore": () => <BackupRestorePage />,
  settings: () => <SettingsPage />,
  about: () => <AboutPage />,
  "performance-tuning": () => <PerformanceTuningPage />,
  "v4-max-performance": () => <V4MaxPerformancePage />,
  "emulator-optimization": () => <EmulatorOptimizationPage />,
  "v4-dashboard": () => <V4DashboardPage />,
  "emulator-debloater": () => <EmulatorDebloaterPage />,
  "emulator-advanced": () => <EmulatorAdvancedPage />,
};

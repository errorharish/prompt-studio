import { describe, expect, it } from "vitest";
import {
  GPU_REGISTRY_VALUES,
  RAM_REGISTRY_VALUES,
  SAMPLE_REGISTRY_HW,
  nearestRamTier,
  registrySummary,
  svchostThreshold,
  valuesForHardware,
} from "@/lib/eo/registryValues";

const byId = (list: typeof GPU_REGISTRY_VALUES, id: string) => list.find((v) => v.id === id);

describe("Registry Values data (from the WPF RAM and GPU engines)", () => {
  it("maps RAM to the Service Host threshold of the nearest validated tier", () => {
    expect(svchostThreshold(32)).toBe(0x02000000);
    expect(svchostThreshold(16)).toBe(0x01000000);
    expect(nearestRamTier(31.6)).toBe(32);
    // 48 GB sits between 32 and 64: equal distance, the higher tier wins.
    expect(nearestRamTier(48)).toBe(64);
  });

  it("lists the five RAM engine values and 25 GPU engine values", () => {
    expect(RAM_REGISTRY_VALUES).toHaveLength(5);
    expect(GPU_REGISTRY_VALUES).toHaveLength(25);
    expect(new Set([...RAM_REGISTRY_VALUES, ...GPU_REGISTRY_VALUES].map((v) => v.id)).size).toBe(
      30,
    );
  });

  it("never offers AMD values on the NVIDIA sample hardware", () => {
    expect(SAMPLE_REGISTRY_HW.gpuVendor).toBe("NVIDIA");
    const amd = GPU_REGISTRY_VALUES.filter((v) => v.group === "amd");
    expect(amd).toHaveLength(8);
    expect(amd.every((v) => v.status === "not-applicable")).toBe(true);
  });

  it("offers AMD values and hides NVIDIA ones on AMD hardware", () => {
    const { gpu } = valuesForHardware({ ...SAMPLE_REGISTRY_HW, gpuVendor: "AMD" });
    expect(gpu.filter((v) => v.group === "amd").every((v) => v.status === "applicable")).toBe(true);
    expect(
      gpu.filter((v) => v.group === "nvidia").every((v) => v.status === "not-applicable"),
    ).toBe(true);
  });

  it("keeps diagnostic TDR values read-only", () => {
    const diag = GPU_REGISTRY_VALUES.filter((v) => v.group === "diagnostic");
    expect(diag).toHaveLength(4);
    expect(diag.every((v) => v.status === "diagnostic")).toBe(true);
  });

  it("only offers CUDA P2P with more than one NVIDIA GPU", () => {
    expect(byId(GPU_REGISTRY_VALUES, "gpu.nvidia.force_p2p")?.status).toBe("not-applicable");
    const { gpu } = valuesForHardware({ ...SAMPLE_REGISTRY_HW, gpuCount: 2 });
    expect(byId(gpu, "gpu.nvidia.force_p2p")?.status).toBe("applicable");
  });

  it("only offers the MPO fix under Pro, Ultimate or Maximum Performance", () => {
    expect(byId(GPU_REGISTRY_VALUES, "gpu.universal.overlay_test_mode")?.status).toBe(
      "not-applicable",
    );
    const { gpu } = valuesForHardware({ ...SAMPLE_REGISTRY_HW, profile: "Pro" });
    expect(byId(gpu, "gpu.universal.overlay_test_mode")?.status).toBe("applicable");
  });

  it("counts only applicable values as needing a restart", () => {
    const s = registrySummary(GPU_REGISTRY_VALUES);
    expect(s.applicable + s.notApplicable + s.diagnostic).toBe(s.total);
    expect(s.restart).toBeLessThanOrEqual(s.applicable);
  });
});

import { describe, expect, it } from "vitest";
import { SimulatedWorkloadBackend } from "@/lib/eo/workload/backend";
import { resolveWorkloads, summarizeWorkloads } from "@/lib/eo/workload/optimizer";
import {
  addCustomApp, deleteCustomApp, makeCustomApp, parseStoredCustomApps, updateCustomApp, validateCustomApp,
} from "@/lib/eo/workload/customApps";
import { InstalledApplicationDiscovery, WorkloadOptimizer, reduceProcessEvent, type MonitorState } from "@/lib/eo/workload/services";
import type { EligibleApp, ProcessEvent, RunningWorkload, WorkloadCategory } from "@/lib/eo/workload/types";

const run = (pid: number, category: WorkloadCategory, startedAt = pid): RunningWorkload => ({
  pid, appId: `a${pid}`, name: `App${pid}`, exe: `app${pid}.exe`, category, startedAt, origin: "EXTERNAL", paused: false,
});

async function inventory() {
  return new InstalledApplicationDiscovery(new SimulatedWorkloadBackend(0)).scan();
}

describe("discovery adapter", () => {
  it("returns eligible apps labelled as sample data in preview", async () => {
    const apps = await inventory();
    expect(apps.length).toBeGreaterThanOrEqual(11);
    expect(apps.every((a) => a.source === "SAMPLE")).toBe(true);
    expect(apps.find((a) => a.name === "Valorant")?.category).toBe("GAMES");
  });
});

describe("process monitor", () => {
  const start = (pid: number, exe: string, origin: ProcessEvent["origin"] = "EXTERNAL"): ProcessEvent =>
    ({ type: "process-start", pid, exe, origin, at: 1 });

  it("detects apps launched outside Error Optimizer and launched from it", async () => {
    const apps = await inventory();
    let s: MonitorState = { running: [], foregroundPid: null };
    s = reduceProcessEvent(s, start(100, "VALORANT-Win64-Shipping.exe", "EO_LAUNCH"), apps);
    s = reduceProcessEvent(s, start(200, "AfterFX.exe"), apps);
    s = reduceProcessEvent(s, start(300, "HD-Player.exe"), apps);
    expect(s.running.map((w) => [w.name, w.category, w.origin])).toEqual([
      ["Valorant", "GAMES", "EO_LAUNCH"],
      ["After Effects", "CREATIVE", "EXTERNAL"],
      ["MSI App Player 5", "EMULATORS", "EXTERNAL"],
    ]);
  });

  it("ignores non-eligible and critical Windows processes", async () => {
    const apps = await inventory();
    let s: MonitorState = { running: [], foregroundPid: null };
    s = reduceProcessEvent(s, start(1, "notepad.exe"), apps);
    s = reduceProcessEvent(s, start(2, "explorer.exe"), apps);
    expect(s.running).toHaveLength(0);
  });

  it("exiting an app removes it from running workloads", async () => {
    const apps = await inventory();
    let s: MonitorState = { running: [], foregroundPid: null };
    s = reduceProcessEvent(s, start(100, "cs2.exe"), apps);
    s = reduceProcessEvent(s, { type: "process-exit", pid: 100, at: 2 }, apps);
    expect(s.running).toHaveLength(0);
    expect(s.foregroundPid).toBeNull();
  });
});

describe("conflict manager", () => {
  const seven = [run(1, "GAMES"), run(2, "CREATIVE"), run(3, "EMULATORS"), run(4, "VIDEO AI"), run(5, "GAMES"), run(6, "CREATIVE"), run(7, "EMULATORS")];

  it("optimizes 7 simultaneous apps independently with non-overlapping affinity", () => {
    const r = resolveWorkloads(seven, 1);
    expect(r.every((w) => w.status === "OPTIMIZED")).toBe(true);
    const cores = r.flatMap((w) => w.plan.affinity ?? []);
    expect(new Set(cores).size).toBe(cores.length);
    expect(cores).not.toContain(0);
    expect(cores).not.toContain(1);
  });

  it("flags contention when cores run out", () => {
    const r = resolveWorkloads(seven, 1);
    expect(r.some((w) => w.contention)).toBe(true);
    expect(r.filter((w) => w.plan.affinity === null).length).toBeGreaterThan(0);
  });

  it("only the foreground app gets High priority, and it follows focus", () => {
    const list = [run(1, "GAMES"), run(2, "CREATIVE"), run(3, "EMULATORS")];
    const a = resolveWorkloads(list, 1);
    expect(a.filter((w) => w.plan.priority === "HIGH").map((w) => w.pid)).toEqual([1]);
    const b = resolveWorkloads(list, 2);
    expect(b.filter((w) => w.plan.priority === "HIGH").map((w) => w.pid)).toEqual([2]);
  });

  it("background apps drop to Normal when more than 4 are active", () => {
    const r = resolveWorkloads(seven, 1);
    expect(r.filter((w) => !w.foreground).every((w) => w.plan.priority === "NORMAL")).toBe(true);
  });

  it("stopping optimization keeps the app listed and releases its cores", () => {
    const list = [run(1, "GAMES"), { ...run(2, "CREATIVE"), paused: true }];
    const r = resolveWorkloads(list, 1);
    expect(r).toHaveLength(2);
    expect(r[1]!.status).toBe("PAUSED");
    expect(r[1]!.plan.affinity).toBeNull();
    expect(summarizeWorkloads(r).optimized).toBe(1);
  });

  it("stop optimization reverts the plan without terminating the process", async () => {
    const be = new SimulatedWorkloadBackend(0);
    const opt = new WorkloadOptimizer(be);
    const list = [run(1, "GAMES")];
    await opt.sync(resolveWorkloads(list, 1));
    expect(be.applied.has(1)).toBe(true);
    await opt.sync(resolveWorkloads([{ ...list[0]!, paused: true }], 1));
    expect(be.applied.has(1)).toBe(false);
  });
});

describe("custom applications", () => {
  const base: EligibleApp[] = [];
  const input = { name: "Unreal Editor", path: "C:\\UE\\UnrealEditor.exe", category: "CREATIVE" as const };

  it("validates name, .exe path, critical processes and duplicates", () => {
    expect(validateCustomApp({ ...input, name: " " }, base)).toMatch(/name/);
    expect(validateCustomApp({ ...input, path: "C:\\x\\tool.bat" }, base)).toMatch(/\.exe/);
    expect(validateCustomApp({ ...input, path: "C:\\Windows\\explorer.exe" }, base)).toMatch(/critical/);
    const list = addCustomApp(base, makeCustomApp(input, "c1"));
    expect(validateCustomApp(input, list)).toMatch(/already/);
    expect(validateCustomApp(input, list, "c1")).toBeNull();
  });

  it("adds, edits, deletes and survives a reload", () => {
    let list = addCustomApp(base, makeCustomApp(input, "c1"));
    list = updateCustomApp(list, "c1", { ...input, name: "UE5", category: "GAMES" });
    expect(list[0]).toMatchObject({ name: "UE5", category: "GAMES", exe: "UnrealEditor.exe" });
    const reloaded = parseStoredCustomApps(JSON.parse(JSON.stringify(list)));
    expect(reloaded).toEqual(list);
    expect(deleteCustomApp(reloaded, "c1")).toEqual([]);
  });
});

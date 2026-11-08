// Native backend adapter. The C#/.NET 8 host (WebView2) implements these messages; the browser
// preview uses SimulatedWorkloadBackend, which never claims real Windows changes.
import type { EligibleApp, LaunchOrigin, OptimizationPlan, ProcessEvent } from "./types";

export interface WorkloadBackend {
  readonly mode: "NATIVE" | "SIMULATED";
  /** Registry uninstall keys, install dirs, known paths and running processes. */
  discoverInstalledApps(): Promise<EligibleApp[]>;
  launch(app: EligibleApp): Promise<{ pid: number }>;
  applyPlan(pid: number, plan: OptimizationPlan): Promise<void>;
  revertPlan(pid: number): Promise<void>;
  /** Event-driven process start/exit/foreground notifications (WMI / ETW on the native side). */
  subscribe(handler: (e: ProcessEvent) => void): () => void;
  pickExecutable(): Promise<string | null>;
}

/* ───── Native (WebView2) ───── */
interface WebView {
  postMessage: (m: unknown) => void;
  addEventListener?: (t: "message", h: (e: { data: unknown }) => void) => void;
  removeEventListener?: (t: "message", h: (e: { data: unknown }) => void) => void;
}

export class WebView2WorkloadBackend implements WorkloadBackend {
  readonly mode = "NATIVE" as const;
  private seq = 0;
  private pending = new Map<string, { ok: (v: unknown) => void; fail: (e: Error) => void }>();
  private handlers = new Set<(e: ProcessEvent) => void>();

  constructor(private wv: WebView) {
    wv.addEventListener?.("message", (e) => {
      const msg = (typeof e.data === "string" ? safeJson(e.data) : e.data) as
        | { id?: string; ok?: boolean; result?: unknown; error?: string; event?: ProcessEvent }
        | null;
      if (!msg) return;
      if (msg.event) this.handlers.forEach((h) => h(msg.event!));
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.ok === false) p.fail(new Error(msg.error ?? "Native request failed"));
        else p.ok(msg.result);
      }
    });
  }

  private request<T>(action: string, payload?: unknown): Promise<T> {
    const id = `wl-${++this.seq}`;
    return new Promise<T>((ok, fail) => {
      this.pending.set(id, { ok: ok as (v: unknown) => void, fail });
      this.wv.postMessage(JSON.stringify({ id, action, payload }));
      setTimeout(() => {
        if (this.pending.delete(id)) fail(new Error(`Native backend timed out (${action})`));
      }, 15000);
    });
  }

  discoverInstalledApps() { return this.request<EligibleApp[]>("workload:discover"); }
  launch(app: EligibleApp) { return this.request<{ pid: number }>("workload:launch", { path: app.path }); }
  applyPlan(pid: number, plan: OptimizationPlan) { return this.request<void>("workload:apply", { pid, plan }); }
  revertPlan(pid: number) { return this.request<void>("workload:revert", { pid }); }
  pickExecutable() { return this.request<string | null>("workload:pick-exe"); }
  subscribe(h: (e: ProcessEvent) => void) {
    this.handlers.add(h);
    void this.request("workload:monitor-start").catch(() => {});
    return () => { this.handlers.delete(h); };
  }
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

/* ───── Browser preview ───── */
/** Clearly labelled sample inventory — only used when no native host is connected. */
export const SAMPLE_INVENTORY: Omit<EligibleApp, "id" | "source">[] = [
  { name: "Valorant", category: "GAMES", exe: "VALORANT-Win64-Shipping.exe", path: "C:\\Riot Games\\VALORANT\\live\\ShooterGame\\Binaries\\Win64\\VALORANT-Win64-Shipping.exe" },
  { name: "Counter-Strike 2", category: "GAMES", exe: "cs2.exe", path: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\bin\\win64\\cs2.exe" },
  { name: "Cyberpunk 2077", category: "GAMES", exe: "Cyberpunk2077.exe", path: "D:\\Games\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe" },
  { name: "Adobe Premiere Pro", category: "CREATIVE", exe: "Adobe Premiere Pro.exe", path: "C:\\Program Files\\Adobe\\Adobe Premiere Pro 2025\\Adobe Premiere Pro.exe" },
  { name: "DaVinci Resolve", category: "CREATIVE", exe: "Resolve.exe", path: "C:\\Program Files\\Blackmagic Design\\DaVinci Resolve\\Resolve.exe" },
  { name: "After Effects", category: "CREATIVE", exe: "AfterFX.exe", path: "C:\\Program Files\\Adobe\\Adobe After Effects 2025\\Support Files\\AfterFX.exe" },
  { name: "Blender", category: "CREATIVE", exe: "blender.exe", path: "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe" },
  { name: "Topaz Video AI", category: "VIDEO AI", exe: "Topaz Video AI.exe", path: "C:\\Program Files\\Topaz Labs LLC\\Topaz Video AI\\Topaz Video AI.exe" },
  { name: "ComfyUI", category: "VIDEO AI", exe: "ComfyUI.exe", path: "C:\\AI\\ComfyUI\\ComfyUI.exe" },
  { name: "MSI App Player 5", category: "EMULATORS", exe: "HD-Player.exe", path: "C:\\Program Files\\BlueStacks_msi5\\HD-Player.exe" },
  { name: "LDPlayer 9", category: "EMULATORS", exe: "dnplayer.exe", path: "C:\\LDPlayer\\LDPlayer9\\dnplayer.exe" },
];

export class SimulatedWorkloadBackend implements WorkloadBackend {
  readonly mode = "SIMULATED" as const;
  private handlers = new Set<(e: ProcessEvent) => void>();
  private live = new Set<number>();
  readonly applied = new Map<number, OptimizationPlan>();
  constructor(private delayMs = 350) {}

  async discoverInstalledApps(): Promise<EligibleApp[]> {
    return SAMPLE_INVENTORY.map((a) => ({ ...a, id: `sample:${a.exe.toLowerCase()}`, source: "SAMPLE" as const }));
  }
  private newPid() {
    let pid = 0;
    do pid = 1000 + Math.floor(Math.random() * 15000) * 4; while (this.live.has(pid));
    return pid;
  }
  private emit(e: ProcessEvent) { this.handlers.forEach((h) => h(e)); }
  private start(app: EligibleApp, origin: LaunchOrigin) {
    const pid = this.newPid();
    this.live.add(pid);
    const fire = () => this.emit({ type: "process-start", pid, exe: app.exe, path: app.path, origin, at: Date.now() });
    if (this.delayMs > 0) setTimeout(fire, this.delayMs); else fire();
    return pid;
  }
  async launch(app: EligibleApp) { return { pid: this.start(app, "EO_LAUNCH") }; }
  async applyPlan(pid: number, plan: OptimizationPlan) { this.applied.set(pid, plan); }
  async revertPlan(pid: number) { this.applied.delete(pid); }
  async pickExecutable() { return null; }
  subscribe(h: (e: ProcessEvent) => void) { this.handlers.add(h); return () => { this.handlers.delete(h); }; }

  /* Preview-only helpers that stand in for things the user does outside the app. */
  simulateExternalStart(app: EligibleApp) { return this.start(app, "EXTERNAL"); }
  simulateExit(pid: number) {
    this.live.delete(pid);
    this.applied.delete(pid);
    this.emit({ type: "process-exit", pid, at: Date.now() });
  }
  simulateForeground(pid: number) { this.emit({ type: "foreground-change", pid, at: Date.now() }); }
}

export function createWorkloadBackend(): WorkloadBackend {
  const wv = typeof window !== "undefined" ? (window.chrome?.webview as WebView | undefined) : undefined;
  return wv ? new WebView2WorkloadBackend(wv) : new SimulatedWorkloadBackend();
}

// Workload Optimization sub-module: running workloads, eligible inventory, custom app management.
import { useEffect, useState } from "react";
import { Folder, Pencil, Play, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Btn, Card, Chips, Label, Modal } from "./kit";
import { PremiumSelect } from "./dropdown";
import { useWorkloads, workloadActions } from "./workloadStore";
import { fmtAffinity, fmtPriority, CATEGORY_RULES } from "@/lib/eo/workload/optimizer";
import {
  WORKLOAD_CATEGORIES,
  type EligibleApp,
  type WorkloadCategory,
} from "@/lib/eo/workload/types";
import { cn } from "@/lib/utils";

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}

function fmtDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(ss).padStart(2, "0")}s`;
}

const SOURCE_LABEL: Record<EligibleApp["source"], string> = {
  REGISTRY: "REGISTRY",
  INSTALL_DIR: "INSTALL DIR",
  KNOWN_PATH: "KNOWN PATH",
  RUNNING_PROCESS: "RUNNING",
  CUSTOM: "CUSTOM",
  SAMPLE: "SAMPLE",
};

export function WorkloadOptimizationPanel() {
  const wl = useWorkloads();
  const sim = wl.mode === "SIMULATED";
  const [inv, setInv] = useState("ALL");
  const now = useNow(wl.workloads.length > 0);

  const [editor, setEditor] = useState<{
    id?: string;
    name: string;
    path: string;
    category: WorkloadCategory;
  } | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EligibleApp | null>(null);
  const [externalPick, setExternalPick] = useState("");

  const runningExes = new Set(wl.workloads.map((w) => w.exe.toLowerCase()));
  const notRunning = wl.inventory.filter((a) => !runningExes.has(a.exe.toLowerCase()));

  const launch = (app: EligibleApp) => {
    workloadActions.launch(app).then(
      () =>
        toast.success(`Launching ${app.name}`, {
          description: sim
            ? "Preview: process start simulated. Optimization activates automatically when it is detected. No real app was opened."
            : "Optimization activates automatically when the process is detected.",
        }),
      (e: Error) => toast.error(`Could not launch ${app.name}`, { description: e.message }),
    );
  };

  const saveEditor = () => {
    if (!editor) return;
    const input = { name: editor.name, path: editor.path, category: editor.category };
    const err = editor.id
      ? workloadActions.custom.update(editor.id, input)
      : workloadActions.custom.add(input);
    if (err) {
      setEditorError(err);
      return;
    }
    toast.success(editor.id ? "Custom app updated" : "Custom app saved", {
      description: `${editor.name.trim()} · ${editor.category}. It will be optimized automatically when it starts.`,
    });
    setEditor(null);
  };

  const browse = async () => {
    const p = await workloadActions.custom.pickExecutable();
    if (p && editor) setEditor({ ...editor, path: p });
  };

  return (
    <>
      {sim && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-[11.5px] text-muted-foreground">
          <Badge tone="warning">BROWSER PREVIEW</Badge>
          <span>
            No Windows backend connected. Inventory is sample data and launches, process detection
            and CPU/GPU changes are simulated. Nothing on this PC is changed.
          </span>
        </div>
      )}

      {/* Currently running workloads */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Label className="text-foreground">CURRENTLY RUNNING WORKLOADS</Label>
            <Badge tone={wl.workloads.length > 0 ? "success" : "muted"}>
              {wl.workloads.length} ACTIVE
            </Badge>
            <Badge tone="muted">AUTO-DETECT · ON</Badge>
          </div>
          {sim && notRunning.length > 0 && (
            <div className="flex items-center gap-2">
              <PremiumSelect
                size="sm"
                label="App started outside Error Optimizer (preview)"
                value={externalPick || notRunning[0]!.id}
                onChange={setExternalPick}
                options={notRunning.map((a) => ({ value: a.id, label: a.name }))}
              />
              <Btn
                size="sm"
                variant="ghost"
                title="Preview only: pretend this app was opened normally from Windows"
                onClick={() => {
                  const app = notRunning.find((a) => a.id === externalPick) ?? notRunning[0]!;
                  workloadActions.preview.externalStart(app);
                  setExternalPick("");
                  toast.info(`Preview: ${app.name} started outside Error Optimizer`, {
                    description:
                      "The process monitor will detect it and optimize it automatically. (Simulated)",
                  });
                }}
              >
                Simulate outside start
              </Btn>
            </div>
          )}
        </div>

        {wl.workloads.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border-strong p-4">
            <span className="text-xl">🎮</span>
            <div>
              <div className="text-[13px] font-bold">NO SUPPORTED WORKLOAD RUNNING</div>
              <p className="text-xs text-muted-foreground">
                Launch an eligible app below, or open it normally from Windows — it is detected and
                optimized automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {wl.workloads.map((w) => {
              const paused = w.status === "PAUSED";
              return (
                <div
                  key={w.pid}
                  className={cn(
                    "rounded-lg border p-3",
                    paused ? "border-border bg-window" : "border-cyan/40 bg-cyan/5",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{paused ? "⏸" : "⚡"}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-foreground">
                            {w.name.toUpperCase()}
                          </span>
                          <Badge tone="cyan">{w.category}</Badge>
                          {w.foreground && <Badge tone="cyan">IN FOCUS</Badge>}
                          <span className="font-mono text-[10.5px] text-muted-foreground">
                            {w.exe}
                          </span>
                          <span className="font-mono text-[10.5px] text-muted-foreground">
                            PID: {w.pid}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {w.origin === "EO_LAUNCH"
                            ? "Launched from Error Optimizer"
                            : "Detected · started outside Error Optimizer"}
                          {" · "}Started {new Date(w.startedAt).toLocaleTimeString()} · Running{" "}
                          {fmtDuration(now - w.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {paused ? (
                        <Badge tone="muted">OPTIMIZATION STOPPED</Badge>
                      ) : (
                        <Badge tone="success">
                          {sim ? "OPTIMIZED · SIMULATED" : "OPTIMIZED · ACTIVE"}
                        </Badge>
                      )}
                      {paused ? (
                        <Btn
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            workloadActions.resumeOptimization(w.pid);
                            toast.success(`Optimization resumed: ${w.name}`);
                          }}
                        >
                          Resume Optimization
                        </Btn>
                      ) : (
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            workloadActions.stopOptimization(w.pid);
                            toast.info(`Optimization stopped: ${w.name}`, {
                              description: "Windows defaults restored. The app keeps running.",
                            });
                          }}
                        >
                          Stop Optimization
                        </Btn>
                      )}
                      {sim && !w.foreground && (
                        <Btn
                          size="sm"
                          variant="ghost"
                          title="Preview only: bring this app to the front"
                          onClick={() => workloadActions.preview.focus(w.pid)}
                        >
                          Focus
                        </Btn>
                      )}
                      {sim && (
                        <Btn
                          size="sm"
                          variant="ghost"
                          title="Preview only: pretend the user closed this app"
                          onClick={() => {
                            workloadActions.preview.exit(w.pid);
                            toast.info(`${w.name} exited`, {
                              description: "Removed from running workloads. (Simulated)",
                            });
                          }}
                        >
                          Simulate exit
                        </Btn>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                    {[
                      ["CPU PRIORITY", fmtPriority(w.plan.priority)],
                      ["CPU AFFINITY", fmtAffinity(w.plan.affinity)],
                      ["MEMORY", w.plan.memory],
                      ["GPU", w.plan.gpu],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded border border-border bg-window px-2 py-1.5">
                        <div className="text-[9.5px] font-bold tracking-wider text-subtle">{k}</div>
                        <div className="text-foreground">{v}</div>
                      </div>
                    ))}
                  </div>
                  {(w.plan.actions.length > 0 || w.plan.notes.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {w.plan.actions.map((a) => (
                        <Badge key={a} tone="success">
                          {a}
                        </Badge>
                      ))}
                      {w.plan.notes.map((n) => (
                        <Badge key={n} tone={n.startsWith("Contention") ? "warning" : "muted"}>
                          {n}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {wl.workloads.filter((w) => w.status === "OPTIMIZED").length > 1 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-window text-[11px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-cyan" />
                <span>
                  Conflict management: each workload has its own non-overlapping cores (cores 0–1
                  stay with Windows). Only the app in focus gets High priority; others are
                  recalculated when focus changes.
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Eligible application inventory */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Label className="text-foreground">INSTALLED WORKLOAD INVENTORY</Label>
          <Badge tone={sim ? "warning" : "success"}>
            {sim ? "SAMPLE DATA" : "DETECTED ON THIS PC"}
          </Badge>
          <Badge tone="muted">{wl.inventory.length} ELIGIBLE</Badge>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <Chips options={["ALL", ...WORKLOAD_CATEGORIES]} value={inv} onChange={setInv} />
          <Btn
            size="sm"
            onClick={() => {
              setEditorError(null);
              setEditor({ name: "", path: "", category: "GAMES" });
            }}
          >
            + Add custom app
          </Btn>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {wl.inventory
            .filter((x) => inv === "ALL" || x.category === inv)
            .map((a) => {
              const running = runningExes.has(a.exe.toLowerCase());
              const launching = wl.launching.includes(a.exe);
              return (
                <div
                  key={a.id}
                  className={cn(
                    "flex flex-col justify-between gap-2 eo-list-row rounded-lg border bg-window p-3 text-[12.5px]",
                    running ? "border-cyan/60 bg-cyan/5 shadow-sm shadow-cyan/10" : "border-border",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">{a.name}</span>
                    <div className="flex items-center gap-1">
                      <Badge tone="muted">{SOURCE_LABEL[a.source]}</Badge>
                      <Badge tone={running ? "cyan" : "muted"}>{a.category}</Badge>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1" title={a.path}>
                    Auto: {CATEGORY_RULES[a.category].label}
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border pt-2 mt-1">
                    <span
                      className="font-mono text-[10px] text-subtle truncate max-w-[140px]"
                      title={a.path}
                    >
                      {a.exe}
                    </span>
                    <div className="flex items-center gap-1">
                      {a.source === "CUSTOM" && (
                        <>
                          <Btn
                            size="sm"
                            variant="ghost"
                            label={`Edit ${a.name}`}
                            title="Edit"
                            onClick={() => {
                              setEditorError(null);
                              setEditor({
                                id: a.id,
                                name: a.name,
                                path: a.path,
                                category: a.category,
                              });
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Btn>
                          <Btn
                            size="sm"
                            variant="ghost"
                            label={`Delete ${a.name}`}
                            title="Delete"
                            onClick={() => setConfirmDelete(a)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Btn>
                        </>
                      )}
                      {running ? (
                        <Badge tone="success">RUNNING</Badge>
                      ) : (
                        <Btn
                          size="sm"
                          variant="outline"
                          loading={launching}
                          onClick={() => launch(a)}
                        >
                          <Play className="h-3 w-3 mr-1" /> Launch
                        </Btn>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <Btn
          size="sm"
          variant="ghost"
          className="mt-3"
          loading={wl.scanning}
          onClick={() => {
            void workloadActions.rescan().then(() =>
              toast.info("Inventory rescanned", {
                description: sim
                  ? "Preview: sample inventory reloaded. A connected Windows backend scans the registry, install folders and running processes."
                  : "Scanned installed apps, install folders, known paths and running processes.",
              }),
            );
          }}
        >
          Force rescan inventory
        </Btn>
      </Card>

      {/* Add / edit custom app */}
      <Modal
        open={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.id ? "Edit Custom Application" : "Add Custom Application"}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEditor(null)}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={saveEditor}>
              Save
            </Btn>
          </>
        }
      >
        {editor && (
          <div className="space-y-3">
            <div>
              <Label className="mb-1">APPLICATION NAME</Label>
              <input
                aria-label="Application name"
                className="h-9 w-full rounded-lg border border-border bg-window px-3 text-sm focus:outline-none focus:border-cyan"
                placeholder="e.g. Unreal Editor"
                value={editor.name}
                onChange={(e) => {
                  setEditor({ ...editor, name: e.target.value });
                  setEditorError(null);
                }}
              />
            </div>
            <div>
              <Label className="mb-1">EXECUTABLE PATH</Label>
              <div className="flex gap-2">
                <input
                  aria-label="Executable path"
                  className="h-9 w-full rounded-lg border border-border bg-window px-3 font-mono text-[12px] focus:outline-none focus:border-cyan"
                  placeholder="C:\Program Files\App\app.exe"
                  value={editor.path}
                  onChange={(e) => {
                    setEditor({ ...editor, path: e.target.value });
                    setEditorError(null);
                  }}
                />
                {!sim && (
                  <Btn variant="ghost" onClick={browse}>
                    <Folder className="h-3.5 w-3.5 mr-1" /> Browse
                  </Btn>
                )}
              </div>
            </div>
            <div>
              <Label className="mb-1">CATEGORY</Label>
              <PremiumSelect
                label="Workload Category"
                value={editor.category}
                onChange={(v) => setEditor({ ...editor, category: v })}
                options={WORKLOAD_CATEGORIES}
              />
            </div>
            {editorError && (
              <p role="alert" className="text-xs text-destructive">
                {editorError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Optimization is chosen automatically from the category (
              {CATEGORY_RULES[editor.category].label}). Critical Windows processes cannot be added.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete custom application?"
        tone="danger"
        width="max-w-md"
        icon={<Trash2 className="h-4 w-4" />}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                if (!confirmDelete) return;
                workloadActions.custom.remove(confirmDelete.id);
                toast.info(`${confirmDelete.name} deleted`, {
                  description: "Removed from the inventory. The app itself is not uninstalled.",
                });
                setConfirmDelete(null);
              }}
            >
              Delete
            </Btn>
          </>
        }
      >
        <p className="text-[12.5px] text-muted-foreground">
          {confirmDelete?.name} will be removed from the inventory and no longer optimized
          automatically. The program on your PC is not touched.
        </p>
      </Modal>
    </>
  );
}

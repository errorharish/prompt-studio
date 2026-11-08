// Shared restore point workflow (Backup & Restore, Dashboard Quick Optimize, run dialogs).
// Check System Protection → (if off) "System Protection Is Disabled" → explicit confirmation
// → enable → verify → create → verify → result. Every step is simulated; rules live in
// src/lib/eo/restorePoint.ts and the simulated device state in restorePointStore.ts.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  HardDrive,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  type LucideIcon,
} from "lucide-react";
import { Badge, Btn, KV, Modal } from "./kit";
import { OpProgress } from "./OpProgress";
import { getRestoreState, setRestoreState } from "./restorePointStore";
import {
  MANUAL_ENABLE_STEPS,
  SYSTEM_DRIVE,
  canCancel,
  restoreProgress,
  restoreStep,
  scenarioAfterEnable,
  simulatedProtection,
  simulatedProtectionAfterEnable,
  type RestoreEvent,
  type RestoreStage,
} from "@/lib/eo/restorePoint";

type Tone = "cyan" | "success" | "warning" | "danger";

export function stageMeta(stage: RestoreStage): {
  title: string;
  sub: string;
  tone: Tone;
  Icon: LucideIcon;
} {
  switch (stage) {
    case "protection-required":
      return {
        title: "System Protection Is Disabled",
        sub: "Required before a restore point can be created · simulated",
        tone: "warning",
        Icon: ShieldAlert,
      };
    case "confirm-enable":
      return {
        title: "Enable System Protection?",
        sub: `Only ${SYSTEM_DRIVE.label} is changed · simulated`,
        tone: "warning",
        Icon: ShieldAlert,
      };
    case "enabling":
    case "verifying-protection":
      return {
        title: "Enabling System Protection",
        sub: "Simulated — no Windows setting is changed",
        tone: "cyan",
        Icon: Loader2,
      };
    case "checking":
      return {
        title: "Checking System Protection",
        sub: "Simulated status check",
        tone: "cyan",
        Icon: Loader2,
      };
    case "creating":
    case "verifying-point":
      return {
        title: "Creating Restore Point",
        sub: "Simulated — no restore point is written",
        tone: "cyan",
        Icon: Loader2,
      };
    case "success":
      return {
        title: "Restore Point Created",
        sub: "Simulated result · nothing on this PC changed",
        tone: "success",
        Icon: CheckCircle2,
      };
    case "enable-failed":
      return {
        title: "System Protection Couldn't Be Enabled",
        sub: "No restore point was created",
        tone: "danger",
        Icon: ShieldX,
      };
    case "create-failed":
      return {
        title: "Restore Point Not Created",
        sub: "Creation could not be verified",
        tone: "danger",
        Icon: ShieldX,
      };
    default:
      return {
        title: "Create Restore Point",
        sub: "Simulated · checks System Protection first",
        tone: "cyan",
        Icon: ShieldCheck,
      };
  }
}

export interface RestoreFlow {
  stage: RestoreStage;
  enableStep: 0 | 1;
  result: { name: string; at: string } | null;
  name: string;
  setName: (v: string) => void;
  send: (e: RestoreEvent) => void;
  start: () => void;
  /** Back to the name step; optionally with a new default name. */
  reset: (name?: string) => void;
}

const DELAY: Partial<Record<RestoreStage, number>> = {
  checking: 900,
  "verifying-protection": 800,
  creating: 1400,
  "verifying-point": 700,
};

export function useRestorePointFlow(defaultName: string): RestoreFlow {
  const [stage, setStage] = useState<RestoreStage>("idle");
  const [enableStep, setEnableStep] = useState<0 | 1>(0);
  const [result, setResult] = useState<RestoreFlow["result"]>(null);
  const [name, setName] = useState(defaultName);
  const nameRef = useRef(name);
  nameRef.current = name;
  const send = useCallback((e: RestoreEvent) => setStage((s) => restoreStep(s, e)), []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const scenario = getRestoreState().scenario;
    if (stage === "checking") {
      after(DELAY.checking ?? 0, () =>
        send({ type: "checked", protection: simulatedProtection(scenario) }),
      );
    } else if (stage === "enabling") {
      setEnableStep(0);
      // Native app: UAC elevation prompt, then the SystemRestore WMI call (see Blueprint).
      after(1000, () => setEnableStep(1));
      after(2000, () => send({ type: "enable-finished" }));
    } else if (stage === "verifying-protection") {
      after(DELAY["verifying-protection"] ?? 0, () => {
        const on = simulatedProtectionAfterEnable(scenario);
        setRestoreState({ scenario: scenarioAfterEnable(scenario, on) });
        send({ type: "protection-verified", on });
      });
    } else if (stage === "creating") {
      after(DELAY.creating ?? 0, () => send({ type: "created" }));
    } else if (stage === "verifying-point") {
      after(DELAY["verifying-point"] ?? 0, () => {
        const point = { name: nameRef.current.trim(), at: new Date().toLocaleString() };
        setResult(point);
        setRestoreState({ last: point });
        send({ type: "point-verified", ok: true });
      });
    }
    return () => timers.forEach(clearTimeout);
  }, [stage, send]);

  return {
    stage,
    enableStep,
    result,
    name,
    setName,
    send,
    start: () => {
      setResult(null);
      send({ type: "start" });
    },
    reset: (next) => {
      setStage("idle");
      setResult(null);
      setName(next ?? defaultName);
    },
  };
}

function DriveRow({ on }: { on: boolean }) {
  return (
    <div className="eo-rp-drive">
      <span className="eo-row-icon" aria-hidden="true">
        <HardDrive className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold">{SYSTEM_DRIVE.label}</span>
        <span className="block text-[11px] text-muted-foreground">
          {SYSTEM_DRIVE.role} · sample
        </span>
      </span>
      <Badge tone={on ? "success" : "warning"}>{on ? "PROTECTION ON" : "PROTECTION OFF"}</Badge>
    </div>
  );
}

/** Stage body. `heading` repeats the stage title inside the body (used inside other dialogs). */
export function RestorePointBody({
  flow,
  heading,
}: {
  flow: RestoreFlow;
  heading?: boolean | undefined;
}) {
  const { stage } = flow;
  const meta = stageMeta(stage);
  const value = restoreProgress(stage);
  const name = flow.name.trim() || "Restore point";
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {heading && stage !== "idle" && (
        <h3 className="flex items-center gap-2 text-[13.5px] font-bold" data-tone={meta.tone}>
          <meta.Icon
            aria-hidden="true"
            className={meta.Icon === Loader2 ? "eo-spin h-4 w-4" : "h-4 w-4"}
          />
          {meta.title}
        </h3>
      )}
      {stage === "checking" && (
        <OpProgress
          value={value}
          title="Checking System Protection…"
          detail={`${SYSTEM_DRIVE.label} · reading protection status`}
          active
        />
      )}
      {stage === "protection-required" && (
        <>
          <p className="text-[12.5px] text-muted-foreground">
            Windows can only create a restore point on a drive with System Protection turned on. It
            is off for your system drive, so a restore point can't be created yet.
          </p>
          <DriveRow on={false} />
          <p className="text-[11px] text-subtle">
            Nothing changes until you choose Enable System Protection and confirm. Other drives are
            never touched.
          </p>
        </>
      )}
      {stage === "confirm-enable" && (
        <>
          <ul className="eo-rp-list" aria-label="What will happen">
            <li>
              Turns on System Protection for <b>{SYSTEM_DRIVE.label}</b> only — other drives stay as
              they are.
            </li>
            <li>Windows asks for administrator permission first.</li>
            <li>
              Windows reserves part of {SYSTEM_DRIVE.letter} for restore points; you can change this
              later in System Properties.
            </li>
            <li>Existing restore points are kept. Protection is never turned off by the app.</li>
            <li>The setting is read back before the restore point is created.</li>
          </ul>
          <DriveRow on={false} />
        </>
      )}
      {(stage === "enabling" || stage === "verifying-protection") && (
        <OpProgress
          value={value}
          title={
            stage === "verifying-protection"
              ? "Verifying protection status…"
              : flow.enableStep === 0
                ? "Requesting administrator permission…"
                : `Turning on protection for ${SYSTEM_DRIVE.letter}…`
          }
          detail={
            stage === "verifying-protection"
              ? `Reading the setting back for ${SYSTEM_DRIVE.letter}`
              : "The native app shows the Windows permission prompt here"
          }
          active
        />
      )}
      {(stage === "creating" || stage === "verifying-point") && (
        <OpProgress
          value={value}
          title={stage === "creating" ? `Creating “${name}”…` : "Verifying restore point…"}
          detail={
            stage === "creating"
              ? `System Protection verified on ${SYSTEM_DRIVE.letter}`
              : "Confirming it appears in the restore point list"
          }
          active
        />
      )}
      {stage === "success" && flow.result && (
        <>
          <div className="eo-rp-alert" data-tone="success">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>
              Simulated restore point created and verified in the prototype. No restore point exists
              on this PC.
            </span>
          </div>
          <div>
            <KV k="Name" v={`“${flow.result.name}”`} />
            <KV k="Drive" v={`${SYSTEM_DRIVE.label} · protection on`} />
            <KV k="Created" v={flow.result.at} />
            <KV k="Verification" v="Simulated read-back" />
          </div>
        </>
      )}
      {stage === "enable-failed" && (
        <>
          <div className="eo-rp-alert" data-tone="danger">
            <ShieldX aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>
              Protection is still off for {SYSTEM_DRIVE.letter} after the attempt (simulated policy
              block), so no restore point was created.
            </span>
          </div>
          <div>
            <div className="eo-label mb-1.5 text-[10px] text-foreground">TURN IT ON MANUALLY</div>
            <ol className="eo-rp-steps">
              {MANUAL_ENABLE_STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        </>
      )}
      {stage === "create-failed" && (
        <div className="eo-rp-alert" data-tone="danger">
          <ShieldX aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>The restore point could not be verified, so it is not reported as created.</span>
        </div>
      )}
    </div>
  );
}

/** Footer buttons for the current stage. */
export function RestorePointActions({
  flow,
  onCancel,
  onDone,
  doneLabel = "Done",
  extra,
}: {
  flow: RestoreFlow;
  onCancel: () => void;
  onDone: () => void;
  doneLabel?: string | undefined;
  /** Extra buttons shown next to Cancel on failure stages. */
  extra?: ReactNode | undefined;
}) {
  const { stage, send } = flow;
  const cancel = () => {
    send({ type: "cancel" });
    onCancel();
  };
  if (stage === "protection-required")
    return (
      <>
        <Btn variant="ghost" onClick={cancel}>
          Cancel
        </Btn>
        <Btn variant="primary" onClick={() => send({ type: "request-enable" })}>
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Enable System Protection
        </Btn>
      </>
    );
  if (stage === "confirm-enable")
    return (
      <>
        <Btn variant="ghost" onClick={() => send({ type: "back" })}>
          Back
        </Btn>
        <Btn variant="primary" onClick={() => send({ type: "confirm-enable" })}>
          Confirm & enable
        </Btn>
      </>
    );
  if (stage === "success")
    return (
      <Btn variant="primary" onClick={onDone}>
        {doneLabel}
      </Btn>
    );
  if (stage === "enable-failed" || stage === "create-failed")
    return (
      <>
        <Btn variant="ghost" onClick={cancel}>
          Cancel
        </Btn>
        {extra}
        <Btn variant="primary" onClick={() => send({ type: "retry" })}>
          Try again
        </Btn>
      </>
    );
  return (
    <Btn variant="ghost" disabled={!canCancel(stage)} onClick={cancel}>
      Cancel
    </Btn>
  );
}

/** Stand-alone dialog: name → workflow → result. */
export function RestorePointDialog({
  open,
  onClose,
  defaultName = "Before optimization",
}: {
  open: boolean;
  onClose: () => void;
  defaultName?: string | undefined;
}) {
  const flow = useRestorePointFlow(defaultName);
  const { reset } = flow;
  useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const meta = stageMeta(flow.stage);
  const busy = !canCancel(flow.stage) && flow.stage !== "success";
  const close = () => {
    if (busy) return;
    flow.send({ type: "cancel" });
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={meta.title}
      sub={meta.sub}
      width="max-w-md"
      tone={meta.tone}
      icon={
        <meta.Icon
          className={meta.Icon === Loader2 ? "eo-spin h-4 w-4" : "h-4 w-4"}
          aria-hidden="true"
        />
      }
      footer={
        flow.stage === "idle" ? (
          <>
            <Btn variant="ghost" onClick={close}>
              Cancel
            </Btn>
            <Btn variant="primary" disabled={!flow.name.trim()} onClick={flow.start}>
              Create restore point
            </Btn>
          </>
        ) : (
          <RestorePointActions flow={flow} onCancel={onClose} onDone={onClose} />
        )
      }
    >
      {flow.stage === "idle" ? <RestoreNameField flow={flow} /> : <RestorePointBody flow={flow} />}
    </Modal>
  );
}

export function RestoreNameField({ flow }: { flow: RestoreFlow }) {
  return (
    <div className="space-y-2">
      <label htmlFor="eo-rp-name" className="eo-label block text-foreground">
        Restore point name
      </label>
      <input
        id="eo-rp-name"
        value={flow.name}
        onChange={(e) => flow.setName(e.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-window px-3 text-sm outline-none focus:border-cyan/60"
      />
      <p className="text-[11px] text-muted-foreground">
        System Protection on {SYSTEM_DRIVE.label} is checked first. Simulated — no restore point is
        written to this PC.
      </p>
    </div>
  );
}

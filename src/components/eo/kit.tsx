import { useEffect, useRef, useId, useState, type ReactNode } from "react";
import { PremiumSelect } from "./dropdown";
import { Segmented } from "./controls";
import type { ModedSelection } from "./useSelection";
import { createPortal } from "react-dom";
import type React from "react";
import { cn } from "@/lib/utils";
import type { Risk } from "@/lib/eo/data";
import {
  X,
  ArrowLeft,
  ChevronDown,
  FlaskConical,
  Search,
  Check as CheckIcon,
  Loader2,
  Lock,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { GuideButton, GuideSteps, GuideTip, usePageGuide } from "./Guide";
import { stepGuide, type GuideId } from "@/lib/eo/guides";
import { CustomSelectionModal } from "./CustomSelectionModal";

/* ── Card (FigmaCardStyle / GlassCard) ──
 * Pointer light follows the mouse on every card; the gentle tilt (max ±0.8°) is limited to
 * large cards without form fields. Updates are batched per animation frame. */
const TILT_MIN_W = 340;
const TILT_MIN_H = 180;
export function Card({
  className,
  children,
  glow,
  style,
}: {
  className?: string | undefined;
  children: ReactNode;
  glow?: boolean | undefined;
  style?: React.CSSProperties | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reset = () => {
    cancelAnimationFrame(frame.current);
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return (
    <div
      ref={ref}
      style={style}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const { clientX, clientY } = e;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          const node = ref.current;
          const root = document.documentElement.dataset;
          if (!node || root["motion"] === "reduced") return;
          const box = node.getBoundingClientRect();
          const x = (clientX - box.left) / box.width,
            y = (clientY - box.top) / box.height;
          node.style.setProperty("--light-x", `${(x * 100).toFixed(1)}%`);
          node.style.setProperty("--light-y", `${(y * 100).toFixed(1)}%`);
          const canTilt =
            root["depth"] !== "flat" &&
            box.width >= TILT_MIN_W &&
            box.height >= TILT_MIN_H &&
            !node.querySelector("input, select, textarea");
          if (!canTilt) return;
          node.style.setProperty("--tilt-x", `${((0.5 - y) * 1.6).toFixed(2)}deg`);
          node.style.setProperty("--tilt-y", `${((x - 0.5) * 1.6).toFixed(2)}deg`);
        });
      }}
      onPointerLeave={reset}
      className={cn("eo-card eo-depth p-4", glow && "eo-glow", className)}
    >
      {children}
    </div>
  );
}

/** Small uppercase caption. Pass `as="h2"`/`"h3"` when it titles a page section. */
export function Label({
  children,
  className,
  as: Tag = "div",
  id,
}: {
  children: ReactNode;
  className?: string | undefined;
  as?: "div" | "h2" | "h3" | undefined;
  id?: string | undefined;
}) {
  return (
    <Tag id={id} className={cn("eo-label text-muted-foreground", className)}>
      {children}
    </Tag>
  );
}

export function SectionTitle({
  title,
  sub,
  right,
  badge,
  id,
  guide,
}: {
  title: string;
  sub?: string | undefined;
  right?: ReactNode | undefined;
  badge?: ReactNode | undefined;
  id?: string | undefined;
  /** Contextual guide shown as a help icon beside the title. */
  guide?: GuideId | undefined;
}) {
  return (
    <div className="eo-section-title mb-3 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-1 rounded-full bg-cyan" />
          <h2 id={id} className="eo-label text-[11.5px] text-foreground">
            {title}
          </h2>
          {guide && <GuideTip id={guide} />}
          {badge}
        </div>
        {sub && <p className="mt-0.5 pl-3 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

/* ── Badges (Theme/Badges.xaml) ── */
type Tone = "cyan" | "primary" | "success" | "warning" | "danger" | "muted";
const toneCls: Record<Tone, string> = {
  cyan: "border-cyan/30 bg-cyan/10 text-cyan",
  primary: "border-primary/40 bg-primary/15 text-primary-hover",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  muted: "border-border bg-elevated text-muted-foreground",
};
export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center justify-self-start gap-1 whitespace-nowrap rounded-[4px] border px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.1em] uppercase",
        toneCls[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
export const riskTone = (r: Risk): Tone =>
  r === "SAFE" || r === "LOW"
    ? "success"
    : r === "MEDIUM"
      ? "warning"
      : r === "HIGH"
        ? "danger"
        : "cyan";
export function RiskBadge({ risk }: { risk: Risk }) {
  return <Badge tone={riskTone(risk)}>{risk === "LOW" ? "LOW RISK" : risk}</Badge>;
}
export function DemoBadge({ label = "DEMO" }: { label?: string | undefined }) {
  return <Badge tone="warning">{label}</Badge>;
}

/* ── Buttons (Theme/Buttons.xaml: Primary / Secondary / Ghost / Danger) ── */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
const btnCls: Record<BtnVariant, string> = {
  primary:
    "eo-brand eo-btn-primary text-primary-foreground border-transparent hover:brightness-110",
  secondary:
    "bg-elevated text-foreground border-border-strong hover:border-cyan/50 hover:bg-highlight",
  ghost:
    "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-border-strong",
  danger: "bg-destructive/10 text-destructive border-destructive/40 hover:bg-destructive/20",
  success: "bg-success/10 text-success border-success/40 hover:bg-success/20",
};
/**
 * `title` is the tooltip. The accessible name is the visible text; icon-only buttons
 * pass `label` (the browser also falls back to `title` when there is no text).
 */
export function Btn({
  variant = "secondary",
  children,
  onClick,
  className,
  size = "md",
  title,
  disabled,
  label,
  pressed,
  expanded,
  controls,
  loading,
}: {
  variant?: BtnVariant | undefined;
  children: ReactNode;
  onClick?: (() => void) | undefined;
  className?: string | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  title?: string | undefined;
  disabled?: boolean | undefined;
  label?: string | undefined;
  pressed?: boolean | undefined;
  expanded?: boolean | undefined;
  controls?: string | undefined;
  /** Shows a spinner, sets aria-busy and blocks clicks while a simulated action runs. */
  loading?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "eo-btn inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-bold tracking-[0.08em] uppercase active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
        size === "sm"
          ? "h-7 px-2.5 text-[10px]"
          : size === "lg"
            ? "h-9 px-4 text-[11px]"
            : "h-8 px-3 text-[10.5px]",
        btnCls[variant],
        className,
      )}
    >
      {loading && <Loader2 aria-hidden="true" className="eo-spin h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

/* ── Back link (secondary pages return to their parent, e.g. Auto Optimize → Dashboard) ── */
export function BackLink({
  label = "Back to Dashboard",
  onClick,
}: {
  label?: string | undefined;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="eo-back">
      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ── Page header (every View starts with Grid cols=*,Auto: title block + actions) ── */
export function PageHeader({
  title,
  sub,
  badges,
  actions,
  accent = "bg-cyan",
  back,
  guide,
}: {
  title: string;
  sub?: string | undefined;
  badges?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  accent?: string | undefined;
  /** Rendered before the title block — used by pages reached from another page. */
  back?: ReactNode | undefined;
  /** Contextual guide; defaults to the current registry page's guide. `null` hides it. */
  guide?: GuideId | null | undefined;
}) {
  const pageGuide = usePageGuide();
  const g = guide === undefined ? pageGuide : guide;
  const guideAction = g ? <PageGuide id={g} /> : null;
  return (
    <div className="eo-page-header flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {back}
        <span className={cn("eo-accent-bar h-7 w-1 shrink-0 rounded-full", accent)} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold uppercase">{title}</h1>
            {badges}
          </div>
          {sub && <p className="max-w-3xl text-muted-foreground">{sub}</p>}
        </div>
      </div>
      {(guideAction || actions) && (
        <div className="flex flex-wrap items-center gap-2">
          {guideAction}
          {actions}
        </div>
      )}
    </div>
  );
}

/* ── Page GUIDE button + dialog: one implementation for every page (V4 Maximum Performance style).
 * PageHeader renders it from the registry page's guide, so pages never add their own. ── */
export function PageGuide({ id }: { id: GuideId }) {
  const [open, setOpen] = useState(false);
  const g = stepGuide(id);
  return (
    <>
      <GuideButton topic={g.title} open={open} onClick={() => setOpen(true)} />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={g.title}
        sub={g.sub}
        width="max-w-2xl eo-guide-modal"
        footer={
          <Btn variant="primary" onClick={() => setOpen(false)}>
            Got it
          </Btn>
        }
      >
        <GuideSteps steps={g.steps} note={g.note} />
      </Modal>
    </>
  );
}

/* ── Metric strip: one panel divided into cells (replaces rows of separate stat cards) ── */
export function StatTiles({
  items,
}: {
  items: { label: string; value: ReactNode; sub?: string | undefined; tone?: Tone | undefined }[];
  /** Kept for call-site compatibility; the strip wraps by available width. */
  cols?: number | undefined;
}) {
  const tc: Record<Tone, string> = {
    cyan: "text-cyan",
    primary: "text-primary-hover",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    muted: "text-foreground",
  };
  return (
    <div className="eo-metrics">
      <dl className="eo-metrics-inner">
        {items.map((s) => (
          <div key={s.label} className="eo-metric" data-tone={s.tone ?? "muted"}>
            <dt className="eo-label text-[9.5px] text-muted-foreground">{s.label}</dt>
            <dd
              key={typeof s.value === "string" || typeof s.value === "number" ? s.value : undefined}
              className={cn("eo-stat-value tabular-nums", tc[s.tone ?? "muted"])}
            >
              {s.value}
            </dd>
            {s.sub && <dd className="eo-metric-sub">{s.sub}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── Filter chips (rows of RadioButton/Button filters) ── */
export function Chips({
  options,
  value,
  onChange,
  className,
  label,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string | undefined;
  label?: string | undefined;
}) {
  // Long quick-filter rows collapse into the shared premium dropdown.
  if (options.length > 5)
    return (
      <div className={cn("inline-flex min-w-[170px]", className)}>
        <PremiumSelect
          label={label ?? "Filter"}
          value={value}
          onChange={onChange}
          options={options}
        />
      </div>
    );
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "h-7 rounded-md border px-2.5 text-[10px] font-bold tracking-[0.08em] uppercase",
            value === o
              ? "border-cyan/50 bg-cyan/15 text-cyan shadow-[inset_0_1px_0_var(--surface-edge),0_0_14px_-6px_var(--cyan)]"
              : "border-border bg-window text-muted-foreground hover:border-border-strong hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="eo-search relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-subtle"
      />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onChange("");
          }
        }}
        placeholder={placeholder}
        className="h-8.5 w-full rounded-lg border border-border bg-window pl-9 pr-8 text-[13px] text-foreground placeholder:text-subtle outline-none hover:border-border-strong focus:border-cyan/60"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="eo-search-clear"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function Bar({
  value,
  tone = "cyan",
  className,
  active,
}: {
  value: number;
  tone?: Tone | undefined;
  className?: string | undefined;
  /** Moving sheen while a simulated run is in progress (static bars stay still). */
  active?: boolean | undefined;
}) {
  const bg: Record<Tone, string> = {
    cyan: "bg-cyan",
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    muted: "bg-subtle",
  };
  return (
    <div
      role="progressbar"
      aria-label="Progress"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-window", className)}
    >
      <div
        data-active={active && value < 100 ? "true" : undefined}
        className={cn("eo-bar-fill h-full rounded-full", bg[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ── Toggle (PremiumToggle) & Check ── */
export function Toggle({
  on,
  onChange,
  label = "Toggle setting",
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="eo-switch relative h-5 w-9 shrink-0 rounded-full border"
    >
      <span
        aria-hidden="true"
        className="eo-toggle-thumb absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full"
      />
    </button>
  );
}
export function Check({
  on,
  onChange,
  label = "Select item",
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "eo-check flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border text-[10px] font-black",
        on
          ? "border-cyan bg-cyan text-sidebar-primary-foreground"
          : "border-border-strong bg-window",
      )}
    >
      {on && <CheckIcon aria-hidden="true" className="h-3 w-3" strokeWidth={3.5} />}
    </button>
  );
}

/* ── Selectable optimization row:
 * Interactive row. Supports both ALL ELIGIBLE and CUSTOM modes.
 * When locked (protected, unsupported, already applied), displays lock indicator and reason. */
export function CheckRow({
  on,
  onChange,
  title,
  desc,
  icon,
  right,
  locked,
  state,
  className,
}: {
  on: boolean;
  onChange?: ((v: boolean) => void) | undefined;
  title: ReactNode;
  desc?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  right?: ReactNode | undefined;
  /** Reason shown instead of a checkbox; the row cannot be selected. */
  locked?: string | undefined;
  state?: "active" | "done" | undefined;
  className?: string | undefined;
}) {
  const isExcluded = Boolean(locked);
  const reason = locked;

  return (
    <div
      className={cn(
        "eo-check-row",
        onChange && !isExcluded ? "cursor-pointer select-none" : isExcluded ? "cursor-not-allowed opacity-75" : "",
        className,
      )}
      data-locked={isExcluded ? "true" : undefined}
      data-on={on && !isExcluded ? "true" : undefined}
      data-state={state}
      title={reason}
      onClick={() => {
        if (!isExcluded && onChange) onChange(!on);
      }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "eo-check flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
          isExcluded
            ? "border-border bg-window text-subtle"
            : on
              ? "border-cyan bg-cyan text-sidebar-primary-foreground shadow-sm"
              : "border-border-strong bg-window text-subtle",
        )}
      >
        {isExcluded ? (
          <Lock className="h-2.5 w-2.5" />
        ) : (
          on && <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
        )}
      </span>
      {icon && <span className="eo-row-icon">{icon}</span>}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[12.5px] font-semibold">{title}</span>
        {desc && (
          <span className="block line-clamp-2 text-[11px] text-muted-foreground">{desc}</span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {!isExcluded ? (
          on ? (
            <Badge tone="success" className="text-[9.5px] font-bold tracking-wider">
              AUTO-SELECTED — ELIGIBLE
            </Badge>
          ) : (
            <Badge tone="muted" className="text-[9.5px] font-semibold tracking-wider">
              NOT SELECTED
            </Badge>
          )
        ) : (
          <Badge tone="muted" className="text-[9.5px] font-semibold uppercase">
            {reason ?? "INELIGIBLE"}
          </Badge>
        )}
        {right}
      </span>
      {reason && <span className="sr-only">{reason}</span>}
    </div>
  );
}

/* ── Selection toolbar: Global ALL ELIGIBLE (Default) + CUSTOM Selection System ── */
export function SelectionBar({
  count,
  total,
  onAll: _onAll,
  onClear: _onClear,
  allLabel: _allLabel,
  moded,
  autoLabel: _autoLabel,
  title,
}: {
  count: number;
  total?: number | undefined;
  onAll?: (() => void) | undefined;
  onClear?: (() => void) | undefined;
  allLabel?: string | undefined;
  moded?: ModedSelection<string> | ModedSelection<number> | undefined;
  autoLabel?: string | undefined;
  title?: string | undefined;
}) {
  const isCustom = moded?.mode === "CUSTOM";
  const highRiskSelected = moded?.highRiskSelectedCount ?? 0;
  const skipped = moded
    ? moded.plan.excluded.filter((e) => e.reason !== "Not selected").length
    : 0;

  return (
    <div className="eo-sel-bar flex flex-wrap items-center justify-between gap-2.5 py-1">
      {/* Mode Switcher Segmented Control */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-window/80 p-0.5 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => moded?.setMode("ALL_ELIGIBLE")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all",
              !isCustom
                ? "bg-cyan/15 text-cyan border border-cyan/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-window/50",
            )}
          >
            <CheckIcon className="h-3 w-3 text-success" />
            ALL ELIGIBLE (Default)
          </button>
          <button
            type="button"
            onClick={() => {
              moded?.setMode("CUSTOM");
              moded?.openCustomModal();
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all",
              isCustom
                ? "bg-cyan/15 text-cyan border border-cyan/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-window/50",
            )}
          >
            <Sliders className="h-3 w-3" />
            CUSTOM
          </button>
        </div>

        {/* Selected count info */}
        <span aria-live="polite" className="text-[11.5px] font-medium text-muted-foreground">
          <b className="text-foreground tabular-nums font-bold">{count}</b>{" "}
          {!isCustom ? "eligible auto-selected" : "custom selected"}
          {total !== undefined && ` of ${total}`}
          {skipped > 0 && (
            <span
              className="text-subtle ml-1.5"
              title={moded?.plan.excluded
                .filter((e) => e.reason !== "Not selected")
                .map((e) => `${String(e.id)}: ${e.reason}`)
                .join("\n")}
            >
              · {skipped} excluded
            </span>
          )}
        </span>
      </div>

      {/* Right side status badge and customize button */}
      <div className="flex items-center gap-2">
        {highRiskSelected > 0 && (
          <Badge tone="warning" className="text-[9.5px] font-bold tracking-wide">
            INCLUDES {highRiskSelected} HIGH-RISK
          </Badge>
        )}

        {!isCustom ? (
          <Badge tone="success" className="text-[10px] font-semibold tracking-wide">
            AUTO-SELECTED — ELIGIBLE
          </Badge>
        ) : (
          <Badge tone="cyan" className="text-[10px] font-semibold tracking-wide">
            USER DEFINED
          </Badge>
        )}

        {moded && (
          <Btn
            size="sm"
            variant={isCustom ? "primary" : "ghost"}
            onClick={moded.openCustomModal}
            className="h-7 text-[11px] font-medium gap-1"
          >
            <Sliders className="h-3 w-3" />
            Customize…
          </Btn>
        )}
      </div>

      {/* Embedded Reusable Custom Selection Modal */}
      {moded && (
        <CustomSelectionModal
          open={moded.customModalOpen}
          onClose={moded.closeCustomModal}
          title={title ?? "Optimization"}
          items={moded.items as any}
          selected={moded.sel as any}
          onConfirm={moded.confirmCustom as any}
        />
      )}
    </div>
  );
}

/* ── Key / value row ── */
export function KV({
  k,
  v,
  mono,
}: {
  k: string | undefined;
  v: ReactNode;
  mono?: boolean | undefined;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 text-[12.5px] last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("text-right font-semibold", mono && "font-mono text-[11.5px]")}>{v}</span>
    </div>
  );
}

/* ── DETAILS expander: hides raw technical inventories (build report §1 rule) ── */
export function Details({
  title = "ADVANCED DETAILS",
  children,
  inline,
  hint,
  defaultOpen = false,
}: {
  title?: string | undefined;
  children: ReactNode;
  /** Renders inside an existing panel (no own card surface). */
  inline?: boolean | undefined;
  /** Short text shown beside the title while collapsed. */
  hint?: string | undefined;
  defaultOpen?: boolean | undefined;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className={cn(inline ? "eo-disclosure" : "eo-card overflow-hidden")} data-open={open}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cn(
          "eo-disclosure-btn flex w-full items-center justify-between gap-3 text-left",
          inline ? "py-2.5" : "px-4 py-3 hover:bg-highlight/40",
        )}
      >
        <span className="eo-label text-muted-foreground">{title}</span>
        <span className="flex min-w-0 items-center gap-2">
          {hint && !open && (
            <span className="truncate text-[11px] font-semibold text-subtle">{hint}</span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "eo-chevron h-4 w-4 shrink-0 text-muted-foreground",
              open && "rotate-180 text-cyan",
            )}
          />
        </span>
      </button>
      <div id={panelId} className="eo-expand" data-open={open} inert={!open}>
        <div>
          <div className={cn(inline ? "pb-1" : "border-t border-border px-4 py-3.5")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal overlay (WPF Popup/Grid overlays) ── */
export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  width = "max-w-2xl",
  icon,
  tone = "cyan",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
  width?: string | undefined;
  /** Small glyph shown in a tinted tile beside the title. */
  icon?: ReactNode | undefined;
  tone?: "cyan" | "success" | "warning" | "danger" | undefined;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  const subId = useId();
  const [visible, setVisible] = useState(open);
  useEffect(() => {
    if (open) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!open || !visible) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const elements = () =>
      Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    elements()[0]?.focus();
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key !== "Tab") return;
      const targets = elements(),
        first = targets[0],
        last = targets.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      previous?.focus();
    };
  }, [open, visible]);
  if (!visible || typeof document === "undefined") return null;
  // Portal to <body>: cards use transform / backdrop-filter, which would otherwise trap a
  // position:fixed overlay inside the card.
  return createPortal(
    <div
      className={cn(
        "eo-overlay fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-6 backdrop-blur-sm",
        !open && "eo-dismiss",
      )}
      onClick={onClose}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={sub ? subId : undefined}
        className={cn("eo-card eo-modal flex max-h-[86vh] w-full flex-col p-0", width)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="eo-modal-head flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <span aria-hidden="true" className="eo-modal-icon" data-tone={tone}>
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="text-[15px] font-bold uppercase">
                {title}
              </h2>
              {sub && (
                <p id={subId} className="mt-0.5 text-xs text-muted-foreground">
                  {sub}
                </p>
              )}
            </div>
          </div>
          <Btn
            onClick={onClose}
            size="sm"
            variant="ghost"
            title="Close dialog (Esc)"
            label="Close dialog"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Btn>
        </div>
        <div className="eo-scroll-fade min-h-0 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-window/40 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Simulation helpers ── */
export function SimNotice({ children }: { children?: ReactNode | undefined }) {
  return (
    <div
      role="note"
      className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-[11.5px] text-warning"
    >
      <FlaskConical aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span>
        {children ??
          "PROTOTYPE NOTICE: Demonstration data only. No Windows registry, service, file or driver is read or changed."}
      </span>
    </div>
  );
}

export function simulate(label: string | undefined) {
  toast(`${label} — simulated`, {
    description: "Prototype only. No real system changes were made.",
  });
}

export function useSimRun(durationMs = 2200) {
  const [progress, setProgress] = useState<number | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = () => {
    if (interval.current) clearInterval(interval.current);
    if (delay.current) clearTimeout(delay.current);
    interval.current = null;
    delay.current = null;
    setProgress(null);
  };
  useEffect(
    () => () => {
      if (interval.current) clearInterval(interval.current);
      if (delay.current) clearTimeout(delay.current);
    },
    [],
  );
  const start = (onDone?: () => void) => {
    if (interval.current || delay.current) return;
    setProgress(0);
    const t0 = Date.now();
    interval.current = setInterval(() => {
      const p = Math.min(100, ((Date.now() - t0) / durationMs) * 100);
      setProgress(p);
      if (p >= 100) {
        if (interval.current) clearInterval(interval.current);
        interval.current = null;
        delay.current = setTimeout(() => {
          delay.current = null;
          setProgress(null);
          onDone?.();
        }, 200);
      }
    }, 80);
  };
  return { progress, running: progress !== null, start, cancel };
}

/* ── Stepper (workflow progress: done / current / upcoming) ── */
export function Stepper({
  steps,
  current,
  label = "Workflow progress",
}: {
  steps: string[];
  current: number;
  label?: string | undefined;
}) {
  return (
    <ol aria-label={label} className="eo-stepper flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <li
            key={s}
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
            className="eo-step flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase"
          >
            <span className="eo-step-dot flex h-4 w-4 items-center justify-center rounded-full text-[9px]">
              {state === "done" ? (
                <CheckIcon aria-hidden="true" className="h-2.5 w-2.5" strokeWidth={4} />
              ) : (
                i + 1
              )}
            </span>
            {s}
            {state === "done" && <span className="sr-only">(completed)</span>}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Loading state (skeleton rows with a live status message) ── */
export function LoadingState({
  label,
  rows = 3,
  progress,
}: {
  label: string;
  rows?: number | undefined;
  progress?: number | null | undefined;
}) {
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase text-cyan">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="eo-pulse-dot h-1.5 w-1.5 rounded-full bg-cyan" />
          {label}
        </span>
        {progress != null && <span className="font-mono">{Math.round(progress)}%</span>}
      </div>
      {progress != null && <Bar value={progress} active />}
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="eo-skeleton h-12 rounded-lg border border-border"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="eo-empty flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong px-6 py-10 text-center">
      <div className="eo-label text-foreground">{title}</div>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{sub}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* Grid with explicit fractional columns, mirroring WPF ColumnDefinitions */
export function Cols({
  cols,
  gap = 12,
  children,
  className,
}: {
  cols: string;
  gap?: number | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("grid", className)} style={{ gridTemplateColumns: cols, gap }}>
      {children}
    </div>
  );
}

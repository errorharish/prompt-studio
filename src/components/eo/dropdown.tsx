// Shared premium dropdowns (PremiumSelect, PremiumMultiSelect). Every page uses these instead
// of native <select>. Panels portal to document.body so cards / scroll areas never clip them.
// Visual rules: .eo-dd* in src/styles.css.
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption<T extends string> {
  value: T;
  label?: ReactNode;
  hint?: string | undefined;
}
type Opt<T extends string> = T | DropdownOption<T>;
const norm = <T extends string>(o: Opt<T>): DropdownOption<T> =>
  typeof o === "string" ? { value: o } : o;

/** Floating-panel placement: below the trigger, flipped above near the bottom edge, clamped. */
function usePanel(open: boolean, close: () => void) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean } | null>(
    null,
  );
  const place = useCallback(() => {
    const t = trigger.current?.getBoundingClientRect();
    if (!t) return;
    const ph = panel.current?.offsetHeight ?? 240;
    const width = Math.max(t.width, 180);
    const up = t.bottom + ph + 8 > window.innerHeight && t.top - ph - 8 > 0;
    const left = Math.min(Math.max(8, t.left), window.innerWidth - width - 8);
    setPos({ top: up ? t.top - ph - 6 : t.bottom + 6, left, width, up });
  }, []);
  useLayoutEffect(() => {
    if (open) place();
    else setPos(null);
  }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!panel.current?.contains(n) && !trigger.current?.contains(n)) close();
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, close, place]);
  return { trigger, panel, pos, place };
}

function Panel({
  pos,
  panelRef,
  children,
  id,
  role,
  label,
  multi,
  onKeyDown,
}: {
  pos: { top: number; left: number; width: number; up: boolean } | null;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
  id: string;
  role: string;
  label: string;
  multi?: boolean | undefined;
  onKeyDown?: ((e: KeyboardEvent) => void) | undefined;
}) {
  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role={role}
      aria-label={label}
      aria-multiselectable={multi || undefined}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      data-up={pos?.up ? "true" : undefined}
      className="eo-dd-panel"
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        minWidth: pos?.width,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function PremiumSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  disabled,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly Opt<T>[];
  label: string;
  className?: string | undefined;
  disabled?: boolean | undefined;
  size?: "sm" | "md" | undefined;
}) {
  const opts = options.map(norm);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const { trigger, panel, pos } = usePanel(open, close);
  const id = useId();
  const current = opts.find((o) => o.value === value);

  const openAt = () => {
    setActive(
      Math.max(
        0,
        opts.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };
  useEffect(() => {
    if (open)
      panel.current
        ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active, panel]);

  const pick = (v: T) => {
    onChange(v);
    setOpen(false);
    trigger.current?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => Math.min(opts.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(opts.length - 1);
    else if (e.key === "Enter" || e.key === " ") {
      const o = opts[active];
      if (o) pick(o.value);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") trigger.current?.focus();
      if (e.key === "Tab") return;
    } else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        data-size={size}
        data-open={open ? "true" : undefined}
        onClick={() => (open ? setOpen(false) : openAt())}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onKeyDown={(e) => {
          if (open) return onKey(e);
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openAt();
          }
        }}
        className={cn("eo-dd-trigger", className)}
      >
        <span className="truncate">{current?.label ?? current?.value ?? value}</span>
        <ChevronDown aria-hidden="true" className="eo-dd-chevron" />
      </button>
      {open && (
        <Panel pos={pos} panelRef={panel} id={id} role="listbox" label={label} onKeyDown={onKey}>
          {opts.map((o, i) => (
            <div
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              data-idx={i}
              data-active={i === active ? "true" : undefined}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(o.value)}
              className="eo-dd-option"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{o.label ?? o.value}</span>
                {o.hint && <span className="eo-dd-hint">{o.hint}</span>}
              </span>
              <Check aria-hidden="true" className="eo-dd-check" />
            </div>
          ))}
        </Panel>
      )}
    </>
  );
}

/** Staged multi-select: changes apply on Apply, Cancel / Esc / outside click discards.
 *  An empty selection means "All". */
export function PremiumMultiSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  allLabel = "All",
  className,
}: {
  value: ReadonlySet<T>;
  onChange: (v: Set<T>) => void;
  options: readonly Opt<T>[];
  label: string;
  allLabel?: string | undefined;
  className?: string | undefined;
}) {
  const opts = options.map(norm);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<T>>(new Set(value));
  const [active, setActive] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const { trigger, panel, pos } = usePanel(open, close);
  const id = useId();
  useEffect(() => {
    if (open) panel.current?.focus({ preventScroll: true });
  }, [open, panel]);

  const toggle = (v: T) =>
    setDraft((d) => {
      const n = new Set(d);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });
  const apply = () => {
    onChange(draft.size === opts.length ? new Set() : new Set(draft));
    setOpen(false);
    trigger.current?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLButtonElement) {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
      return;
    }
    if (e.key === "ArrowDown") setActive((a) => Math.min(opts.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === " ") {
      const o = opts[active];
      if (o) toggle(o.value);
    } else if (e.key === "Enter") apply();
    else if (e.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
    } else return;
    e.preventDefault();
    e.stopPropagation();
  };
  const summary =
    value.size === 0
      ? allLabel
      : value.size === 1
        ? String(opts.find((o) => value.has(o.value))?.value ?? "")
        : `${value.size} selected`;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={`${label}: ${summary}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-open={open ? "true" : undefined}
        onClick={() => {
          if (open) return setOpen(false);
          setDraft(new Set(value));
          setActive(0);
          setOpen(true);
        }}
        className={cn("eo-dd-trigger", className)}
      >
        <span className="truncate">{summary}</span>
        {value.size > 0 && <span className="eo-dd-count tabular-nums">{value.size}</span>}
        <ChevronDown aria-hidden="true" className="eo-dd-chevron" />
      </button>
      {open && (
        <Panel
          pos={pos}
          panelRef={panel}
          id={id}
          role="listbox"
          label={label}
          multi
          onKeyDown={onKey}
        >
          <div className="eo-dd-head">
            <span className="tabular-nums">
              {draft.size === 0 ? "No filter · showing all" : `${draft.size} of ${opts.length}`}
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                className="eo-dd-link"
                onClick={() => setDraft(new Set(opts.map((o) => o.value)))}
              >
                Select all
              </button>
              <button type="button" className="eo-dd-link" onClick={() => setDraft(new Set())}>
                Clear
              </button>
            </span>
          </div>
          <div className="eo-dd-list">
            {opts.map((o, i) => (
              <div
                key={o.value}
                role="option"
                aria-selected={draft.has(o.value)}
                data-idx={i}
                data-active={i === active ? "true" : undefined}
                onPointerEnter={() => setActive(i)}
                onClick={() => toggle(o.value)}
                className="eo-dd-option"
              >
                <span aria-hidden="true" className="eo-dd-box">
                  <Check />
                </span>
                <span className="min-w-0 flex-1 truncate">{o.label ?? o.value}</span>
              </div>
            ))}
          </div>
          <div className="eo-dd-foot">
            <button
              type="button"
              className="eo-dd-btn"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              Cancel
            </button>
            <button type="button" className="eo-dd-btn" data-primary="true" onClick={apply}>
              Apply
            </button>
          </div>
        </Panel>
      )}
    </>
  );
}

/** Removable active-filter chip. */
export function FilterChip({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <span className="eo-dd-chip">
      {children}
      <button type="button" aria-label={`Remove filter ${String(children)}`} onClick={onRemove}>
        ×
      </button>
    </span>
  );
}

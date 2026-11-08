import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { BookOpen, ChevronDown, CircleHelp, FlaskConical, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGuide, RISK_LABEL, type GuideId, type GuideStep } from "@/lib/eo/guides";

/* ── Contextual guide popover ──
 * One help icon + popover used everywhere a setting or optimization needs explaining.
 * Portals to <body> (cards use transform/backdrop-filter, which would trap a fixed element),
 * opens on click, closes on Escape / outside click / focus leaving, and only one is open at a time. */

let closeOpen: (() => void) | null = null;

const POP_W = 328;
const GAP = 8;

export function GuideTip({
  id,
  className,
  size = "sm",
}: {
  id: GuideId;
  className?: string | undefined;
  size?: "sm" | "md" | undefined;
}) {
  const g = getGuide(id);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const moreId = useId();

  const close = useCallback((refocus = false) => {
    setOpen(false);
    setMore(false);
    if (refocus) btn.current?.focus();
  }, []);

  const place = useCallback(() => {
    const a = btn.current?.getBoundingClientRect();
    if (!a) return;
    const h = pop.current?.offsetHeight ?? 320;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const width = Math.min(POP_W, vw - 16);
    const left = Math.max(8, Math.min(a.left + a.width / 2 - width / 2, vw - width - 8));
    const below = a.bottom + GAP;
    const above = below + h > vh - 8 && a.top - GAP - h > 8;
    setPos({
      top: above ? a.top - GAP - h : Math.min(below, Math.max(8, vh - h - 8)),
      left,
      above,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, more, place]);

  useEffect(() => {
    if (!open) return;
    if (closeOpen && closeOpen !== close) closeOpen();
    closeOpen = close;
    pop.current?.focus({ preventScroll: true });
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!pop.current?.contains(t) && !btn.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      if (closeOpen === close) closeOpen = null;
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, close, place]);

  const warn = g.risk === "medium" || g.risk === "high";
  const facts: [string, string][] = [
    ["When to use", g.when],
    ["Expected benefit", g.benefit],
    ...(g.restart ? ([["Restart", g.restart]] as [string, string][]) : []),
    ...(g.reversible ? ([["Reversible", g.reversible]] as [string, string][]) : []),
  ];

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={cn("eo-guide-tip", size === "md" && "eo-guide-tip-md", className)}
        aria-label={`About ${g.title}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`About ${g.title}`}
        data-open={open}
        onClick={(e) => {
          e.stopPropagation();
          if (open) close();
          else setOpen(true);
        }}
      >
        <CircleHelp aria-hidden="true" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={pop}
            role="dialog"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="eo-guide-pop eo-scroll-fade"
            data-above={pos?.above || undefined}
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: Math.min(
                POP_W,
                typeof window === "undefined" ? POP_W : window.innerWidth - 16,
              ),
            }}
            // React events bubble through portals: keep clicks/keys from reaching parent rows.
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const next = e.relatedTarget as Node | null;
              if (next && !pop.current?.contains(next) && !btn.current?.contains(next)) close();
            }}
          >
            <div className="eo-guide-head">
              <span aria-hidden="true" className="eo-guide-icon">
                <CircleHelp />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="eo-guide-title">
                  {g.title}
                </h2>
                <span className="eo-guide-risk" data-risk={g.risk}>
                  {RISK_LABEL[g.risk]}
                </span>
              </div>
              <button
                type="button"
                className="eo-guide-close"
                aria-label="Close guide"
                title="Close (Esc)"
                onClick={() => close(true)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <p className="eo-guide-what">{g.what}</p>
            <p className="eo-guide-why">{g.why}</p>
            <dl className="eo-guide-facts">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="eo-guide-limits" data-warn={warn || undefined}>
              <ShieldAlert aria-hidden="true" />
              <span>{g.limits}</span>
            </p>
            <button
              type="button"
              className="eo-guide-more"
              aria-expanded={more}
              aria-controls={moreId}
              onClick={() => setMore(!more)}
            >
              How it works
              <ChevronDown aria-hidden="true" data-open={more} />
            </button>
            <div id={moreId} className="eo-expand" data-open={more} inert={!more}>
              <div>
                <div className="eo-guide-how">
                  <p>{g.how}</p>
                  {g.details && (
                    <ul>
                      {g.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <p className="eo-guide-foot">
              <FlaskConical aria-hidden="true" />
              Simulated in this prototype · 0 changes on this PC
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ── Page guide context: $page provides the registry page's guide, PageHeader shows it ── */
export const PageGuideContext = createContext<GuideId | null>(null);
export const usePageGuide = () => useContext(PageGuideContext);

/* ── Page GUIDE button + numbered sections (the V4 Maximum Performance guide is the reference).
 * Rendered only through PageGuide in kit.tsx so every page uses the same dialog. ── */
export function GuideButton({
  onClick,
  open = false,
  topic,
}: {
  onClick: () => void;
  open?: boolean;
  /** Guide title, used for the accessible label. */
  topic: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="eo-guide-btn eo-btn"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`Open guide: ${topic}`}
      title={`Open guide: ${topic}`}
    >
      <BookOpen aria-hidden="true" />
      Guide
    </button>
  );
}

export function GuideSteps({ steps, note }: { steps: readonly GuideStep[]; note?: ReactNode }) {
  return (
    <>
      <ol className="eo-guide-steps">
        {steps.map((s, i) => (
          <li key={s.title} style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
            <span aria-hidden="true" className="eo-guide-num">
              {i + 1}
            </span>
            <div className="min-w-0">
              <h3 className="eo-guide-step-title">
                {s.title}
                {s.tag && <span className="eo-guide-step-tag">{s.tag}</span>}
              </h3>
              <p>{s.text}</p>
              {s.points && (
                <ul className="eo-guide-points">
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
      {note && <p className="eo-guide-note">{note}</p>}
      <p className="eo-guide-foot">
        <FlaskConical aria-hidden="true" />
        Simulated in this prototype · 0 changes on this PC
      </p>
    </>
  );
}

// Premium controls shared by the Dashboard, System Telemetry, AI Optimization and V4 pages.
// Visual rules live in src/styles.css (.eo-seg, .eo-range, .eo-score, .eo-number).
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { clampStep, fraction } from "@/lib/eo/slider";

/* ── Segmented control: one sliding indicator behind aria-pressed options ──
 * WPF: RadioButton row (ToggleButton style) with a single Border animated via TranslateTransform. */
export function Segmented({
  options,
  value,
  onChange,
  label,
  className,
  fill,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
  className?: string | undefined;
  /** Stretch options to fill the available width. */
  fill?: boolean | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const measure = useCallback(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    setBox(
      el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null,
    );
  }, []);
  useLayoutEffect(measure, [value, options.length, measure]);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [measure]);
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      data-ready={box ? "true" : undefined}
      className={cn("eo-seg", fill ? "flex w-full" : "inline-flex", className)}
    >
      {box && (
        <span
          aria-hidden="true"
          className="eo-seg-indicator"
          style={{
            transform: `translate(${box.x}px, ${box.y}px)`,
            width: box.w,
            height: box.h,
          }}
        />
      )}
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn("eo-seg-item", fill && "flex-1")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ── Range slider: native input (keyboard, touch, screen readers) with a custom track ──
 * Fill and marks use the same thumb-travel maths, so the fill always ends under the thumb. */
export interface SliderMark {
  value: number;
  label: string;
  tone?: "cyan" | "success" | undefined;
}
export function RangeSlider({
  value,
  onChange,
  min,
  max,
  step,
  label,
  valueText,
  marks,
  id,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  valueText?: string | undefined;
  marks?: SliderMark[] | undefined;
  id?: string | undefined;
  className?: string | undefined;
}) {
  const p = fraction(value, min, max);
  return (
    <div
      className={cn("eo-range-wrap", marks?.length && "eo-range-wrap-marks", className)}
      style={{ "--p": p.toFixed(4) } as CSSProperties}
    >
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(e) => onChange(clampStep(+e.target.value, min, max, step))}
        className="eo-range"
      />
      {marks && (
        <div aria-hidden="true" className="eo-range-marks">
          {marks.map((m) => {
            const f = fraction(m.value, min, max);
            return (
              <span
                key={m.label}
                data-tone={m.tone}
                data-align={f < 0.06 ? "start" : f > 0.94 ? "end" : "center"}
                data-active={value === m.value ? "true" : undefined}
                style={{ "--m": f.toFixed(4) } as CSSProperties}
              >
                <i />
                {m.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Numeric field synchronised with a slider ──
 * Valid in-range typing updates the value live; blur / Enter clamps and snaps; Esc reverts;
 * ArrowUp / ArrowDown step by `step`. */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  unit,
  label,
  decimals = 2,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  label: string;
  decimals?: number | undefined;
  id?: string | undefined;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const fmt = useCallback((v: number) => v.toFixed(decimals), [decimals]);
  // While focused the field shows the typed draft; otherwise it always renders the live value,
  // so it can never lag behind the slider.
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);
  const atFocus = useRef(value);
  const commit = (text: string | null) => {
    if (text === null) return;
    const n = parseFloat(text.replace(",", "."));
    onChange(Number.isFinite(n) ? clampStep(n, min, max, step) : value);
    setDraft(null);
  };
  return (
    <div className="eo-number">
      <input
        id={inputId}
        inputMode="decimal"
        aria-label={label}
        value={draft ?? fmt(value)}
        onFocus={(e) => {
          atFocus.current = value;
          setDraft(fmt(value));
          e.currentTarget.select();
        }}
        onBlur={() => {
          if (cancelled.current) cancelled.current = false;
          else commit(draft);
          setDraft(null);
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parseFloat(e.target.value.replace(",", "."));
          if (Number.isFinite(n) && n >= min && n <= max) onChange(clampStep(n, min, max, step));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(draft);
            setDraft(null);
          }
          if (e.key === "Escape") {
            cancelled.current = true;
            onChange(atFocus.current);
            setDraft(null);
            e.currentTarget.blur();
          }
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const v = clampStep(value + (e.key === "ArrowUp" ? step : -step), min, max, step);
            onChange(v);
            setDraft(fmt(v));
          }
        }}
      />
      <span aria-hidden="true" className="eo-number-unit">
        {unit}
      </span>
    </div>
  );
}

/* ── Radial score gauge: gradient arc, tick ring and CSS-driven fill (no JS animation loop) ── */
export function ScoreRing({
  value,
  label,
  size = 152,
  stroke = 11,
  children,
}: {
  value: number;
  label: string;
  size?: number | undefined;
  stroke?: number | undefined;
  children?: ReactNode | undefined;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = size / 2;
  const r = c - stroke / 2 - 9;
  const len = 2 * Math.PI * r;
  const off = len * (1 - Math.min(100, Math.max(0, value)) / 100);
  const ticks = 48;
  return (
    <div role="img" aria-label={label} className="eo-score" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="absolute inset-0">
        <defs>
          <linearGradient id={`${gid}-arc`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks }, (_, i) => {
          const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
          const r1 = c - 3;
          const r2 = c - (i % 4 === 0 ? 7 : 5);
          return (
            <line
              key={i}
              x1={(c + Math.cos(a) * r1).toFixed(2)}
              y1={(c + Math.sin(a) * r1).toFixed(2)}
              x2={(c + Math.cos(a) * r2).toFixed(2)}
              y2={(c + Math.sin(a) * r2).toFixed(2)}
              className="eo-score-tick"
              data-lit={i / ticks < value / 100 ? "true" : undefined}
              style={{ "--i": i } as CSSProperties}
            />
          );
        })}
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} className="eo-score-track" />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={`url(#${gid}-arc)`}
          strokeLinecap="round"
          strokeDasharray={len.toFixed(2)}
          strokeDashoffset={off.toFixed(2)}
          transform={`rotate(-90 ${c} ${c})`}
          className="eo-score-arc"
          style={{ "--len": len.toFixed(2) } as CSSProperties}
        />
      </svg>
      <div className="eo-score-center">{children}</div>
    </div>
  );
}

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: (val: number) => string;
  className?: string | undefined;
  initialAnimate?: boolean;
}

/**
 * Global high-performance number animation component.
 * Provides smooth count-up / count-down transitions using requestAnimationFrame and ease-emphasized curve.
 * Avoids layout shifts, unnecessary re-renders, and supports integers, decimals, and custom units.
 */
export function AnimatedNumber({
  value,
  duration = 750,
  decimals = 0,
  prefix = "",
  suffix = "",
  format,
  className,
  initialAnimate = true,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(() => (initialAnimate ? 0 : value));
  const prevValRef = useRef<number>(initialAnimate ? 0 : value);
  const targetValRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // If target value hasn't changed from last recorded target, skip restart
    if (targetValRef.current === value && prevValRef.current === value) {
      return;
    }

    const startVal = prevValRef.current;
    const endVal = value;
    targetValRef.current = value;

    if (startVal === endVal) {
      setDisplay(endVal);
      return;
    }

    // Check reduced motion preference
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(endVal);
      prevValRef.current = endVal;
      return;
    }

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / Math.max(1, duration));
      // Ease emphasized curve: 1 - (1 - progress)^4
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = startVal + (endVal - startVal) * eased;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(endVal);
        prevValRef.current = endVal;
        rafRef.current = null;
      }
    };

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, duration]);

  const formatted = useMemo(() => {
    if (format) return format(display);
    const fixed = display.toFixed(decimals);
    return `${prefix}${fixed}${suffix}`;
  }, [display, decimals, prefix, suffix, format]);

  return (
    <span
      aria-hidden="true"
      className={cn("tabular-nums inline-block transition-colors", className)}
    >
      {formatted}
    </span>
  );
}

/** Integer score count-up using smooth RAF animation (duration=900ms, ease-emphasized). */
export function CountUp({
  value,
  className,
  duration = 900,
}: {
  value: number;
  className?: string | undefined;
  duration?: number | undefined;
}) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      decimals={0}
      className={className}
      initialAnimate={true}
    />
  );
}

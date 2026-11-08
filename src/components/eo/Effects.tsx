// Decorative effects layer: theme/effect attributes on <html>, ambient particles behind the
// pages, the optional cursor trail above them, and click ripples on buttons.
// One shared requestAnimationFrame loop; it stops when nothing is visible, the tab is hidden,
// or motion is reduced. Canvases never take pointer events, and the OS cursor is never hidden.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEffectsSettings } from "./effectsStore";
import {
  MAX_CURSOR_PARTICLES,
  THEMES,
  ambientCount,
  cursorActive,
  cursorBudget,
  type AmbientStyle,
  type CursorEffect,
  type EffectsSettings,
} from "@/lib/eo/effects";

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  hue: number; // 0 = accent a, 1 = accent b, 2 = effect color
  seed: number;
}

const EFFECT_COLOR: Partial<Record<CursorEffect, string>> = {
  flame: "oklch(0.72 0.2 45)",
  water: "oklch(0.78 0.12 215)",
  mist: "oklch(0.9 0.02 240)",
  shadow: "oklch(0.18 0.03 280)",
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setReduced(root.dataset["motion"] === "reduced");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-motion"] });
    return () => mo.disconnect();
  }, []);
  return reduced;
}

function applyAttrs(s: EffectsSettings, page: string) {
  const d = document.documentElement.dataset;
  d["fxTheme"] = s.theme;
  d["fxBg"] = s.background ? "on" : "off";
  d["fxRipple"] = s.ripple ? "on" : "off";
  d["fxButtons"] = s.buttonAnim ? "on" : "off";
  d["fxCards"] = s.cardHover ? "on" : "off";
  d["fxIcons"] = s.iconAnim ? "on" : "off";
  d["fxPage"] = s.pageTransitions ? "on" : "off";
  d["fxModal"] = s.modalTransitions ? "on" : "off";
  d["fxSections"] = s.sectionAnim ? "on" : "off";
  d["fxSidebar"] = s.sidebarAnim ? "on" : "off";
  d["fxFocus"] = page === "dashboard" || page === "v4-dashboard" ? "dashboard" : "page";
  const st = document.documentElement.style;
  st.setProperty("--fx-bg", (s.bgIntensity / 100).toFixed(2));
  st.setProperty("--fx-glow", (s.glowIntensity / 100).toFixed(2));
  const t = THEMES[s.theme];
  if (t.a && t.b) {
    st.setProperty("--fx-a", t.a);
    st.setProperty("--fx-b", t.b);
  } else {
    st.removeProperty("--fx-a");
    st.removeProperty("--fx-b");
  }
}

function spawnAmbient(style: AmbientStyle, w: number, h: number, anywhere: boolean): P {
  const rise = style === "embers" || style === "bubbles";
  return {
    x: Math.random() * w,
    y: rise && !anywhere ? h + 10 : Math.random() * h,
    vx: (Math.random() - 0.5) * (style === "fog" ? 0.15 : 0.25),
    vy: rise ? -(0.2 + Math.random() * 0.45) : (Math.random() - 0.5) * 0.15,
    life: anywhere ? Math.random() * 600 : 0,
    max: 500 + Math.random() * 500,
    size: style === "fog" ? 60 + Math.random() * 90 : 0.8 + Math.random() * 1.8,
    hue: Math.random() < 0.6 ? 0 : 1,
    seed: Math.random() * Math.PI * 2,
  };
}

export function EffectsLayer({ page }: { page: string }) {
  const s = useEffectsSettings();
  const reduced = useReducedMotion();
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => applyAttrs(s, page), [s, page]);

  // Click ripple on interactive buttons only (never on disabled controls).
  useEffect(() => {
    if (!s.ripple || reduced) return;
    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(".eo-btn, [data-ripple]");
      if (!el || el.matches(":disabled, [aria-disabled='true']")) return;
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 1.6;
      const dot = document.createElement("span");
      dot.className = "eo-ripple";
      dot.setAttribute("aria-hidden", "true");
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      el.appendChild(dot);
      const done = () => dot.remove();
      dot.addEventListener("animationend", done, { once: true });
      window.setTimeout(done, 900);
    };
    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", onDown, { capture: true });
  }, [s.ripple, reduced]);

  // Shared animation loop for ambient particles and the cursor trail.
  useEffect(() => {
    const bg = bgRef.current;
    const fg = fgRef.current;
    if (!bg || !fg) return;
    const bctx = bg.getContext("2d");
    const fctx = fg.getContext("2d");
    if (!bctx || !fctx) return;
    const nAmbient = ambientCount(s, reduced);
    const cursorOn = cursorActive(s, reduced);
    const style = THEMES[s.theme].ambient;
    const budget = cursorBudget(s);
    const css = getComputedStyle(document.documentElement);
    const colA = css.getPropertyValue("--cyan").trim() || "oklch(0.75 0.15 230)";
    const colB = css.getPropertyValue("--fx-b").trim() || css.getPropertyValue("--primary").trim();
    const effColor = EFFECT_COLOR[s.cursorEffect] ?? colA;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      for (const c of [bg, fg]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    bctx.clearRect(0, 0, w, h);
    fctx.clearRect(0, 0, w, h);
    if (!nAmbient && !cursorOn) return;

    const ambient: P[] = Array.from({ length: nAmbient }, () => spawnAmbient(style, w, h, true));
    const trail: P[] = [];
    const ptr = { x: -999, y: -999, sx: -999, sy: -999, seen: false, moved: 0 };
    const pts: { x: number; y: number; t: number }[] = [];
    let raf = 0;
    let frame = 0;
    let running = false;

    const onMove = (e: PointerEvent) => {
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      if (!ptr.seen) {
        ptr.sx = ptr.x;
        ptr.sy = ptr.y;
        ptr.seen = true;
      }
      ptr.moved = frame;
      if (!cursorOn || s.cursorEffect === "glow") return start();
      pts.push({ x: ptr.x, y: ptr.y, t: frame });
      for (let i = 0; i < budget.perMove && trail.length < MAX_CURSOR_PARTICLES; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.2 + Math.random() * 0.8) * budget.speed;
        const eff = s.cursorEffect;
        trail.push({
          x: ptr.x + (Math.random() - 0.5) * 6,
          y: ptr.y + (Math.random() - 0.5) * 6,
          vx: Math.cos(a) * sp * (eff === "flame" ? 0.4 : 1),
          vy:
            eff === "flame"
              ? -sp * 1.2
              : eff === "mist" || eff === "shadow"
                ? -sp * 0.3
                : Math.sin(a) * sp,
          life: 0,
          max: budget.life * (eff === "mist" || eff === "shadow" ? 1.4 : 1),
          size:
            eff === "mist" || eff === "shadow"
              ? 10 + Math.random() * 14
              : eff === "water"
                ? 2
                : 1.2 + Math.random() * 2.2,
          hue: Math.random() < 0.5 ? 0 : 1,
          seed: Math.random() * Math.PI * 2,
        });
      }
      start();
    };
    const onLeave = () => {
      ptr.seen = false;
    };

    const colorOf = (p: P, cursor: boolean) =>
      cursor && EFFECT_COLOR[s.cursorEffect] ? effColor : p.hue === 0 ? colA : colB;

    const drawAmbient = () => {
      bctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ambient.length; i++) {
        const p = ambient[i]!;
        p.life++;
        p.x += p.vx + Math.sin((p.life + p.seed * 100) / 90) * 0.08;
        p.y += p.vy;
        if (p.life > p.max || p.y < -20 || p.y > h + 20 || p.x < -20 || p.x > w + 20) {
          ambient[i] = spawnAmbient(style, w, h, false);
          continue;
        }
        const fade = Math.min(1, p.life / 60, (p.max - p.life) / 60);
        bctx.fillStyle = p.hue === 0 ? colA : colB;
        if (style === "fog") {
          bctx.globalAlpha = 0.035 * fade;
          bctx.beginPath();
          bctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          bctx.fill();
        } else if (style === "stars") {
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(p.life / 40 + p.seed));
          bctx.globalAlpha = 0.5 * fade * tw;
          bctx.fillRect(p.x - p.size, p.y - 0.4, p.size * 2, 0.8);
          bctx.fillRect(p.x - 0.4, p.y - p.size, 0.8, p.size * 2);
        } else if (style === "bubbles") {
          bctx.globalAlpha = 0.35 * fade;
          bctx.strokeStyle = bctx.fillStyle;
          bctx.lineWidth = 0.8;
          bctx.beginPath();
          bctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
          bctx.stroke();
        } else {
          const flick = style === "sparks" ? (Math.random() < 0.08 ? 1 : 0.35) : 1;
          bctx.globalAlpha = (style === "motes" ? 0.3 : 0.45) * fade * flick;
          bctx.beginPath();
          bctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          bctx.fill();
        }
      }
      bctx.globalAlpha = 1;
    };

    const drawCursor = () => {
      fctx.clearRect(0, 0, w, h);
      const eff = s.cursorEffect;
      if (ptr.seen) {
        ptr.sx += (ptr.x - ptr.sx) * 0.25;
        ptr.sy += (ptr.y - ptr.sy) * 0.25;
      }
      if (eff === "glow" && ptr.seen) {
        const r = 70 + (s.cursorIntensity / 100) * 60;
        const g = fctx.createRadialGradient(ptr.sx, ptr.sy, 0, ptr.sx, ptr.sy, r);
        g.addColorStop(0, colA);
        g.addColorStop(1, "transparent");
        fctx.globalAlpha = budget.alpha * 0.22;
        fctx.fillStyle = g;
        fctx.fillRect(ptr.sx - r, ptr.sy - r, r * 2, r * 2);
        fctx.globalAlpha = 1;
        return;
      }
      fctx.globalCompositeOperation = eff === "shadow" ? "source-over" : "lighter";
      if (eff === "lightning") {
        while (pts.length && frame - pts[0]!.t > budget.life / 3) pts.shift();
        if (pts.length > 1) {
          fctx.strokeStyle = colA;
          fctx.lineWidth = 1.4;
          fctx.globalAlpha = budget.alpha * (0.6 + Math.random() * 0.4);
          fctx.beginPath();
          fctx.moveTo(pts[0]!.x, pts[0]!.y);
          for (let i = 1; i < pts.length; i++) {
            const j = 7 * (1 - i / pts.length);
            fctx.lineTo(
              pts[i]!.x + (Math.random() - 0.5) * j,
              pts[i]!.y + (Math.random() - 0.5) * j,
            );
          }
          fctx.stroke();
        }
      } else {
        pts.length = 0;
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i]!;
        p.life++;
        if (p.life >= p.max) {
          trail.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= eff === "flame" ? 0.99 : 0.96;
        const k = 1 - p.life / p.max;
        fctx.fillStyle = colorOf(p, true);
        fctx.strokeStyle = fctx.fillStyle;
        fctx.globalAlpha =
          budget.alpha * k * (eff === "mist" ? 0.12 : eff === "shadow" ? 0.25 : 0.8);
        fctx.beginPath();
        if (eff === "water") {
          fctx.lineWidth = 1;
          fctx.arc(p.x, p.y, p.size + (1 - k) * 14, 0, Math.PI * 2);
          fctx.stroke();
        } else if (eff === "cosmic") {
          const sz = p.size * (0.6 + 0.4 * Math.abs(Math.sin(p.life / 5 + p.seed)));
          fctx.fillRect(p.x - sz * 1.6, p.y - 0.5, sz * 3.2, 1);
          fctx.fillRect(p.x - 0.5, p.y - sz * 1.6, 1, sz * 3.2);
        } else {
          const sz =
            eff === "flame"
              ? p.size * (0.5 + k)
              : eff === "mist" || eff === "shadow"
                ? p.size * (1.4 - k * 0.4)
                : p.size * k + 0.4;
          fctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
          fctx.fill();
        }
      }
      fctx.globalAlpha = 1;
      fctx.globalCompositeOperation = "source-over";
    };

    const tick = () => {
      frame++;
      if (nAmbient) drawAmbient();
      if (cursorOn) drawCursor();
      // Cursor-only mode sleeps once the trail has faded and the glow has caught up.
      const cursorIdle =
        !trail.length && !pts.length && (s.cursorEffect !== "glow" || frame - ptr.moved > 40);
      if (!nAmbient && cursorIdle) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      } else start();
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    if (cursorOn) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    if (nAmbient) start();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      bctx.clearRect(0, 0, w, h);
      fctx.clearRect(0, 0, w, h);
    };
  }, [s, reduced, mounted]);

  return (
    <>
      <canvas ref={bgRef} aria-hidden="true" className="eo-fx-canvas eo-fx-bg" />
      {/* Portaled so the trail also draws above dialogs, which portal to <body>. */}
      {mounted &&
        createPortal(
          <canvas ref={fgRef} aria-hidden="true" className="eo-fx-canvas eo-fx-cursor" />,
          document.body,
        )}
    </>
  );
}

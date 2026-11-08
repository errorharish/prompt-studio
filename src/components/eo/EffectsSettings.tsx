// Settings → Appearance & Effects. Every control writes to effectsStore, applies at once
// and is saved in this browser. Effects are decorative only.
import type { ReactNode } from "react";
import { Card, Details, SectionTitle, Toggle } from "./kit";
import { RangeSlider, Segmented } from "./controls";
import { PremiumSelect } from "./dropdown";
import { resetEffects, setEffects, setPreset, useEffectsSettings } from "./effectsStore";
import {
  CURSOR_EFFECTS,
  CURSOR_LABELS,
  FX_THEMES,
  PRESETS,
  THEMES,
  type EffectsSettings,
  type Preset,
} from "@/lib/eo/effects";
import { cn } from "@/lib/utils";

function Row({ t, s, children }: { t: string; s: string; children: ReactNode }) {
  return (
    <div
      className="grid items-center gap-3.5 border-b border-border py-2 last:border-0"
      style={{ gridTemplateColumns: "minmax(150px, 1fr) auto" }}
    >
      <div>
        <div className="text-[13px] font-semibold">{t}</div>
        <div className="text-[11.5px] text-muted-foreground">{s}</div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  );
}

type NumKey = {
  [K in keyof EffectsSettings]: EffectsSettings[K] extends number ? K : never;
}[keyof EffectsSettings];
type BoolKey = {
  [K in keyof EffectsSettings]: EffectsSettings[K] extends boolean ? K : never;
}[keyof EffectsSettings];

function Level({ k, label, disabled }: { k: NumKey; label: string; disabled?: boolean }) {
  const s = useEffectsSettings();
  return (
    <div
      className={cn("flex w-64 items-center gap-2", disabled && "pointer-events-none opacity-40")}
    >
      <RangeSlider
        className="flex-1"
        label={label}
        value={s[k]}
        onChange={(v) => setEffects({ [k]: v })}
        min={0}
        max={100}
        step={5}
      />
      <span className="w-8 text-right font-mono text-[11px] tabular-nums">{s[k]}</span>
    </div>
  );
}

function Switch({ k, label }: { k: BoolKey; label: string }) {
  const s = useEffectsSettings();
  return <Toggle label={label} on={s[k]} onChange={(v) => setEffects({ [k]: v })} />;
}

const PRESET_LABEL: Record<Preset, string> = {
  minimal: "MINIMAL",
  balanced: "BALANCED",
  enhanced: "ENHANCED",
};

export function EffectsSettingsCard() {
  const s = useEffectsSettings();
  const cursorOff = !s.cursor || s.cursorEffect === "none";
  return (
    <Card>
      <SectionTitle
        title="APPEARANCE & EFFECTS"
        sub="Themes, animated backgrounds, cursor trail and motion. Applies instantly and is saved."
        right={
          <button
            type="button"
            onClick={resetEffects}
            className="eo-btn h-7 rounded-lg border border-border px-2.5 text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase hover:text-foreground"
          >
            Reset effects
          </button>
        }
      />
      <Row
        t="Animation Preset"
        s={s.preset === "custom" ? "Custom — edited by hand" : "Quick starting point"}
      >
        <Segmented
          label="Animation preset"
          options={PRESETS.map((p) => PRESET_LABEL[p])}
          value={s.preset === "custom" ? "" : PRESET_LABEL[s.preset]}
          onChange={(v) => {
            const p = PRESETS.find((x) => PRESET_LABEL[x] === v);
            if (p) setPreset(p);
          }}
        />
      </Row>
      <Row t="Visual Theme" s="Accent palette, ambient particles and trail colours">
        <div role="group" aria-label="Visual theme" className="flex flex-wrap justify-end gap-1.5">
          {FX_THEMES.map((t) => (
            <button
              key={t}
              type="button"
              data-ripple
              aria-pressed={s.theme === t}
              onClick={() => setEffects({ theme: t })}
              className={cn(
                "eo-fx-theme flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-bold tracking-[0.06em] uppercase",
                s.theme === t
                  ? "border-cyan/60 bg-cyan/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              <span aria-hidden="true" className="eo-fx-dot" data-fx-dot={t} />
              {THEMES[t].label}
            </button>
          ))}
        </div>
      </Row>

      <h3 className="mt-3 mb-1 eo-label text-[10px] text-cyan">BACKGROUND EFFECTS</h3>
      <Row t="Animated Backgrounds" s="Drifting glows, moving grid and ambient particles">
        <Switch k="background" label="Animated backgrounds" />
      </Row>
      <Row t="Background Intensity" s="Grid and particle strength">
        <Level k="bgIntensity" label="Background intensity" disabled={!s.background} />
      </Row>
      <Row t="Ambient Glow" s="Strength of the slow-moving light">
        <Level k="glowIntensity" label="Ambient glow intensity" disabled={!s.background} />
      </Row>
      <Row t="Ambient Particles" s="Theme particles (embers, stars, bubbles…)">
        <Switch k="particles" label="Ambient particles" />
      </Row>

      <h3 className="mt-3 mb-1 eo-label text-[10px] text-cyan">CURSOR EFFECTS</h3>
      <Row t="Cursor Effect" s="Drawn behind your pointer; your normal cursor stays">
        <Switch k="cursor" label="Cursor effects" />
        <div className="w-44">
          <PremiumSelect
            size="sm"
            label="Cursor effect"
            value={s.cursorEffect as string}
            disabled={!s.cursor}
            onChange={(v) => setEffects({ cursorEffect: v as EffectsSettings["cursorEffect"] })}
            options={CURSOR_EFFECTS.map((c) => ({ value: c as string, label: CURSOR_LABELS[c] }))}
          />
        </div>
      </Row>
      <Details inline title="TRAIL TUNING" hint="Intensity, density, length and speed">
        <Row t="Intensity" s="Brightness of the effect">
          <Level k="cursorIntensity" label="Cursor effect intensity" disabled={cursorOff} />
        </Row>
        <Row t="Particle Density" s="Particles per movement">
          <Level k="cursorDensity" label="Cursor particle density" disabled={cursorOff} />
        </Row>
        <Row t="Trail Length" s="How long particles last">
          <Level k="trailLength" label="Cursor trail length" disabled={cursorOff} />
        </Row>
        <Row t="Animation Speed" s="How fast particles move">
          <Level k="speed" label="Cursor animation speed" disabled={cursorOff} />
        </Row>
      </Details>

      <h3 className="mt-3 mb-1 eo-label text-[10px] text-cyan">INTERACTION EFFECTS</h3>
      <Row t="Click Ripple" s="Soft ripple where you press a button">
        <Switch k="ripple" label="Click ripple" />
      </Row>
      <Row t="Button Animations" s="Hover glow, light sweep and press feedback">
        <Switch k="buttonAnim" label="Button animations" />
      </Row>
      <Row t="Card Hover Effects" s="Lift, tilt and light sweep on cards">
        <Switch k="cardHover" label="Card hover effects" />
      </Row>
      <Row t="Animated Icons" s="Icons nudge on hover">
        <Switch k="iconAnim" label="Animated icons" />
      </Row>

      <h3 className="mt-3 mb-1 eo-label text-[10px] text-cyan">PAGE MOTION</h3>
      <Row t="Page Transitions" s="Fade and rise when switching pages">
        <Switch k="pageTransitions" label="Page transitions" />
      </Row>
      <Row t="Modal Transitions" s="Dialog entrance, light sheen and exit">
        <Switch k="modalTransitions" label="Modal transitions" />
      </Row>
      <Row t="Section Animations" s="Page sections enter one after another">
        <Switch k="sectionAnim" label="Section animations" />
      </Row>
      <Row t="Sidebar Animations" s="Sliding active indicator and dock resize">
        <Switch k="sidebarAnim" label="Sidebar animations" />
      </Row>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Reduced Motion (below, or your system setting) turns every moving effect off.
      </p>
    </Card>
  );
}

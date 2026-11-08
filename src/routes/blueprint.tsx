import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge, Card, Label, PageHeader, SectionTitle } from "@/components/eo/kit";
import { MISSING_REFERENCES, PAGES, hrefFor } from "@/lib/eo/registry";
import {
  AUTO_OPTIMIZE_SPEC,
  COMPONENT_MAP,
  DEPTH,
  LAYOUT_RULES,
  MODAL_SPEC,
  MOTION,
  NATIVE_AUTO_ARCHITECTURE,
  NATIVE_RESTORE_POINT,
  NAVIGATION,
  REDUCED_MOTION,
  SLIDER_SPEC,
  SPACING,
  STATES,
  TOKENS,
  TYPE_SCALE,
} from "@/lib/eo/blueprint";

export const Route = createFileRoute("/blueprint")({
  head: () => ({
    meta: [
      { title: "UI Blueprint — ERROR OPTIMIZER Prototype" },
      {
        name: "description",
        content:
          "Page-by-page UI inventory, design tokens, motion and missing references for rebuilding ERROR OPTIMIZER in .NET 8 WPF.",
      },
      { property: "og:title", content: "UI Blueprint — ERROR OPTIMIZER Prototype" },
      {
        property: "og:description",
        content:
          "Page inventory, tokens, motion and interaction patterns for the native WPF rebuild.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Blueprint,
});

const SECTIONS = [
  ["shell", "Shell"],
  ["navigation", "Navigation"],
  ["pages", "Pages"],
  ["tokens", "Colours"],
  ["type", "Typography"],
  ["spacing", "Spacing"],
  ["depth", "Depth"],
  ["motion", "Motion"],
  ["states", "States"],
  ["dialogs", "Dialogs"],
  ["reduced", "Reduced motion"],
  ["components", "Components"],
  ["layout", "Layout & sliders"],
  ["auto", "Auto Optimize"],
  ["patterns", "Patterns"],
  ["missing", "Missing references"],
] as const;

function Section({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4">
      <Card className={className}>{children}</Card>
    </section>
  );
}

function Table({ head, rows, cols }: { head: string[]; rows: ReactNode[][]; cols: string }) {
  return (
    <div className="eo-data-table overflow-hidden rounded-lg border border-border">
      <div role="table">
        <div
          role="row"
          className="grid bg-window px-3 py-2 eo-label text-[9px] text-subtle"
          style={{ gridTemplateColumns: cols }}
        >
          {head.map((h) => (
            <span role="columnheader" key={h}>
              {h}
            </span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div
            role="row"
            key={i}
            className="grid items-center gap-2 border-t border-border px-3 py-2 text-[12px]"
            style={{ gridTemplateColumns: cols }}
          >
            {r.map((c, j) => (
              <span
                role="cell"
                key={j}
                className={j === 0 ? "font-semibold" : "text-muted-foreground"}
              >
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Blueprint() {
  const groups = [
    {
      t: "V3 — Glass sidebar dock (19 entries, 5 separator groups)",
      items: PAGES.filter((p) => p.suite === "V3" && p.inDock),
    },
    {
      t: "V3 — Routes without a dock entry",
      items: PAGES.filter((p) => p.suite === "V3" && !p.inDock),
    },
    { t: "V4 — Sidebar pages", items: PAGES.filter((p) => p.suite === "V4") },
  ];
  return (
    <div className="space-y-4">
      <PageHeader
        title="UI Blueprint"
        badges={
          <>
            <Badge tone="cyan">FOR WPF REBUILD</Badge>
            <Badge>{PAGES.length} PAGES + BLUEPRINT</Badge>
          </>
        }
        sub="Page inventory, design tokens, motion and interaction rules for rebuilding ERROR OPTIMIZER in .NET 8 WPF. Layouts follow the original XAML audit; the reference ZIP files themselves are not part of this project copy."
      />

      <nav aria-label="Blueprint contents" className="flex flex-wrap gap-1.5">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-md border border-border bg-window px-2.5 py-1 text-[10.5px] font-bold uppercase text-muted-foreground hover:border-cyan/50 hover:text-cyan"
          >
            {label}
          </a>
        ))}
      </nav>

      <Section id="shell">
        <SectionTitle id="shell-title" title="SHELL" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[12.5px] text-muted-foreground">
          <div>Window base 1280 × 820 · custom title bar 48px · footer 32px</div>
          <div>
            Title bar: brand tile (cyan→blue gradient) · ERROR OPTIMIZER · V3/V4 pill · subtitle ·
            BLUEPRINT · DEMO DATA · status pill
          </div>
          <div>
            V3: GlassSidebarDock 84px (60px collapsed), items 68px (16px icon + 9.2px label), 3px
            cyan active bar with glow
          </div>
          <div>V4: same vertical dock, V4 pages only, opening on the V4 Performance Center</div>
          <div>
            Content: PageTransitionHost (see Motion), padding 24px, max width 1440px,
            SlimScrollViewer
          </div>
          <div>Fonts: Segoe UI Variable Display (primary), Cascadia Code (mono)</div>
        </div>
      </Section>

      <Section id="navigation">
        <SectionTitle id="navigation-title" title="NAVIGATION ARCHITECTURE" />
        <Table
          head={["AREA", "BEHAVIOUR"]}
          cols="160px 1fr"
          rows={NAVIGATION.map((n) => [n.area, n.detail])}
        />
      </Section>

      <section id="pages" aria-labelledby="pages-title" className="scroll-mt-4 space-y-4">
        <h2 id="pages-title" className="sr-only">
          Page inventory
        </h2>
        {groups.map((g) => (
          <Card key={g.t}>
            <SectionTitle title={g.t} />
            <Table
              head={["ROUTE KEY", "PAGE · PURPOSE", "XAML VIEW", "VIEWMODEL", ""]}
              cols="150px 1fr 220px 220px 70px"
              rows={g.items.map((p) => [
                <span key="k" className="font-mono text-cyan">
                  {p.routeKey}
                </span>,
                <span key="t">
                  <b className="text-foreground">{p.title}</b> — {p.description}
                </span>,
                <span key="v" className="font-mono text-[11px]">
                  {p.view}
                </span>,
                <span key="m" className="font-mono text-[11px]">
                  {p.viewModel}
                </span>,
                <Link
                  key="o"
                  to={hrefFor(p.slug) as never}
                  aria-label={`Open ${p.title}`}
                  className="text-[10.5px] font-bold text-cyan hover:underline"
                >
                  OPEN →
                </Link>,
              ])}
            />
          </Card>
        ))}
      </section>

      <Section id="tokens">
        <SectionTitle id="tokens-title" title="COLOUR TOKENS (DesignTokens.xaml → CSS)" />
        <div className="grid grid-cols-2 gap-2">
          {TOKENS.map(([n, hex, key, cls]) => (
            <div
              key={n}
              className="flex items-center gap-3 rounded-lg border border-border bg-window px-3 py-2 text-[12px]"
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 shrink-0 rounded-md border border-border"
                style={{ background: hex }}
              />
              <span className="w-28 font-semibold">{n}</span>
              <span className="w-20 font-mono">{hex}</span>
              <span className="flex-1 font-mono text-[11px] text-muted-foreground">{key}</span>
              <span className="font-mono text-[10.5px] text-subtle">{cls}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          Tier accents: Normal #10B981 · Pro #2563EB · Ultimate #EF4444 · Debloat #06B6D4 · BIOS
          Safe #0EA5E9. Accent studio swaps the cyan role only.
        </p>
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Section id="type">
          <SectionTitle id="type-title" title="TYPOGRAPHY" sub="Letter-spacing is 0 everywhere." />
          <Table
            head={["ROLE", "SIZE", "WEIGHT", "NOTES"]}
            cols="1.2fr 70px 60px 1.5fr"
            rows={TYPE_SCALE.map((t) => [t.role, t.size, t.weight, t.notes])}
          />
        </Section>
        <Section id="spacing">
          <SectionTitle id="spacing-title" title="SPACING & RADII" />
          <Table head={["ROLE", "VALUE"]} cols="1fr 1.4fr" rows={SPACING.map(([r, v]) => [r, v])} />
        </Section>
      </div>

      <Section id="depth">
        <SectionTitle id="depth-title" title="SHADOWS & CARD DEPTH" />
        <div className="grid grid-cols-5 gap-2.5">
          {DEPTH.map((d) => (
            <div
              key={d.name}
              className="rounded-lg border border-border bg-window p-3"
              style={
                d.css.startsWith("--shadow") || d.css === "--overlay-shadow"
                  ? { boxShadow: `var(${d.css})` }
                  : undefined
              }
            >
              <Label className="text-foreground">{d.name}</Label>
              <div className="mt-1 font-mono text-[10.5px] text-cyan">{d.css}</div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{d.use}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="motion">
        <SectionTitle id="motion-title" title="ANIMATION DURATIONS & EASING" />
        <Table
          head={["ANIMATION", "DURATION", "EASING", "WPF TRANSLATION"]}
          cols="1fr 130px 170px 1.6fr"
          rows={MOTION.map((m) => [
            m.name,
            m.duration,
            <span key="e" className="font-mono text-[11px]">
              {m.easing}
            </span>,
            m.wpf,
          ])}
        />
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Section id="states">
          <SectionTitle id="states-title" title="HOVER, PRESSED & FOCUS STATES" />
          <Table
            head={["STATE", "SPEC"]}
            cols="110px 1fr"
            rows={STATES.map((s) => [s.state, s.spec])}
          />
        </Section>
        <div className="space-y-4">
          <Section id="dialogs">
            <SectionTitle id="dialogs-title" title="DIALOGS & MODAL TRANSITIONS" />
            <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
              {MODAL_SPEC.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
          </Section>
          <Section id="reduced">
            <SectionTitle id="reduced-title" title="REDUCED-MOTION BEHAVIOUR" />
            <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
              {REDUCED_MOTION.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <Section id="components">
        <SectionTitle id="components-title" title="COMPONENT → WPF MAPPING" />
        <Table
          head={["PROTOTYPE COMPONENT", "WPF CONTROL / RESOURCE", "NOTE"]}
          cols="1.2fr 1.3fr 1.5fr"
          rows={COMPONENT_MAP.map((c) => [
            c.web,
            <span key="w" className="font-mono text-[11px]">
              {c.wpf}
            </span>,
            c.note,
          ])}
        />
      </Section>

      <div className="eo-cols grid grid-cols-2 gap-4">
        <Section id="layout">
          <SectionTitle
            id="layout-title"
            title="PREMIUM LAYOUT RULES"
            sub="Dashboard, System Telemetry, AI Optimization and V4 workspaces."
          />
          <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
            {LAYOUT_RULES.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </Section>
        <section aria-labelledby="slider-title" className="scroll-mt-4">
          <Card>
            <SectionTitle
              id="slider-title"
              title="SLIDER BEHAVIOUR"
              sub="RangeSlider + NumberField (RAM Limiter, Settings)."
            />
            <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
              {SLIDER_SPEC.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <Section id="auto">
        <SectionTitle
          id="auto-title"
          title="AUTO OPTIMIZE — MAINTENANCE ENGINE"
          badge={<Badge tone="warning">PROTOTYPE SIMULATION</Badge>}
          sub="UI and workflow as built in the prototype, then the intended native architecture."
        />
        <Table
          head={["AREA", "BEHAVIOUR"]}
          cols="160px 1fr"
          rows={AUTO_OPTIMIZE_SPEC.map((a) => [a.area, a.detail])}
        />
        <h3 className="eo-label mt-4 mb-2 text-[10px] text-foreground">
          NATIVE WPF ARCHITECTURE (NOT IMPLEMENTED IN THE BROWSER)
        </h3>
        <Table
          head={["AREA", "INTENDED IMPLEMENTATION"]}
          cols="160px 1fr"
          rows={NATIVE_AUTO_ARCHITECTURE.map((a) => [a.area, a.detail])}
        />
      </Section>

      <Section id="restore">
        <SectionTitle
          id="restore-title"
          title="SYSTEM PROTECTION & RESTORE POINTS"
          badge={<Badge tone="warning">PROTOTYPE SIMULATION</Badge>}
          sub="Check protection → disabled dialog → explicit confirmation → elevate → enable C: only → verify → create → verify. Never silent, never other drives."
        />
        <Table
          head={["AREA", "INTENDED C# / .NET 8 IMPLEMENTATION"]}
          cols="160px 1fr"
          rows={NATIVE_RESTORE_POINT.map((a) => [a.area, a.detail])}
        />
      </Section>

      <Section id="patterns">
        <SectionTitle id="patterns-title" title="REUSABLE PATTERNS" />
        <ul className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12.5px] text-muted-foreground">
          <li>
            <b className="text-foreground">Page header</b> — accent bar, uppercase h1, badges,
            subtitle; actions right.
          </li>
          <li>
            <b className="text-foreground">Stat strip</b> — equal tiles with label, number, caption.
          </li>
          <li>
            <b className="text-foreground">Filter chips</b> — RadioButton rows; active = cyan
            border/tint.
          </li>
          <li>
            <b className="text-foreground">Selectable item row</b> — checkbox, name, category +
            state + risk badges, Details.
          </li>
          <li>
            <b className="text-foreground">Details modal</b> — numbered SECTION blocks; raw paths
            behind a DETAILS expander.
          </li>
          <li>
            <b className="text-foreground">Sticky action bar</b> — selection count + Clear / Review
            / Apply.
          </li>
          <li>
            <b className="text-foreground">Run flow</b> — Approve → Restore point → 5 stages →
            honest summary.
          </li>
          <li>
            <b className="text-foreground">Guide modal</b> — numbered steps; V4 guide uses a 240px
            section rail.
          </li>
          <li>
            <b className="text-foreground">Empty / loading</b> — dashed panel with reset action;
            skeleton rows with live status.
          </li>
          <li>
            <b className="text-foreground">Safety copy</b> — Protected, Reversible, Verified badges
            describe the native app, never this PC.
          </li>
        </ul>
      </Section>

      <Section id="missing" className="border-warning/30">
        <SectionTitle
          id="missing-title"
          title="MISSING OR CONFLICTING REFERENCES"
          sub="Areas where the references do not fully determine the layout. Nothing here was guessed silently."
        />
        <div className="space-y-2">
          {MISSING_REFERENCES.map((m) => (
            <div key={m.area} className="rounded-lg border border-border bg-window p-3">
              <Label as="h3" className="text-warning">
                {m.area}
              </Label>
              <p className="mt-1 text-[12.5px] text-muted-foreground">{m.detail}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

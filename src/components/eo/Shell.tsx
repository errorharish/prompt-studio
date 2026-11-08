import { isDesktopApp, minimizeWindow, closeWindow, dragWindow } from "@/lib/eo/nativeBridge";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Circle, PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react";
import { ICONS } from "./icons";
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Btn } from "./kit";
import { AutoChip } from "./AutoChip";
import { EffectsLayer } from "./Effects";
import { useAutoOptimizeBoot } from "./autoOptimizeStore";
import { PAGES, V4_NAV, hrefFor, pageBySlug } from "@/lib/eo/registry";

function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Circle;
  return <C aria-hidden="true" className={className} />;
}

const DOCK_LABEL: Record<string, string> = {
  Dashboard: "HOME",
  InputOptimizer: "INPUT",
  SystemInfo: "SYSTEM",
  RegistryTweak: "REGISTRY",
  RegistryValues: "VALUES",
  StartupManager: "STARTUP",
  Network: "NETWORK",
  Storage: "STORAGE",
  Tools: "TOOLS",
  Normal: "NORMAL",
  Pro: "PRO",
  Ultimate: "ULTIMATE",
  Debloat: "DEBLOAT",
  BiosSafe: "BIOS",
  MaxPerformance: "MAX PERF",
  AiOptimization: "AI",
  BackupRestore: "BACKUP",
  Settings: "SETTINGS",
  About: "ABOUT",
};

const DOCK_KEY = "eo-dock-collapsed";

type Box = { x: number; y: number; w: number; h: number } | null;

/** Measures the element marked aria-current="page" inside `container` so one shared
 *  indicator can slide between nav items instead of each item painting its own. */
function useActiveBox(deps: unknown[]) {
  const ref = useRef<HTMLElement>(null);
  const [box, setBox] = useState<Box>(null);
  const measure = useCallback(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-current="page"]');
    setBox(
      el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null,
    );
  }, []);
  useEffect(() => {
    measure();
    // Re-measure after the dock width transition settles.
    const t = setTimeout(measure, 340);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { ref, box };
}

export function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  useAutoOptimizeBoot();
  const slug = loc.pathname.replace(/^\//, "");
  const page = pageBySlug(slug);
  const isBlueprint = slug === "blueprint";
  const isV4 = page?.suite === "V4";
  const dock = isV4
    ? V4_NAV.flatMap((n) => {
        const p = pageBySlug(n.slug);
        return p
          ? [
              {
                slug: p.slug,
                key: p.routeKey,
                title: p.title,
                tooltip: p.tooltip,
                icon: p.icon,
                label: n.label,
                group: n.group as string,
              },
            ]
          : [];
      })
    : PAGES.filter((p) => p.inDock).map((p) => ({
        slug: p.slug,
        key: p.routeKey,
        title: p.title,
        tooltip: p.tooltip,
        icon: p.icon,
        label: DOCK_LABEL[p.routeKey] ?? p.title,
        group: String(p.dockGroup ?? 0),
      }));
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(DOCK_KEY) === "1");
  }, []);
  const toggleDock = () =>
    setCollapsed((c) => {
      window.localStorage.setItem(DOCK_KEY, c ? "0" : "1");
      return !c;
    });
  const dockBox = useActiveBox([slug, collapsed, isV4]);

  return (
    <div className="relative isolate flex h-screen flex-col overflow-hidden">
      <div aria-hidden="true" className="eo-ambient" />
      <EffectsLayer page={slug || "dashboard"} />
      <a href="#main-content" className="eo-skip">
        Skip to page content
      </a>
      {/* ── Title bar (48px) ── */}
      <header
        className="eo-shell-header relative z-20 flex h-12 shrink-0 items-center justify-between px-4 select-none"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        onMouseDown={(e) => {
          if (
            e.button === 0 &&
            !(e.target as HTMLElement).closest("button, a, input, select, [data-no-drag]")
          ) {
            dragWindow();
          }
        }}
      >
        <div className="flex items-center gap-3.5" data-no-drag="true" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <Link to="/" className="eo-logo" aria-label="ERROR OPTIMIZER — Dashboard">
            <span className="eo-logo-mark" aria-hidden="true">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span className="eo-logo-text">
              <span className="eo-shell-brand">ERROR OPTIMIZER</span>
              <span className="eo-logo-edition">{isV4 ? "V4 PROFESSIONAL" : "V3 CLASSIC"}</span>
            </span>
          </Link>
          <div
            role="group"
            aria-label="Suite"
            className="eo-suite"
            data-v4={isV4 ? "true" : undefined}
          >
            <span aria-hidden="true" className="eo-suite-thumb" />
            {(["V3", "V4"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={(v === "V4") === !!isV4}
                title={
                  v === "V3"
                    ? "Switch to Error Optimizer V3 Classic Suite"
                    : "Switch to Error Optimizer V4 Professional Suite"
                }
                onClick={() => {
                  if ((v === "V4") === !!isV4) return;
                  navigate({
                    to: v === "V3" ? "/" : "/$page",
                    params: v === "V4" ? { page: "v4-dashboard" } : undefined,
                  } as never);
                }}
                className="eo-suite-opt"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2" data-no-drag="true" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <AutoChip />
          <Link
            to="/blueprint"
            title="Design and WPF handoff documentation"
            aria-current={isBlueprint ? "page" : undefined}
            className={cn(
              "eo-chip",
              isBlueprint
                ? "border-cyan/60 bg-cyan/15 text-cyan"
                : "hover:border-border-strong hover:text-foreground",
            )}
          >
            BLUEPRINT
          </Link>
          <span
            className="eo-chip eo-service-label"
            data-tone="warning"
            title="Browser prototype: demo data, simulated services, no changes to this PC"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warning" />
            SIMULATED · DEMO DATA
          </span>
          {isDesktopApp() && (
            <div className="flex items-center gap-1 pl-2 border-l border-border/40">
              <button
                type="button"
                onClick={minimizeWindow}
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:bg-white/10 hover:text-white text-xs font-mono"
                title="Minimize"
              >
                ─
              </button>
              <button
                type="button"
                onClick={closeWindow}
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:bg-red-500/80 hover:text-white text-xs"
                title="Close"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── Glass sidebar dock (84px, 60px collapsed); V3 and V4 each list only their own pages ── */}
        {
          <div
            className="eo-dock relative z-10 flex shrink-0 flex-col border-r border-border"
            data-collapsed={collapsed}
            style={{ width: collapsed ? 60 : 84 }}
          >
            <nav
              ref={dockBox.ref}
              aria-label={isV4 ? "V4 pages" : "V3 pages"}
              data-suite={isV4 ? "V4" : "V3"}
              className="eo-scroll-fade relative flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-y-auto py-2"
            >
              {dockBox.box && (
                <span
                  aria-hidden="true"
                  className="eo-dock-indicator"
                  style={{
                    transform: `translate(${dockBox.box.x}px, ${dockBox.box.y}px)`,
                    width: dockBox.box.w,
                    height: dockBox.box.h,
                  }}
                />
              )}
              {dock.map((p, i) => {
                const active = slug === p.slug;
                const sep = i > 0 && dock[i - 1]?.group !== p.group;
                return (
                  <Fragment key={p.key}>
                    {sep && <div className="eo-dock-sep my-1.5 h-px w-10 shrink-0 bg-border" />}
                    <Link
                      to={hrefFor(p.slug) as never}
                      title={p.tooltip}
                      aria-label={p.title}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "eo-nav-item relative flex w-[68px] shrink-0 flex-col items-center gap-1 rounded-lg py-2",
                        active
                          ? "text-cyan"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                      )}
                    >
                      <Icon name={p.icon} className="h-4 w-4" />
                      <span className="eo-nav-label text-[9.2px] font-semibold tracking-wide">
                        {p.label}
                      </span>
                    </Link>
                  </Fragment>
                );
              })}
            </nav>
            <div className="eo-dock-toggle flex shrink-0 justify-center border-t border-border py-1.5">
              <Btn
                size="sm"
                variant="ghost"
                pressed={collapsed}
                onClick={toggleDock}
                title={collapsed ? "Show dock labels" : "Collapse dock to icons"}
                label={collapsed ? "Show dock labels" : "Collapse dock to icons"}
                className="h-7 w-10 border-transparent px-0"
              >
                {collapsed ? (
                  <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
                )}
              </Btn>
            </div>
          </div>
        }

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-y-auto outline-none"
        >
          <div key={loc.pathname} className="eo-page-content eo-enter mx-auto max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>

      {/* ── Footer status bar (32px) ── */}
      <footer className="eo-shell-footer relative z-10 flex h-8 shrink-0 items-center justify-between border-t border-border px-4 text-[10px] font-semibold text-subtle">
        <span>
          <span className="text-cyan">⚡</span> ERROR OPTIMIZER {isV4 ? "V4" : "V3"} ·{" "}
          {(page?.routeKey ?? (isBlueprint ? "BLUEPRINT" : "")).toUpperCase()} · BROWSER PROTOTYPE
        </span>
        <span>SIMULATED · NO CHANGES ARE MADE TO THIS PC</span>
      </footer>
    </div>
  );
}

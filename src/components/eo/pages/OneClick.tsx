// OneClickOptimizationView.xaml — dedicated full-page workflow (not a modal).
// Flow: Analyze → Review → Confirm → Simulated result. All results are simulated.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  ChevronDown,
  ScanSearch,
  RotateCcw,
  X,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  BackLink,
  PageHeader,
  Badge,
  Btn,
  SelectionBar,
  Card,
  Check,
  KV,
  Label,
  Modal,
  RiskBadge,
  SimNotice,
  SearchBox,
  EmptyState,
  LoadingState,
  Stepper,
} from "../kit";
import { RunModal } from "../RunModal";
import { ReviewSelectionModal } from "../ReviewSelectionModal";
import { useOptimizeWorkflow } from "../useOptimizeWorkflow";
import { ONE_CLICK_ACTIONS, ONE_CLICK_GROUPS } from "@/lib/eo/data";
import { filterRecommendations } from "@/lib/eo/recommendations";
import { cn } from "@/lib/utils";

const FILTERS = {
  STATUS: [
    "All Optimizations",
    "Recommended Only",
    "Optional",
    "Already Optimized",
    "Protected Items",
  ],
  CATEGORY: ["System Performance", "Background Workload", "Memory", "Power / Performance"],
  "ACTION REQUIREMENTS": ["Can Optimize Now", "Background-Safe", "Requires Restart"],
};
const PROTECTED = [
  "Windows core binaries",
  "Display & audio drivers",
  "Active foreground application",
  "Anti-cheat & game launchers",
  "Security software",
  "User files & logins",
];
const STEPS = ["Analyze", "Review", "Confirm", "Simulated result"];

export function OneClickPage() {
  const wf = useOptimizeWorkflow(1400);
  const { scan, analyzed, sel, setSel, summary, selectedItems, lastRun, toggle } = wf;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState("All Optimizations");
  const [review, setReview] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [run, setRun] = useState(false);
  const [protOpen, setProtOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => filterRecommendations(area, filter, query), [area, filter, query]);
  const d = ONE_CLICK_ACTIONS.find((a) => a.id === detail);
  const step = lastRun ? 4 : run ? 2 : review ? 2 : analyzed ? 1 : 0;

  // Close the filter popover on outside click or Escape.
  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  const analyze = () => {
    setArea(null);
    wf.analyze();
  };
  const resetFilters = () => {
    setFilter("All Optimizations");
    setQuery("");
    setArea(null);
  };

  return (
    <div className="space-y-4 pb-20">
      <PageHeader
        back={<BackLink onClick={() => navigate({ to: "/" })} />}
        title="1-Click Optimization"
        badges={<Badge tone="warning">SIMULATED</Badge>}
        sub="Analyze sample recommendations, review your choices, confirm a simulated run."
        actions={
          <div className="flex gap-2">
            <Btn disabled={scan.running} onClick={analyze} title="Analyze sample recommendations">
              {scan.running ? (
                <>Analyzing…</>
              ) : analyzed ? (
                <>
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                  Rescan
                </>
              ) : (
                <>
                  <ScanSearch aria-hidden="true" className="h-3.5 w-3.5" />
                  Analyze
                </>
              )}
            </Btn>
            <Btn
              variant="primary"
              size="lg"
              disabled={scan.running || !analyzed || !sel.size}
              onClick={() => setReview(true)}
            >
              Review selection
            </Btn>
          </div>
        }
      />

      <Stepper steps={STEPS} current={step} label="1-Click workflow" />

      {/* Status strip: cols=Auto,12,*,Auto */}
      <Card className="flex items-center gap-4 py-3.5">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            analyzed ? "bg-success/15 text-success" : "bg-cyan/15 text-cyan",
          )}
        >
          {analyzed ? (
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          ) : (
            <ScanSearch aria-hidden="true" className="h-5 w-5" />
          )}
        </span>
        <div className="flex-1">
          <div className="text-sm font-bold">
            {scan.running
              ? "ANALYZING SAMPLE DATA…"
              : analyzed
                ? "DEMO RECOMMENDATIONS READY"
                : "NOT ANALYZED YET"}
          </div>
          <div className="text-[11.5px] text-muted-foreground">
            {analyzed
              ? `${ONE_CLICK_ACTIONS.length} recommended improvements across ${ONE_CLICK_GROUPS.length} areas (sample) · ${sel.size} selected`
              : scan.running
                ? "Loading the sample recommendation set. Nothing on this PC is scanned."
                : "Run Analyze to load the sample recommendations. Nothing on this PC is scanned."}
          </div>
        </div>
        <Badge tone={analyzed ? "success" : "muted"}>SIMULATED ANALYSIS</Badge>
      </Card>

      {/* Optimization areas */}
      <Card>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <Label as="h2" className="text-foreground">
              OPTIMIZATION AREAS
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Review the sample recommendations by area. Select an area to focus the list.
            </p>
          </div>
          <Btn
            size="sm"
            variant="ghost"
            disabled={!area}
            onClick={() => setArea(null)}
            title="Show all 1-Click optimization checks across all workloads"
          >
            Show all checks
          </Btn>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {ONE_CLICK_GROUPS.map((g) => {
            const inGroup = ONE_CLICK_ACTIONS.filter((a) => a.group === g.key);
            const picked = inGroup.filter((a) => sel.has(a.id)).length;
            return (
              <button
                type="button"
                key={g.key}
                aria-pressed={area === g.key}
                onClick={() => setArea(area === g.key ? null : g.key)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  area === g.key
                    ? "border-cyan/60 bg-cyan/10 eo-glow"
                    : "border-border bg-window hover:-translate-y-0.5 hover:border-border-strong",
                )}
              >
                <div className="eo-label text-foreground">{g.key}</div>
                <p className="mt-1 text-[11.5px] text-muted-foreground">{g.desc}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge tone="cyan">{inGroup.length} RECOMMENDED</Badge>
                  {analyzed && (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {picked}/{inGroup.length} SELECTED
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Recommended list */}
      <Card>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Label as="h2" className="text-foreground">
              RECOMMENDED OPTIMIZATIONS
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose the sample changes to include; risk and restart requirements stay visible.
            </p>
          </div>
          <div ref={filterRef} className="relative flex flex-wrap gap-2">
            {filter !== "All Optimizations" && (
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => setFilter("All Optimizations")}
                title="Remove filter"
                label={`Remove filter: ${filter}`}
              >
                <X aria-hidden="true" className="h-3 w-3" />
                {filter}
              </Btn>
            )}
            <Btn
              size="sm"
              expanded={filterOpen}
              controls="eo-oneclick-filter"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <SlidersHorizontal aria-hidden="true" className="h-3 w-3" />
              Filter
            </Btn>
            {analyzed && (
              <SelectionBar
                count={sel.size}
                total={wf.moded.eligibleCount}
                onAll={wf.selectRecommended}
                onClear={() => setSel(new Set())}
                autoLabel="RECOMMENDED"
                moded={wf.moded}
              />
            )}
            {filterOpen && (
              <div
                id="eo-oneclick-filter"
                role="group"
                aria-label="Recommendation filters"
                className="eo-pop absolute top-9 right-0 z-20 w-64 space-y-3 rounded-lg border p-3"
              >
                {Object.entries(FILTERS).map(([h, opts]) => (
                  <div key={h}>
                    <Label className="mb-1 text-[9px]">{h}</Label>
                    {opts.map((o) => (
                      <button
                        type="button"
                        key={o}
                        aria-pressed={filter === o}
                        onClick={() => {
                          setFilter(o);
                          setFilterOpen(false);
                        }}
                        className={cn(
                          "block w-full rounded px-2 py-1 text-left text-xs",
                          filter === o
                            ? "bg-cyan/15 text-cyan"
                            : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                        )}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <SearchBox placeholder="Search recommendations…" value={query} onChange={setQuery} />
        </div>
        <div className="space-y-4" aria-live="polite">
          {scan.running && (
            <LoadingState
              label="Analyzing sample recommendations"
              progress={scan.progress}
              rows={3}
            />
          )}
          {!scan.running && !analyzed && (
            <EmptyState
              title="Analysis required"
              sub="Recommendations appear after you run Analyze. The prototype loads sample data only — it does not inspect this computer."
              action={
                <Btn variant="primary" onClick={analyze}>
                  <ScanSearch aria-hidden="true" className="h-3.5 w-3.5" />
                  Analyze
                </Btn>
              }
            />
          )}
          {!scan.running && analyzed && !visible.length && (
            <EmptyState
              title="No matching recommendations"
              sub={
                filter === "Protected Items" ||
                filter === "Already Optimized" ||
                filter === "Optional"
                  ? "The supplied sample data has no items in this state. The prototype does not invent them."
                  : "No sample recommendations match this search or filter."
              }
              action={<Btn onClick={resetFilters}>Reset filters</Btn>}
            />
          )}
          {!scan.running &&
            analyzed &&
            ONE_CLICK_GROUPS.filter((g) => visible.some((a) => a.group === g.key)).map((g) => (
              <section key={g.key} aria-label={g.key}>
                <h3 className="mb-2 eo-label text-[10px] text-cyan">{g.key}</h3>
                <ul className="space-y-2">
                  {visible
                    .filter((a) => a.group === g.key)
                    .map((a) => (
                      <li
                        key={a.id}
                        className={cn(
                          "flex items-center gap-4 rounded-xl border p-3.5 transition-colors",
                          sel.has(a.id)
                            ? "border-cyan/40 bg-cyan/5"
                            : "border-border bg-window hover:border-border-strong",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                            sel.has(a.id)
                              ? "border-cyan bg-cyan text-sidebar-primary-foreground shadow-sm"
                              : "border-border bg-window text-subtle",
                          )}
                          aria-hidden="true"
                        >
                          {sel.has(a.id) && <CheckIcon className="h-3 w-3" strokeWidth={3.5} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
                            {a.title}
                            <RiskBadge risk={a.risk} />
                            {a.restart && <Badge tone="warning">RESTART</Badge>}
                            <Badge tone="success" className="text-[9.5px] font-bold">
                              AUTO-SELECTED — ELIGIBLE
                            </Badge>
                          </div>
                          <p className="text-[12px] text-muted-foreground">{a.desc}</p>
                          <p className="mt-0.5 text-[10.5px] text-success">{a.safety}</p>
                        </div>
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => setDetail(a.id)}
                          label={`Details for ${a.title}`}
                        >
                          Details
                        </Btn>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
        </div>
      </Card>

      {/* Protection banner (expandable) */}
      <Card className="border-success/30">
        <button
          type="button"
          aria-expanded={protOpen}
          aria-controls="eo-protected-list"
          onClick={() => setProtOpen(!protOpen)}
          className="flex w-full items-center gap-3 text-left"
        >
          <ShieldCheck aria-hidden="true" className="h-5 w-5 text-success" />
          <div className="flex-1">
            <div className="eo-label text-success">YOUR APPS & SYSTEM ARE PROTECTED</div>
            <div className="text-xs text-muted-foreground">
              Critical Windows components, active applications, drivers, and games are never treated
              as optimization targets — and never selected automatically.
            </div>
          </div>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              protOpen && "rotate-180",
            )}
          />
        </button>
        {protOpen && (
          <ul
            id="eo-protected-list"
            className="mt-3 grid grid-cols-2 gap-1.5 pl-8 text-xs text-muted-foreground eo-enter"
          >
            {PROTECTED.map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-success" />
                {x}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Completion report (after a simulated run) */}
      {lastRun && (
        <Card className="eo-result">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Label as="h2" className="text-success">
                LAST SIMULATED RUN · {lastRun.at}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                A summary of the demonstration only. No Windows setting, file or service was read or
                changed.
              </p>
            </div>
            <Btn size="sm" variant="ghost" onClick={wf.dismissRun}>
              Dismiss
            </Btn>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                ["SELECTED", lastRun.selected],
                ["SIMULATED STEPS", lastRun.simulatedSteps],
                ["RESTART NOTED", lastRun.restartNoted],
                ["CHANGES ON THIS PC", lastRun.realChanges],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-window p-3">
                <div className="text-xl font-bold tabular-nums">{v}</div>
                <div className="text-[9.5px] font-bold text-muted-foreground">{k}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            Included: {lastRun.titles.join(" · ")}
          </p>
        </Card>
      )}
      <SimNotice />

      {/* Sticky action bar: cols=*,Auto */}
      <div className="eo-sticky sticky bottom-0 flex items-center justify-between border-t border-border">
        <span className="text-xs text-muted-foreground" aria-live="polite">
          <b className="text-foreground">{sel.size}</b> selected
          {summary.restart ? ` · ${summary.restart} needs a restart` : ""} · Review risks and
          restart requirements before confirming the simulated run.
        </span>
        <div className="flex gap-2">
          <Btn variant="ghost" disabled={!sel.size} onClick={() => setSel(new Set())}>
            Clear
          </Btn>
          <Btn disabled={!sel.size} onClick={() => setReview(true)}>
            Review
          </Btn>
          <Btn
            variant="primary"
            disabled={!sel.size || scan.running}
            onClick={() => setReview(true)}
          >
            Optimize selected
          </Btn>
        </div>
      </div>

      <ReviewSelectionModal
        open={review}
        onClose={() => setReview(false)}
        onConfirm={() => {
          setReview(false);
          setRun(true);
        }}
        items={selectedItems}
        summary={summary}
        onRemove={toggle}
      />

      <Modal
        open={!!d}
        onClose={() => setDetail(null)}
        title={d?.title ?? ""}
        sub="Sample recommendation metadata — no machine state is detected."
        footer={
          d && (
            <div className="flex w-full items-center justify-between">
              <Badge tone="success" className="text-[10px] font-bold">
                AUTO-SELECTED — ELIGIBLE
              </Badge>
              <Btn variant="primary" onClick={() => setDetail(null)}>
                Close
              </Btn>
            </div>
          )
        }
      >
        {d && (
          <div className="space-y-4">
            <p className="text-[12.5px] text-muted-foreground">{d.desc}</p>
            <div>
              <Label as="h3" className="mb-1 text-cyan">
                ANALYSIS & TARGET STATE
              </Label>
              <KV k="Why recommended:" v={d.why} />
              <KV k="Current state:" v="Not detected in prototype" />
              <KV k="Target configuration:" v="Optimized (see native app)" />
            </div>
            <div>
              <Label as="h3" className="mb-1 text-cyan">
                SAFETY, VERIFICATION & RESTORE
              </Label>
              <KV k="Safety & Risk:" v={<RiskBadge risk={d.risk} />} />
              <KV k="Safety notes:" v={d.safety} />
              <KV k="Restart requirement:" v={d.restart ? "Required" : "Not required"} />
              <KV k="Verification method:" v="Readback (native app)" />
              <KV k="Rollback capability:" v="Determined per operation in native app" />
            </div>
          </div>
        )}
      </Modal>

      <RunModal
        open={run}
        onClose={() => setRun(false)}
        profile="1-Click"
        count={sel.size}
        items={selectedItems}
        onComplete={wf.complete}
      />
    </div>
  );
}

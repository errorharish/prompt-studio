// TierView.xaml — one shared layout for Normal / Pro / Ultimate / Debloat / BIOS Safe / Max Performance.
// Debloat adds DEBLOAT TOOLBOX + blocklist editor; BIOS Safe adds MANUAL UEFI / FIRMWARE section.
import { useState } from "react";
import {
  Badge,
  Btn,
  Card,
  Check,
  Chips,
  Label,
  Modal,
  RiskBadge,
  SectionTitle,
  SimNotice,
  simulate,
  SearchBox,
  EmptyState,
  Details,
  KV,
  PageHeader,
  StatTiles,
  SelectionBar,
} from "../kit";
import { RunModal } from "../RunModal";
import { CATALOG, HW, TIERS, type Risk, type TierInfo } from "@/lib/eo/data";
import { toggleInSet } from "@/lib/eo/selection";
import { useModedSelection, usePersistedSelection } from "../useSelection";
import { cn } from "@/lib/utils";
import { Check as CheckIcon, Lock } from "lucide-react";

const TIER_CATS: Record<string, string[]> = {
  normal: ["TELEMETRY", "PRIVACY", "POWER", "INPUT", "NTFS"],
  pro: ["CPU", "MEMORY", "NETWORK", "GAMING", "TELEMETRY"],
  ultimate: ["CPU", "MEMORY", "GPU", "GAMING", "NETWORK", "NTFS"],
  debloat: ["PRIVACY", "TELEMETRY"],
  "bios-safe": ["SYSTEM"],
  "max-performance": ["CPU", "GPU", "POWER", "MEMORY", "GAMING"],
};
const DEBLOAT_TOOLS: Record<string, { name: string; desc: string; risk: Risk }[]> = {
  BLOATWARE: [
    {
      name: "Consumer Appx packages",
      desc: "Remove pre-installed consumer apps (news, weather, games).",
      risk: "LOW",
    },
    {
      name: "Custom bloatware removal",
      desc: "Process packages from your customized blocklist.",
      risk: "MEDIUM",
    },
  ],
  FEATURES: [
    {
      name: "Optional Windows features",
      desc: "Disable unused legacy optional features.",
      risk: "MEDIUM",
    },
  ],
  PRIVACY: [
    {
      name: "Advertising ID & tailored experiences",
      desc: "Stop personalized ads and suggestions.",
      risk: "SAFE",
    },
    { name: "Activity history", desc: "Disable timeline activity collection.", risk: "SAFE" },
  ],
  REGISTRY: [
    {
      name: "Telemetry policy keys",
      desc: "Apply telemetry policy level for this edition.",
      risk: "LOW",
    },
  ],
  "WINDOWS UI": [
    { name: "Widgets & taskbar feed", desc: "Hide the Windows 11 widgets feed.", risk: "SAFE" },
    { name: "Start menu suggestions", desc: "Remove promoted Start menu entries.", risk: "SAFE" },
  ],
  ADVANCED: [
    {
      name: "Edge background tasks",
      desc: "Disable Edge startup boost & background mode.",
      risk: "MEDIUM",
    },
  ],
};
const UEFI = [
  [
    "Enable Resizable BAR / Smart Access Memory",
    "Firmware setting · verify GPU and board support first",
  ],
  ["Enable XMP / EXPO memory profile", "Firmware setting · runs RAM at rated speed"],
  ["Disable unused onboard controllers", "Firmware setting · optional"],
];
const BLOCKLIST = [
  "Microsoft.BingNews",
  "Microsoft.BingWeather",
  "Microsoft.GetHelp",
  "Microsoft.Getstarted",
  "Microsoft.MicrosoftSolitaireCollection",
  "Microsoft.People",
  "Microsoft.WindowsFeedbackHub",
  "Microsoft.ZuneMusic",
  "Microsoft.ZuneVideo",
  "Clipchamp.Clipchamp",
];

export function TierPage({ slug }: { slug: string }) {
  const t = TIERS[slug];
  // Guard before any hooks run: TierView always calls the same hooks in the same order.
  return t ? <TierView slug={slug} t={t} /> : null;
}

function TierView({ slug, t }: { slug: string; t: TierInfo }) {
  const items = CATALOG.filter((c) => (TIER_CATS[slug] ?? []).includes(c.cat)).map((c, i) => ({
    ...c,
    scope: c.cat === "SYSTEM" ? "UEFI" : "WINDOWS",
    done: i % 4 === 3,
  }));
  // Each tier is its own profile. ALL ELIGIBLE runs every eligible item of this tier; CUSTOM is the only editable mode.
  const tierSel = useModedSelection(`tier:${slug}`, items);
  const { sel, setSel } = tierSel;
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<(typeof items)[number] | null>(null);
  const [logsCleared, setLogsCleared] = useState(false);
  const [scope, setScope] = useState("ALL");
  const [toolCat, setToolCat] = useState("BLOATWARE");
  const [block, setBlock] = useState(false);
  const [blockSel, setBlockSel] = useState<Set<string>>(new Set(BLOCKLIST.slice(0, 7)));
  const [run, setRun] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const accent = {
    "tier-normal": "bg-tier-normal",
    "tier-pro": "bg-tier-pro",
    "tier-ultimate": "bg-tier-ultimate",
    "tier-debloat": "bg-tier-debloat",
    "tier-bios": "bg-tier-bios",
    primary: "bg-primary",
  }[t.color];
  const counts = {
    safe: items.filter((i) => i.risk === "SAFE" || i.risk === "LOW").length,
    med: items.filter((i) => i.risk === "MEDIUM").length,
    high: items.filter((i) => i.risk === "HIGH").length,
  };
  const pending = items.filter((i) => !i.done);
  const vis = items.filter(
    (i) =>
      (scope === "ALL" || i.scope === scope) && i.name.toLowerCase().includes(query.toLowerCase()),
  );
  const tog = (id: string) => setSel((s) => toggleInSet(s, id));

  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        title={t.name}
        accent={accent}
        badges={
          <>
            <Badge tone="cyan">TIER PROFILE</Badge>
            <Badge tone="success">ELIGIBLE OPTIMIZATIONS ONLY</Badge>
            {t.extendsFrom && <Badge>EXTENDS {t.extendsFrom.toUpperCase()}</Badge>}
          </>
        }
        sub={t.desc.split(". ")[0]?.replace(/\.?$/, ".")}
        actions={
          <>
            <Btn variant="ghost" onClick={() => simulate("Refresh")}>
              Refresh
            </Btn>
            <Btn onClick={() => simulate("Scan system")}>Scan system</Btn>
            <Btn variant="ghost" onClick={() => simulate("Restore backup")}>
              Restore backup
            </Btn>
          </>
        }
      />

      <div className="space-y-2">
        <StatTiles
          items={[
            { label: "PROFILE ENTRIES", value: t.entries, sub: "Raw manifest count" },
            { label: "APPLICABLE", value: items.length, tone: "cyan" },
            { label: "HIGHLY RECOMMENDED", value: counts.safe, tone: "primary" },
            { label: "OPTIMIZED", value: items.length - pending.length, tone: "success" },
            { label: "PENDING", value: pending.length, tone: "warning" },
            {
              label: "SAFE · MEDIUM · HIGH",
              value: `${counts.safe} · ${counts.med} · ${counts.high}`,
            },
          ]}
        />
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-subtle">
          <Badge tone="warning">DEMO HARDWARE</Badge>
          <span>{HW.cpu}</span>
          <span aria-hidden="true">·</span>
          <span>{HW.gpu}</span>
          <span aria-hidden="true">·</span>
          <span>{HW.ram}</span>
          <span aria-hidden="true">·</span>
          <span>{HW.os}</span>
        </p>
      </div>

      <Card>
        <SectionTitle title="TOP RECOMMENDATIONS" />
        {pending.length === 0 ? (
          <div className="text-sm text-success">
            SYSTEM IS CURRENTLY FULLY OPTIMIZED FOR THIS PROFILE
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {pending.slice(0, 3).map((i) => (
              <div
                key={i.id}
                className="eo-list-row rounded-lg border border-border bg-window px-3 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <Badge tone="cyan">{i.cat}</Badge>
                  <RiskBadge risk={i.risk} />
                </div>
                <div className="mt-1.5 text-[12.5px] font-semibold">{i.name}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {t.toolbox === "debloat" && (
        <Card>
          <SectionTitle
            title="DEBLOAT TOOLBOX"
            guide="tier.debloat"
            right={
              <Btn size="sm" onClick={() => setBlock(true)}>
                Customize blocklist
              </Btn>
            }
          />
          <Chips options={Object.keys(DEBLOAT_TOOLS)} value={toolCat} onChange={setToolCat} />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {(DEBLOAT_TOOLS[toolCat] ?? []).map((d) => (
              <div
                key={d.name}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-window p-3.5"
              >
                <div>
                  <div className="text-[13px] font-semibold">{d.name}</div>
                  <p className="text-[11.5px] text-muted-foreground">{d.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RiskBadge risk={d.risk} />
                  <Btn size="sm" onClick={() => simulate(d.name)}>
                    Run
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle
          title="WHAT WILL CHANGE (OPTIMIZATION PREVIEW)"
          guide="tier.preview"
          sub="All applicable optimizations matching hardware tier criteria are automatically selected."
        />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Chips options={["ALL", "WINDOWS", "UEFI"]} value={scope} onChange={setScope} />
          <div className="flex flex-wrap items-center gap-1.5">
            <SelectionBar
              count={sel.size}
              total={tierSel.eligibleCount}
              moded={tierSel}
              title={t.name}
            />
          </div>
        </div>
        <div className="mb-3">
          <SearchBox
            placeholder="Search profile recommendations…"
            value={query}
            onChange={setQuery}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {vis.map((i) => (
            <div
              key={i.id}
              onClick={() => !i.done && tog(i.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 select-none transition-colors",
                !i.done ? "cursor-pointer hover:border-cyan/40 hover:bg-window/90" : "cursor-not-allowed opacity-75",
                sel.has(i.id) ? "border-cyan/40 bg-cyan/5" : "border-border bg-window",
              )}
            >
              <span
                className={cn(
                  "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                  i.done
                    ? "border-border bg-window text-subtle"
                    : sel.has(i.id)
                      ? "border-cyan bg-cyan text-sidebar-primary-foreground shadow-sm"
                      : "border-border-strong bg-window text-subtle",
                )}
                aria-hidden="true"
              >
                {i.done ? (
                  <Lock className="h-2.5 w-2.5" />
                ) : (
                  sel.has(i.id) && <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold">{i.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge>{i.cat}</Badge>
                  {i.done ? (
                    <Badge tone="muted">ALREADY APPLIED</Badge>
                  ) : sel.has(i.id) ? (
                    tierSel.mode === "CUSTOM" ? (
                      <Badge tone="cyan" className="text-[9.5px] font-bold">CUSTOM SELECTED</Badge>
                    ) : (
                      <Badge tone="success" className="text-[9.5px] font-bold">AUTO-SELECTED — ELIGIBLE</Badge>
                    )
                  ) : (
                    <Badge tone="muted">NOT SELECTED</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                <RiskBadge risk={i.risk} />
                <Btn size="sm" variant="ghost" onClick={() => setDetail(i)}>
                  Details
                </Btn>
              </div>
            </div>
          ))}
          {vis.length === 0 && (
            <p className="text-xs text-muted-foreground">No items in this scope.</p>
          )}
        </div>
      </Card>

      {t.toolbox === "bios" && (
        <Card>
          <SectionTitle
            title="MANUAL UEFI / FIRMWARE OPTIMIZATIONS"
            guide="tier.uefi"
            sub="These must be changed by you in firmware setup. Error Optimizer only guides and verifies."
            right={
              <Btn size="sm" variant="danger" onClick={() => simulate("Reboot to UEFI firmware")}>
                Reboot to UEFI firmware
              </Btn>
            }
          />
          <div className="space-y-2">
            {UEFI.map(([n, d]) => (
              <div key={n} className="rounded-lg border border-border bg-window p-3">
                <div className="text-[13px] font-semibold">{n}</div>
                <div className="text-[11.5px] text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="py-3">
        <div className="flex w-full items-center justify-between">
          <Label>ADVANCED LOGS & DIAGNOSTICS</Label>
          <span className="flex gap-1.5">
            <Btn size="sm" variant="ghost" onClick={() => simulate("Copy logs")}>
              Copy logs
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setLogsCleared(true)}>
              Clear
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setLogsOpen(!logsOpen)}>
              Expand / Collapse
            </Btn>
          </span>
        </div>
        {logsOpen && !logsCleared && (
          <pre className="mt-3 rounded-lg bg-background p-3 font-mono text-[11px] text-muted-foreground">
            [sim] {t.id} profile loaded · {t.entries} entries{"\n"}[sim] applicability evaluated at
            runtime in native app
          </pre>
        )}
      </Card>
      <SimNotice />

      <div className="sticky bottom-0 flex items-center justify-between border-t border-border">
        <span className="text-xs text-muted-foreground">
          Simulated profile run · Recovery support varies by operation.{" "}
          <b className="text-foreground">{sel.size}</b> selected
        </span>
        <Btn variant="primary" disabled={!sel.size} onClick={() => setRun(true)}>
          Apply {t.name}
        </Btn>
      </div>

      <Modal
        open={block}
        onClose={() => setBlock(false)}
        title="Customize bloatware blocklist"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setBlock(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={() => {
                setBlock(false);
                simulate("Save blocklist");
              }}
            >
              Save blocklist
            </Btn>
          </>
        }
      >
        <div className="mb-3 flex justify-end">
          <Btn
            size="sm"
            variant="ghost"
            onClick={() => setBlockSel(new Set(BLOCKLIST.slice(0, 7)))}
          >
            Reset defaults
          </Btn>
        </div>
        <div className="space-y-1.5">
          {BLOCKLIST.map((b) => (
            <div
              key={b}
              className="flex items-center gap-3 rounded-md border border-border bg-window px-3 py-2 font-mono text-xs"
            >
              <Check
                label={`Include ${b}`}
                on={blockSel.has(b)}
                onChange={() => setBlockSel((s) => toggleInSet(s, b))}
              />
              {b}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Selected packages will be processed during Custom Bloatware Removal.
        </p>
      </Modal>
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
        sub="Sample catalog entry · No machine state has been detected."
        footer={<Btn onClick={() => setDetail(null)}>Close</Btn>}
      >
        {detail && (
          <div className="space-y-3">
            <KV k="Category" v={detail.cat} />
            <KV k="Risk classification" v={<RiskBadge risk={detail.risk} />} />
            <KV k="Sample state" v={detail.done ? "Already optimized (demo)" : "Pending (demo)"} />
            <KV k="Applicability" v="Evaluated by native engine; not detected here" />
            <KV k="Restart requirement" v="Per-operation metadata required" />
            <Details>
              <KV k="Original operation identifier" v={detail.id} mono />
              <p className="mt-3 text-xs text-muted-foreground">
                Purpose, target values and readback rules must come from the original catalog; this
                sample does not infer them.
              </p>
            </Details>
          </div>
        )}
      </Modal>
      <RunModal
        open={run}
        onClose={() => setRun(false)}
        profile={t.name}
        count={sel.size}
        items={items
          .filter((i) => sel.has(i.id))
          .map((i) => ({ id: i.id, title: i.name, risk: i.risk }))}
      />
    </div>
  );
}

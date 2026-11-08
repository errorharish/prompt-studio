import { useState, useMemo, useEffect } from "react";
import { Sliders, AlertTriangle, Check, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import {
  Modal,
  Btn,
  Badge,
  RiskBadge,
  SearchBox,
  StatTiles,
  Chips,
} from "./kit";
import {
  type PlanCandidate,
  type Risk,
  getEligibilityStatus,
  isSelectable,
} from "@/lib/eo/selection";
import { cn } from "@/lib/utils";

interface CustomSelectionModalProps<T extends string | number> {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string | undefined;
  items: readonly PlanCandidate<T>[];
  selected: ReadonlySet<T>;
  onConfirm: (confirmed: Set<T>) => void;
}

function getItemTitle<T extends string | number>(item: PlanCandidate<T>): string {
  return item.name || item.title || item.t || item.n || String(item.id);
}

function getItemDesc<T extends string | number>(item: PlanCandidate<T>): string {
  return item.desc || item.d || item.why || item.note || "";
}

function getItemCategory<T extends string | number>(item: PlanCandidate<T>): string {
  return item.cat || item.category || item.group || "GENERAL";
}

function getItemRisk<T extends string | number>(item: PlanCandidate<T>): Risk {
  return item.risk || "LOW";
}

export function CustomSelectionModal<T extends string | number>({
  open,
  onClose,
  title,
  sub,
  items,
  selected,
  onConfirm,
}: CustomSelectionModalProps<T>) {
  // Working draft selection set inside the modal
  const [draft, setDraft] = useState<Set<T>>(() => new Set(selected));
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [filterRisk, setFilterRisk] = useState<"ALL" | "SAFE_LOW" | "HIGH">("ALL");

  // Keep draft in sync when modal opens
  useEffect(() => {
    if (open) {
      setDraft(new Set(selected));
      setQuery("");
      setSelectedCat("ALL");
      setFilterRisk("ALL");
    }
  }, [open, selected]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const c = getItemCategory(item);
      if (c && c !== "GENERAL") set.add(c);
    }
    return set.size > 1 ? ["ALL", ...Array.from(set)] : [];
  }, [items]);

  // Overall metrics
  const stats = useMemo(() => {
    let eligible = 0;
    let highRiskEligible = 0;
    let highRiskSelected = 0;

    for (const item of items) {
      const status = getEligibilityStatus(item, draft);
      if (status.eligible) {
        eligible++;
        if (item.risk === "HIGH") highRiskEligible++;
      }
      if (draft.has(item.id) && item.risk === "HIGH") {
        highRiskSelected++;
      }
    }

    return {
      available: items.length,
      eligible,
      highRiskEligible,
      highRiskSelected,
      selected: draft.size,
    };
  }, [items, draft]);

  // Filtered rows for display
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const cat = getItemCategory(item);
      if (selectedCat !== "ALL" && cat !== selectedCat) return false;

      const risk = getItemRisk(item);
      if (filterRisk === "HIGH" && risk !== "HIGH") return false;
      if (filterRisk === "SAFE_LOW" && risk !== "SAFE" && risk !== "LOW") return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        const t = getItemTitle(item).toLowerCase();
        const d = getItemDesc(item).toLowerCase();
        if (!t.includes(q) && !d.includes(q)) return false;
      }

      return true;
    });
  }, [items, selectedCat, filterRisk, query]);

  const handleToggle = (id: T, selectable: boolean) => {
    if (!selectable) return;
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllEligible = () => {
    const next = new Set<T>();
    for (const item of items) {
      const status = getEligibilityStatus(item);
      if (status.eligible) {
        next.add(item.id);
      }
    }
    setDraft(next);
  };

  const handleClear = () => {
    setDraft(new Set());
  };

  const handleResetToDefault = () => {
    const next = new Set<T>();
    for (const item of items) {
      const status = getEligibilityStatus(item);
      if (status.eligible) {
        next.add(item.id);
      }
    }
    setDraft(next);
  };

  const handleConfirm = () => {
    onConfirm(draft);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${title} — Custom Selection`}
      sub={
        sub ??
        "Customize which optimizations to run. Eligible options are selected by default; high-risk options require safety review."
      }
      icon={<Sliders className="h-4 w-4 text-cyan" />}
      width="max-w-3xl"
      tone="cyan"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-muted-foreground">
            <b className="text-foreground tabular-nums font-bold">{draft.size}</b> of{" "}
            {items.length} selected
            {stats.highRiskSelected > 0 && (
              <span className="ml-1.5 font-semibold text-warning">
                ({stats.highRiskSelected} high-risk)
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" onClick={onClose}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={handleConfirm}>
              Confirm Selection ({draft.size})
            </Btn>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Top Summary Metrics */}
        <StatTiles
          items={[
            {
              label: "AVAILABLE",
              value: stats.available,
              sub: "Module catalog items",
            },
            {
              label: "ELIGIBLE",
              value: stats.eligible,
              sub: "Hardware verified",
              tone: "success",
            },
            {
              label: "SELECTED",
              value: stats.selected,
              sub: "In custom scope",
              tone: "cyan",
            },
            {
              label: "HIGH-RISK SELECTED",
              value: stats.highRiskSelected,
              sub: stats.highRiskSelected > 0 ? "Explicit review required" : "Zero high-risk",
              tone: stats.highRiskSelected > 0 ? "warning" : "muted",
            },
          ]}
        />

        {/* High-Risk Active Banner */}
        {stats.highRiskSelected > 0 && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {stats.highRiskSelected} HIGH-RISK OPTIMIZATION
                {stats.highRiskSelected === 1 ? "" : "S"} SELECTED
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              High-risk optimizations tune core kernel threads or driver power states. They are fully
              supported, but will require explicit safety acknowledgement during Review & Optimize.
            </p>
          </div>
        )}

        {/* Batch Actions & Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-window/60 p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Btn size="sm" variant="ghost" onClick={handleSelectAllEligible}>
              <Check className="h-3 w-3 mr-1 text-success" />
              Select All Eligible ({stats.eligible})
            </Btn>
            <Btn size="sm" variant="ghost" onClick={handleClear}>
              Clear Selection
            </Btn>
            <Btn size="sm" variant="ghost" onClick={handleResetToDefault}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset to Default
            </Btn>
          </div>
          <div className="w-56 min-w-[200px]">
            <SearchBox
              placeholder="Filter optimizations…"
              value={query}
              onChange={setQuery}
            />
          </div>
        </div>

        {/* Category Filter Chips if available */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Category:
            </span>
            <Chips options={categories} value={selectedCat} onChange={setSelectedCat} />
          </div>
        )}

        {/* Scrollable Item Rows */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
          {filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No optimization items match your search filter.
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = getEligibilityStatus(item, draft);
              const isChecked = draft.has(item.id);
              const selectable = isSelectable(item) && !item.done && item.status !== "ALREADY_CLEAN";
              const titleText = getItemTitle(item);
              const descText = getItemDesc(item);
              const risk = getItemRisk(item);
              const cat = getItemCategory(item);

              return (
                <div
                  key={String(item.id)}
                  onClick={() => selectable && handleToggle(item.id, selectable)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    selectable
                      ? "cursor-pointer hover:border-cyan/50 hover:bg-window/90"
                      : "cursor-not-allowed opacity-70",
                    isChecked
                      ? "border-cyan/40 bg-cyan/5"
                      : "border-border bg-window/50",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                      !selectable
                        ? "border-border bg-window text-subtle"
                        : isChecked
                          ? "border-cyan bg-cyan text-sidebar-primary-foreground shadow-sm"
                          : "border-border-strong bg-window text-subtle",
                    )}
                  >
                    {!selectable ? (
                      <Lock className="h-2.5 w-2.5" />
                    ) : (
                      isChecked && <Check className="h-3 w-3" strokeWidth={3.5} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[12.5px] font-semibold text-foreground">
                        {titleText}
                      </span>
                      {item.size && (
                        <span className="text-[11px] font-mono text-cyan">
                          ({item.size})
                        </span>
                      )}
                    </div>
                    {descText && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {descText}
                      </p>
                    )}
                    {status.reason && !status.eligible && (
                      <p className="mt-1 text-[10.5px] font-medium text-warning">
                        • {status.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <RiskBadge risk={risk} />
                      <Badge tone={status.badgeTone} className="text-[9.5px] font-bold">
                        {status.statusText}
                      </Badge>
                    </div>
                    {cat && cat !== "GENERAL" && (
                      <Badge tone="muted" className="text-[9px] uppercase">
                        {cat}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}

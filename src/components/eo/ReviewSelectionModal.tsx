// Grouped review of the selected 1-Click recommendations before a simulated run.
// Shared by the 1-Click page and the Dashboard Auto Optimize panel.
import { X } from "lucide-react";
import { Badge, Btn, EmptyState, Modal, RiskBadge } from "./kit";
import { ONE_CLICK_GROUPS } from "@/lib/eo/data";
import type { SelectionSummary } from "@/lib/eo/selection";
import type { RunItem } from "./RunModal";
import { cn } from "@/lib/utils";

export function ReviewSelectionModal({
  open,
  onClose,
  onConfirm,
  items,
  summary,
  onRemove: _onRemove,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: (RunItem & { group: string })[];
  summary: SelectionSummary;
  onRemove?: ((id: string) => void) | undefined;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review your changes"
      sub="Simulated run · No Windows settings will be changed."
      width="max-w-3xl"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Back to edit
          </Btn>
          <Btn variant="primary" disabled={!items.length} onClick={onConfirm}>
            Confirm simulated run
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              ["SELECTED", summary.total, "text-foreground"],
              ["SAFE", summary.byRisk.SAFE, "text-success"],
              ["LOW RISK", summary.byRisk.LOW, "text-success"],
              ["NEEDS RESTART", summary.restart, "text-warning"],
            ] as const
          ).map(([k, v, c]) => (
            <div key={k} className="rounded-lg border border-border bg-window p-2.5 text-center">
              <div className={cn("text-xl font-bold tabular-nums", c)}>{v}</div>
              <div className="text-[9px] font-bold text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>
        {!items.length && (
          <EmptyState
            title="Nothing selected"
            sub="Go back and select at least one recommendation."
          />
        )}
        {ONE_CLICK_GROUPS.filter((g) => items.some((a) => a.group === g.key)).map((g) => (
          <section key={g.key} aria-label={g.key}>
            <h3 className="mb-1.5 eo-label text-[10px] text-cyan">{g.key}</h3>
            <ul className="space-y-1.5">
              {items
                .filter((a) => a.group === g.key)
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 eo-list-row rounded-lg border border-border bg-window px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 font-medium">{a.title}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <RiskBadge risk={a.risk} />
                      {a.restart && <Badge tone="warning">RESTART</Badge>}
                      <Badge tone="success" className="text-[10px] font-semibold">
                        AUTO-SELECTED — ELIGIBLE
                      </Badge>
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
        {summary.restart > 0 && (
          <p className="rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-[11.5px] text-warning">
            {summary.restart} selected item{summary.restart === 1 ? "" : "s"} would need a Windows
            restart in the native app.
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          This demonstration does not establish real verification or rollback availability.
        </p>
      </div>
    </Modal>
  );
}

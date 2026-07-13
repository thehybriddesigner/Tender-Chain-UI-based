import * as React from "react";
import { cn } from "@/lib/utils";
import { countdown } from "@/lib/format";
import { useCountdownTick } from "@/hooks/use-tenders";
import type { TenderStatus } from "@/lib/types";

const STATUS_STYLES: Record<TenderStatus, { label: string; className: string }> = {
  Open: {
    label: "Open",
    className: "bg-success/15 text-success-foreground border-success/40",
  },
  UnderEvaluation: {
    label: "Under Evaluation",
    className: "bg-info/15 text-info-foreground border-info/40",
  },
  Finalized: {
    label: "Awarded",
    className: "bg-primary/15 text-primary border-primary/40",
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

export function StatusBadge({ status, className }: { status: TenderStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.className,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  );
}

export function CountdownTimer({
  deadline,
  className,
  compact = false,
}: {
  deadline: number;
  className?: string;
  compact?: boolean;
}) {
  const now = useCountdownTick(1000);
  const c = React.useMemo(() => countdown(deadline, now), [deadline, now]);

  if (compact) {
    return (
      <span className={cn("font-mono text-xs", c.closed ? "text-muted-foreground" : "text-foreground", className)}>
        {c.label}
      </span>
    );
  }

  if (c.closed) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <span className="size-1.5 rounded-full bg-muted-foreground" /> Bidding closed
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 font-mono", className)}>
      <TimeCell value={c.days} label="d" />
      <TimeCell value={c.hours} label="h" />
      <TimeCell value={c.minutes} label="m" />
      <TimeCell value={c.seconds} label="s" />
    </div>
  );
}

function TimeCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-border bg-card px-2.5 py-1.5 min-w-[3rem]">
      <span className="text-lg font-semibold leading-none tabular-nums text-foreground">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

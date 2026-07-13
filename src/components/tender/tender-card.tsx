import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge, CountdownTimer } from "./status-badge";
import { formatNpr } from "@/lib/format";
import type { Tender, TenderMeta } from "@/lib/types";

interface Props {
  tender: Tender;
  meta?: TenderMeta | null;
  bidCount?: number;
}

export function TenderCard({ tender, meta, bidCount }: Props) {
  return (
    <Link
      to="/tenders/$tenderId"
      params={{ tenderId: tender.tenderId }}
      className="group block"
    >
      <Card className="h-full transition-all hover:border-primary/60 hover:shadow-md">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <StatusBadge status={tender.status} />
            {meta && (
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {meta.category}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
              {tender.title}
            </h3>
            {meta && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Building2 className="size-3" /> {meta.department}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {meta.location}</span>
              </div>
            )}
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</div>
              <div className="mt-0.5 font-semibold">{meta ? formatNpr(meta.budgetNpr) : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {tender.status === "Open" ? "Closes in" : "Deadline"}
              </div>
              <div className="mt-0.5 font-semibold">
                <CountdownTimer deadline={tender.deadline} compact />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Bids</div>
              <div className="mt-0.5 font-semibold">{bidCount ?? 0}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-muted-foreground">
              Price {tender.priceWeight}% · Timeline {tender.timelineWeight}%
              {tender.qualityWeight > 0 ? ` · Quality ${tender.qualityWeight}%` : ""}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="size-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

import { Trophy } from "lucide-react";
import { formatNpr, truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Bid, Tender } from "@/lib/types";

interface Props {
  tender: Tender;
  bids: Bid[];
}

export function RankedBidsTable({ tender, bids }: Props) {
  const sorted = [...bids].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 font-medium">Rank</th>
              <th className="px-4 py-2 font-medium">Bidder wallet</th>
              <th className="px-4 py-2 font-medium">Price (NPR)</th>
              <th className="px-4 py-2 font-medium">Timeline</th>
              <th className="px-4 py-2 font-medium">Quality cert</th>
              <th className="px-4 py-2 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b, i) => {
              const isWinner = tender.winner === b.bidder;
              return (
                <tr
                  key={b.bidder}
                  className={cn(
                    "border-t border-border",
                    isWinner && "bg-success/10",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold">
                      {isWinner ? <Trophy className="size-4 text-success-foreground" /> : null}
                      #{i + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{truncateAddress(b.bidder)}</div>
                    {b.bidderName && (
                      <div className="text-xs text-muted-foreground">{b.bidderName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatNpr(b.price)}</td>
                  <td className="px-4 py-3">{b.timelineDays} days</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{b.qualityCert || "—"}</span>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Self-reported
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={cn("font-mono font-semibold", isWinner && "text-success-foreground")}>
                      {b.score !== null ? b.score.toFixed(2) : "—"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { ExternalLink } from "lucide-react";
import { explorerUrl, formatDateTime, truncateAddress } from "@/lib/format";
import type { AuditEntry } from "@/lib/types";

const ACTION_LABEL: Record<AuditEntry["action"], string> = {
  TenderPublished: "Tender published",
  BidSubmitted: "Bid submitted",
  TenderFinalized: "Tender finalized",
  WinnerAnnounced: "Winner announced",
  TenderCancelled: "Tender cancelled",
};

const ACTION_COLOR: Record<AuditEntry["action"], string> = {
  TenderPublished: "text-primary",
  BidSubmitted: "text-info-foreground",
  TenderFinalized: "text-foreground",
  WinnerAnnounced: "text-success-foreground",
  TenderCancelled: "text-destructive",
};

export function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No on-chain actions yet.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-secondary px-4 py-3 text-xs font-medium text-secondary-foreground">
        All actions are recorded on-chain and cannot be tampered with. Every row is
        independently verifiable on Solana Explorer.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Performed by</th>
              <th className="px-4 py-2 font-medium">Transaction</th>
              <th className="px-4 py-2 font-medium">Timestamp</th>
              <th className="px-4 py-2 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className={"font-medium " + ACTION_COLOR[e.action]}>
                    {ACTION_LABEL[e.action]}
                  </div>
                  {e.detail && (
                    <div className="text-xs text-muted-foreground">{e.detail}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs">{truncateAddress(e.performedBy)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {truncateAddress(e.signature, 6, 6)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateTime(e.timestamp)}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={explorerUrl(e.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Explorer <ExternalLink className="size-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

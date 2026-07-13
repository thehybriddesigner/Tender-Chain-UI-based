// Vertical audit timeline — mirrors the Product Proposal's flow:
// Tender Published → Formula Locked → Bid Submitted → Bid Verified →
// Deadline Closed → Winner Calculated → Tender Finalized. Renders the
// mock audit entries as a human-readable ledger for non-technical viewers.
import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Hourglass, XCircle } from "lucide-react";
import { formatDateTime, truncateAddress, explorerUrl } from "@/lib/format";
import type { AuditEntry, Tender } from "@/lib/types";

interface Step {
  key: string;
  label: string;
  description: string;
  status: "done" | "current" | "pending" | "cancelled";
  timestamp?: number;
  signature?: string;
  by?: string;
}

function stepsFor(tender: Tender, audits: AuditEntry[]): Step[] {
  const now = Date.now();
  const cancelled = tender.status === "Cancelled";
  const finalized = tender.status === "Finalized";
  const deadlinePassed = now >= tender.deadline;

  const published = audits.find((a) => a.action === "TenderPublished");
  const bids = audits.filter((a) => a.action === "BidSubmitted");
  const finalize = audits.find((a) => a.action === "TenderFinalized");
  const winner = audits.find((a) => a.action === "WinnerAnnounced");
  const cancel = audits.find((a) => a.action === "TenderCancelled");

  return [
    {
      key: "publish",
      label: "Tender published",
      description: "Recorded on-chain. Anyone can now inspect the tender.",
      status: "done",
      timestamp: published?.timestamp ?? tender.publishedAt,
      signature: published?.signature,
      by: tender.authority,
    },
    {
      key: "formula",
      label: "Scoring formula locked",
      description: `Price ${tender.priceWeight}% · Timeline ${tender.timelineWeight}%${tender.qualityWeight > 0 ? ` · Quality ${tender.qualityWeight}%` : ""} — cannot be changed after this point.`,
      status: "done",
      timestamp: published?.timestamp ?? tender.publishedAt,
    },
    {
      key: "bids",
      label:
        bids.length === 0
          ? "Awaiting bids"
          : `${bids.length} bid${bids.length === 1 ? "" : "s"} submitted`,
      description:
        bids.length === 0
          ? "Bids will appear here as they're written to the ledger."
          : "Each bid is a signed PDA account, immutable and public.",
      status: bids.length > 0 ? "done" : "current",
      timestamp: bids.at(-1)?.timestamp,
    },
    {
      key: "verify",
      label: "Bids verified",
      description:
        "Program-derived addresses confirm each bid was signed by its bidder wallet.",
      status: bids.length > 0 ? "done" : "pending",
    },
    {
      key: "deadline",
      label: deadlinePassed ? "Bidding closed" : "Bidding open",
      description: deadlinePassed
        ? "The deadline has passed — no further bids can be accepted."
        : "Bidding remains open until the on-chain deadline is reached.",
      status: deadlinePassed ? "done" : "current",
      timestamp: tender.deadline,
    },
    {
      key: "compute",
      label: "Winner calculated",
      description: "Locked formula runs on-chain against every eligible bid.",
      status: finalized ? "done" : cancelled ? "cancelled" : "pending",
      timestamp: winner?.timestamp,
      signature: winner?.signature,
    },
    {
      key: "finalize",
      label: cancelled ? "Tender cancelled" : "Tender finalized",
      description: cancelled
        ? "The authority withdrew the tender. The cancellation itself is logged publicly."
        : "Result is written on-chain. Anyone can independently recompute it.",
      status: cancelled ? "cancelled" : finalized ? "done" : "pending",
      timestamp: cancel?.timestamp ?? finalize?.timestamp,
      signature: cancel?.signature ?? finalize?.signature,
    },
  ];
}

export function AuditTimeline({
  tender,
  audits,
}: {
  tender: Tender;
  audits: AuditEntry[];
}) {
  const steps = stepsFor(tender, audits);

  return (
    <ol className="relative ml-3 border-l-2 border-border/70">
      {steps.map((s, i) => (
        <motion.li
          key={s.key}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
          className="relative pb-6 pl-6 last:pb-0"
        >
          <StepDot status={s.status} />
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h4 className="font-semibold text-foreground">{s.label}</h4>
            {s.timestamp && (
              <span className="text-xs text-muted-foreground">
                {formatDateTime(s.timestamp)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {s.by && (
              <span className="font-mono">
                by {truncateAddress(s.by)}
              </span>
            )}
            {s.signature && (
              <a
                href={explorerUrl(s.signature)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:underline"
              >
                tx {truncateAddress(s.signature, 6, 6)} ↗
              </a>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

function StepDot({ status }: { status: Step["status"] }) {
  const cls =
    status === "done"
      ? "bg-success text-success-foreground"
      : status === "current"
        ? "bg-primary text-primary-foreground animate-pulse"
        : status === "cancelled"
          ? "bg-destructive text-destructive-foreground"
          : "bg-muted text-muted-foreground";
  const Icon =
    status === "done"
      ? CheckCircle2
      : status === "current"
        ? Hourglass
        : status === "cancelled"
          ? XCircle
          : Clock;
  return (
    <span
      aria-hidden
      className={
        "absolute -left-[13px] top-0 grid size-6 place-items-center rounded-full ring-4 ring-background " +
        cls
      }
    >
      <Icon className="size-3.5" />
    </span>
  );
}

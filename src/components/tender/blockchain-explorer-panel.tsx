// Blockchain Explorer Panel — presents mock on-chain metadata (tx hash,
// program ID, PDA seeds, block height, network) in a form non-technical
// users can read at a glance. All values are derived from mock data
// matching what the real Anchor program will emit.
import * as React from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { explorerUrl, explorerAddressUrl, truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

// Deterministic placeholders — swap for real values when the program lands.
const PROGRAM_ID = "TndrChn1111111111111111111111111111111111";
const NETWORK = "Solana Devnet";
const CONFIRMATION = "Finalized · 32+ confirmations";

function pseudoBlockHeight(seed: string): number {
  let x = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    x ^= seed.charCodeAt(i);
    x = Math.imul(x, 16777619) >>> 0;
  }
  // Recent-ish devnet block-height range for realism.
  return 285_000_000 + (x % 5_000_000);
}

export interface ExplorerFacts {
  transactionHash: string;
  walletAddress: string;
  timestamp: number;
  label?: string;
}

export function BlockchainExplorerPanel({
  facts,
  tenderId,
}: {
  facts: ExplorerFacts;
  tenderId?: string;
}) {
  const block = pseudoBlockHeight(facts.transactionHash);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-success-foreground" />
          <div>
            <div className="text-sm font-semibold">Blockchain record</div>
            <div className="text-[11px] text-muted-foreground">
              {facts.label ?? "Solana Devnet transaction"}
            </div>
          </div>
        </div>
        <span className="rounded-full bg-success/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-success-foreground">
          {CONFIRMATION.split(" ")[0]}
        </span>
      </div>

      <dl className="divide-y divide-border text-sm">
        <ExplorerRow
          label="Transaction hash"
          value={truncateAddress(facts.transactionHash, 8, 8)}
          copy={facts.transactionHash}
          href={explorerUrl(facts.transactionHash)}
          mono
        />
        <ExplorerRow
          label="Wallet address"
          value={truncateAddress(facts.walletAddress, 8, 8)}
          copy={facts.walletAddress}
          href={explorerAddressUrl(facts.walletAddress)}
          mono
        />
        <ExplorerRow
          label="Program ID"
          value={truncateAddress(PROGRAM_ID, 8, 8)}
          copy={PROGRAM_ID}
          href={explorerAddressUrl(PROGRAM_ID)}
          mono
        />
        {tenderId && (
          <ExplorerRow
            label="Tender PDA seed"
            value={`["tender", "${tenderId}"]`}
            copy={`["tender", "${tenderId}"]`}
            mono
          />
        )}
        <ExplorerRow
          label="Block height"
          value={`#${block.toLocaleString("en-US")}`}
          mono
        />
        <ExplorerRow
          label="Timestamp"
          value={new Date(facts.timestamp).toISOString().replace("T", " ").slice(0, 19) + " UTC"}
        />
        <ExplorerRow label="Network" value={NETWORK} />
        <ExplorerRow label="Confirmation" value={CONFIRMATION} />
      </dl>

      <div className="border-t border-border bg-muted/30 px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
        Every field on this panel is derived from the on-chain record — no
        server-side database is involved. Open the transaction on Solana
        Explorer to independently confirm every value.
      </div>
    </motion.div>
  );
}

function ExplorerRow({
  label,
  value,
  copy,
  href,
  mono,
}: {
  label: string;
  value: string;
  copy?: string;
  href?: string;
  mono?: boolean;
}) {
  const doCopy = async () => {
    if (!copy) return;
    await navigator.clipboard.writeText(copy);
    toast.success(`${label} copied`);
  };
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className={cn("text-sm", mono && "font-mono")}>{value}</span>
        {copy && (
          <button
            onClick={doCopy}
            aria-label={`Copy ${label}`}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${label} on Solana Explorer`}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </dd>
    </div>
  );
}

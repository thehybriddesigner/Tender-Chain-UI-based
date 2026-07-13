import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicKey } from "@solana/web3.js";
import {
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  Copy,
  ArrowRight,
  ScrollText,
  Layers,
  ListChecks,
  Boxes,
  FileText,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge, CountdownTimer } from "@/components/tender/status-badge";
import { ScoringFormulaWidget } from "@/components/tender/scoring-formula-widget";
import { RankedBidsTable } from "@/components/tender/ranked-bids-table";
import { AuditLogTable } from "@/components/tender/audit-log-table";
import { AuditTimeline } from "@/components/tender/audit-timeline";
import { BlockchainExplorerPanel } from "@/components/tender/blockchain-explorer-panel";
import { useTender } from "@/hooks/use-tenders";
import { useWallet } from "@/components/wallet/wallet-provider";
import { tenderService } from "@/lib/tender-service";
import { formatDate, formatNpr, truncateAddress, explorerAddressUrl } from "@/lib/format";
import { toast } from "sonner";

type Tab = "overview" | "requirements" | "timeline" | "documents" | "bids" | "audit" | "blockchain";

interface DetailSearch {
  tab?: Tab;
}

export const Route = createFileRoute("/tenders/$tenderId")({
  validateSearch: (s: Record<string, unknown>): DetailSearch => ({
    tab: (s.tab as Tab) || "overview",
  }),
  loader: ({ params }) => ({ tenderId: params.tenderId }),
  head: () => ({
    meta: [
      { title: "Tender — TenderChain" },
      {
        name: "description",
        content:
          "Public tender on TenderChain — locked formula, tamper-evident bids, verifiable outcome.",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-2xl font-semibold">Tender not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This tender ID doesn't exist on TenderChain.
      </p>
      <Button asChild className="mt-6">
        <Link to="/tenders">Back to all tenders</Link>
      </Button>
    </div>
  ),
  component: TenderDetail,
});

function TenderDetail() {
  const { tenderId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const wallet = useWallet();
  const { data, isLoading } = useTender(tenderId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md py-24 text-center text-sm text-muted-foreground">
        Loading tender…
      </div>
    );
  }
  if (!data || !data.tender) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-2xl font-semibold">Tender not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This tender ID doesn't exist on TenderChain.
        </p>
        <Button asChild className="mt-6">
          <Link to="/tenders">Back to all tenders</Link>
        </Button>
      </div>
    );
  }

  const { tender, meta, bids, audits } = data;
  const bidCount = bids.length;
  const isOpen = tender.status === "Open";
  const winnerBid = tender.winner ? bids.find((b) => b.bidder === tender.winner) : null;

  const setTab = (t: Tab) =>
    navigate({ search: (prev: DetailSearch) => ({ ...prev, tab: t }), replace: true });

  const copyAuthority = async () => {
    await navigator.clipboard.writeText(tender.authority);
    toast.success("Authority address copied");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <StatusBadge status={tender.status} />
            <span className="text-xs font-mono text-muted-foreground">
              Tender ID · {tender.tenderId}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">{tender.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{tender.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <MetaCell icon={Building2} label="Department" value={meta?.department} />
            <MetaCell icon={MapPin} label="Location" value={meta?.location} />
            <MetaCell icon={Layers} label="Category" value={meta?.category} />
            <MetaCell icon={Calendar} label="Published" value={formatDate(tender.publishedAt)} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {isOpen ? "Closes in" : "Deadline"}
              </div>
              <div className="mt-1">
                {isOpen ? (
                  <CountdownTimer deadline={tender.deadline} />
                ) : (
                  <span className="text-sm font-medium">{formatDate(tender.deadline)}</span>
                )}
              </div>
            </div>
            {meta && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Budget (NPR)
                </div>
                <div className="mt-1 text-xl font-bold">{formatNpr(meta.budgetNpr)}</div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Authority</span>
            <button
              onClick={copyAuthority}
              className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono hover:bg-accent"
            >
              {truncateAddress(tender.authority)} <Copy className="size-3" />
            </button>
            <a
              href={explorerAddressUrl(tender.authority)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              Explorer <ExternalLink className="size-3" />
            </a>
          </div>

          {isOpen && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tenders/$tenderId/bid"
                params={{ tenderId: tender.tenderId }}
                className={buttonVariants({ size: "lg" })}
              >
                Submit Bid <ArrowRight className="ml-1 size-4" />
              </Link>
              <Button asChild variant="outline" size="lg">
                <Link to="/tenders/$tenderId/audit" params={{ tenderId: tender.tenderId }}>
                  <ScrollText className="mr-1 size-4" /> View audit log
                </Link>
              </Button>
              {wallet.publicKey === tender.authority && Date.now() > tender.deadline && (
                <FinalizeButton tenderId={tender.tenderId} />
              )}
            </div>
          )}

          {tender.status === "Finalized" && winnerBid && (
            <div className="mt-8 rounded-xl border border-success/40 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-success-foreground" /> Winner announced
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-mono">{truncateAddress(winnerBid.bidder)}</span>
                <span className="text-muted-foreground">
                  Bid {formatNpr(winnerBid.price)} · {winnerBid.timelineDays} days · Score{" "}
                  <span className="font-mono font-semibold">{winnerBid.score?.toFixed(2)}</span>
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Result was computed by the locked formula, on-chain. Anyone can independently
                recompute this from the public data.
              </p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[340px] shrink-0">
          <ScoringFormulaWidget
            priceWeight={tender.priceWeight}
            timelineWeight={tender.timelineWeight}
            qualityWeight={tender.qualityWeight}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab ?? "overview"} onValueChange={(v) => setTab(v as Tab)} className="mt-10">
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="overview">
            <FileText className="mr-1 size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="requirements">
            <ListChecks className="mr-1 size-4" /> Requirements
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Calendar className="mr-1 size-4" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Boxes className="mr-1 size-4" /> Documents
          </TabsTrigger>
          <TabsTrigger value="bids">
            <Users className="mr-1 size-4" /> Bids ({bidCount})
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText className="mr-1 size-4" /> Audit Log
          </TabsTrigger>
          <TabsTrigger value="blockchain">
            <ShieldCheck className="mr-1 size-4" /> Blockchain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Section title="Description">
                <p className="text-sm text-foreground/90">{tender.description}</p>
              </Section>
              {meta && (
                <Section title="Scope of work">
                  <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    {meta.scopeOfWork.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </Section>
              )}
              {meta && (
                <Section title="Eligibility criteria">
                  <ul className="space-y-1.5 text-sm">
                    {meta.eligibility.map((e, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
            <aside className="space-y-4">
              <Section title="Key dates">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Published</dt>
                    <dd>{formatDate(tender.publishedAt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Deadline</dt>
                    <dd>{formatDate(tender.deadline)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <StatusBadge status={tender.status} />
                    </dd>
                  </div>
                </dl>
              </Section>
              <Section title="On-chain identifiers">
                <div className="space-y-2 text-xs">
                  <Row label="Tender ID" value={tender.tenderId} mono />
                  <Row label="Authority" value={truncateAddress(tender.authority)} mono />
                  {tender.winner && (
                    <Row label="Winner" value={truncateAddress(tender.winner)} mono />
                  )}
                </div>
              </Section>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="mt-6">
          <Section title="Requirements & eligibility">
            {meta ? (
              <ul className="space-y-2 text-sm">
                {meta.eligibility.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {e}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No requirements defined.</p>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Section title="Timeline">
            <ol className="space-y-4 border-l border-border pl-6 text-sm">
              <TimelineItem label="Tender published" date={formatDate(tender.publishedAt)} />
              <TimelineItem label="Bidding open" date="Ongoing" active={isOpen} />
              <TimelineItem label="Bidding closes" date={formatDate(tender.deadline)} />
              <TimelineItem
                label="Finalization"
                date={tender.status === "Finalized" ? "Complete" : "Pending"}
                active={tender.status === "Finalized"}
              />
            </ol>
          </Section>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Section title="Documents required">
            {meta && meta.documentsRequired.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {meta.documentsRequired.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <FileText className="size-4 text-muted-foreground" /> {d}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No document requirements specified.</p>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="bids" className="mt-6">
          {bids.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No bids submitted yet. Be the first — submit one from this page.
            </div>
          ) : tender.status === "Finalized" ? (
            <RankedBidsTable tender={tender} bids={bids} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
                Scores are only computed once bidding closes and the locked formula runs on-chain
                via <code className="font-mono">finalize_tender</code>. Bids are shown below to
                prove the ledger is public.
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2">Bidder wallet</th>
                      <th className="px-4 py-2">Price (NPR)</th>
                      <th className="px-4 py-2">Timeline</th>
                      <th className="px-4 py-2">Quality cert (self-reported)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((b) => (
                      <tr key={b.bidder} className="border-t border-border">
                        <td className="px-4 py-3 font-mono text-xs">{truncateAddress(b.bidder)}</td>
                        <td className="px-4 py-3 font-semibold">{formatNpr(b.price)}</td>
                        <td className="px-4 py-3">{b.timelineDays} days</td>
                        <td className="px-4 py-3 text-xs">{b.qualityCert || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Lifecycle timeline
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Every step is a real on-chain transaction — click any tx hash to open Solana
                Explorer.
              </p>
              <div className="mt-6">
                <AuditTimeline tender={tender} audits={audits} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Raw ledger
              </h2>
              <div className="mt-6">
                <AuditLogTable entries={audits} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="blockchain" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <BlockchainExplorerPanel
              facts={{
                transactionHash:
                  audits.find((a) => a.action === "TenderPublished")?.signature ?? tender.tenderId,
                walletAddress: tender.authority,
                timestamp: tender.publishedAt,
                label: "Tender publication — origin transaction",
              }}
              tenderId={tender.tenderId}
            />
            <div className="space-y-6">
              <Section title="What the blockchain guarantees">
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> The scoring
                    formula was locked before any bid was accepted.
                  </li>
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Every bid is
                    signed by its bidder wallet — no anonymous submissions.
                  </li>
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> The winning bid
                    is computed on-chain and is fully reproducible.
                  </li>
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Cancellations
                    are logged publicly — you can't unpublish a tender.
                  </li>
                </ul>
              </Section>
              <Section title="Verify independently">
                <p className="text-sm text-muted-foreground">
                  Copy the tender PDA seed, look up the account on Solana Explorer, and re-run the
                  locked formula against every bid PDA. The result must match the on-chain winner.
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link to="/tenders/$tenderId/audit" params={{ tenderId: tender.tenderId }}>
                      Open full audit log
                    </Link>
                  </Button>
                </div>
              </Section>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetaCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-1.5 last:border-none">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-right break-all" : "text-right"}>{value}</span>
    </div>
  );
}

function TimelineItem({ label, date, active }: { label: string; date: string; active?: boolean }) {
  return (
    <li className="relative">
      <span
        className={
          "absolute -left-[29px] top-1 size-3 rounded-full border-2 " +
          (active ? "border-primary bg-primary" : "border-border bg-background")
        }
      />
      <div className="font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{date}</div>
    </li>
  );
}

function FinalizeButton({ tenderId }: { tenderId: string }) {
  const [busy, setBusy] = React.useState(false);
  const { program, publicKey } = useWallet();
  const onClick = async () => {
    if (!program || !publicKey) return;
    setBusy(true);
    try {
      await tenderService.finalizeTender(program, new PublicKey(publicKey), tenderId);
      toast.success("Tender finalized on-chain");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Finalize failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="secondary" onClick={onClick} disabled={busy}>
      {busy ? "Finalizing…" : "Finalize & Publish Result"}
    </Button>
  );
}

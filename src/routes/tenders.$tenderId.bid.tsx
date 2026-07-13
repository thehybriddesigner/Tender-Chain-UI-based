import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicKey } from "@solana/web3.js";
import {
  ArrowLeft,
  ArrowRight,
  Info,
  Upload,
  ShieldAlert,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, CountdownTimer } from "@/components/tender/status-badge";
import { ScoringFormulaWidget } from "@/components/tender/scoring-formula-widget";
import { BlockchainExplorerPanel } from "@/components/tender/blockchain-explorer-panel";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useTender } from "@/hooks/use-tenders";
import { tenderService } from "@/lib/tender-service";
import { formatNpr, truncateAddress } from "@/lib/format";
import type { Bid } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tenders/$tenderId/bid")({
  loader: ({ params }) => ({ tenderId: params.tenderId }),
  head: () => ({
    meta: [
      { title: "Submit Bid — TenderChain" },
      {
        name: "description",
        content:
          "Submit a tamper-evident bid on TenderChain. Your bid is tied to your wallet address.",
      },
    ],
  }),
  component: SubmitBidPage,
});

const STEPS = [
  { key: "info", label: "Bid Information" },
  { key: "documents", label: "Upload Documents" },
  { key: "review", label: "Review & Submit" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

function SubmitBidPage() {
  const { tenderId } = Route.useParams();
  const wallet = useWallet();
  const { data, isLoading } = useTender(tenderId);

  // ALL hooks must be declared before any early return — fixes a Rules-of-Hooks
  // violation in the original version, where this was declared after a return.
  const [step, setStep] = React.useState<StepKey>("info");
  const [form, setForm] = React.useState({
    price: "",
    timelineDays: "",
    qualityCert: "",
    notes: "",
    documents: [] as string[],
  });
  const [busy, setBusy] = React.useState(false);
  const [submittedBid, setSubmittedBid] = React.useState<Bid | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const priceNum = parseInt(form.price || "0", 10);
  const daysNum = parseInt(form.timelineDays || "0", 10);
  const canProceedInfo = priceNum > 0 && daysNum > 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md py-24 text-center text-sm text-muted-foreground">
        Loading tender…
      </div>
    );
  }

  if (!wallet.connected || !wallet.publicKey || !wallet.program) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="size-10 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">Connect a wallet to submit a bid</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your bid is cryptographically tied to your Solana wallet — that's how anyone can verify it
          later. Connect a wallet in the header, then come back to this page.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/tenders/$tenderId" params={{ tenderId }}>
            Back to tender
          </Link>
        </Button>
      </div>
    );
  }

  if (!data || !data.tender) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-2xl font-semibold">Tender not found</h1>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/tenders">Back to all tenders</Link>
        </Button>
      </div>
    );
  }

  const { tender, meta } = data;
  const biddingClosed = tender.status !== "Open";

  const submit = async () => {
    if (biddingClosed) {
      toast.error("Bidding has closed for this tender.");
      return;
    }
    if (!canProceedInfo) {
      toast.error("Enter a valid price and timeline before submitting.");
      setStep("info");
      return;
    }
    setBusy(true);
    try {
      const bid = await tenderService.submitBid(wallet.program!, new PublicKey(wallet.publicKey!), {
        tenderId,
        price: priceNum,
        timelineDays: daysNum,
        qualityCert: form.qualityCert,
      });
      setSubmittedBid(bid);
      toast.success("Bid submitted on-chain", {
        description: "Your bid PDA is now visible to anyone with this wallet address.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  if (submittedBid) {
    return (
      <SuccessScreen
        bid={submittedBid}
        tenderId={tenderId}
        tenderTitle={tender.title}
        walletAddress={wallet.publicKey}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/tenders/$tenderId"
        params={{ tenderId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to tender
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-3">
            <StatusBadge status={tender.status} />
            <span className="text-xs text-muted-foreground">
              Submitting as {truncateAddress(wallet.publicKey)}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Submit a bid</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tender.title}</p>
        </div>
        <div>
          {tender.status === "Open" && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Closes in
              </div>
              <CountdownTimer deadline={tender.deadline} />
            </div>
          )}
        </div>
      </div>

      {/* Step rail */}
      <ol className="mt-8 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
        {STEPS.map((s, i) => {
          const active = s.key === step;
          const done = i < stepIndex;
          return (
            <li
              key={s.key}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm min-w-[200px]",
                active && "bg-primary/10 text-primary font-semibold",
                done && !active && "text-foreground",
                !active && !done && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : i + 1}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {step === "info" && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="price">Proposed price (NPR)</Label>
                <Input
                  id="price"
                  type="number"
                  min={1}
                  placeholder={
                    meta ? `Reference budget: ${formatNpr(meta.budgetNpr)}` : "Enter price"
                  }
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="days">Proposed timeline (days)</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  placeholder="e.g. 300"
                  value={form.timelineDays}
                  onChange={(e) => setForm((f) => ({ ...f, timelineDays: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="cert">
                  Quality certification
                  <span className="ml-2 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning-foreground">
                    Self-reported
                  </span>
                </Label>
                <Input
                  id="cert"
                  placeholder="e.g. ISO 9001:2015, EASA Part 145…"
                  value={form.qualityCert}
                  onChange={(e) => setForm((f) => ({ ...f, qualityCert: e.target.value }))}
                  className="mt-1.5"
                />
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  Self-reported at MVP stage — not independently verified. Production versions will
                  integrate a registrar or oracle attestation.
                </p>
              </div>
              <div>
                <Label htmlFor="notes">Quality &amp; approach (optional)</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Briefly describe your approach, materials, milestones…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-1.5"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Note: this field is not stored on-chain and does not affect scoring —
                  informational only.
                </p>
              </div>
            </div>
          )}

          {step === "documents" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
                <Upload className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Upload supporting documents</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Licenses, past project proofs, financial capacity, certifications
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      documents: [...f.documents, `document-${f.documents.length + 1}.pdf`],
                    }))
                  }
                >
                  Add document
                </Button>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Documents are attached as off-chain references at MVP — not part of the real
                  on-chain Bid account.
                </p>
              </div>
              {form.documents.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {form.documents.map((d) => (
                    <li
                      key={d}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span>{d}</span>
                      <span className="text-xs text-muted-foreground">Attached</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Review your bid
                </h3>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <ReviewCell
                    label="Bidder wallet"
                    value={truncateAddress(wallet.publicKey)}
                    mono
                  />
                  <ReviewCell label="Tender" value={`#${tender.tenderId}`} mono />
                  <ReviewCell label="Proposed price" value={formatNpr(priceNum)} />
                  <ReviewCell label="Timeline" value={`${daysNum} days`} />
                  <ReviewCell label="Quality cert" value={form.qualityCert || "—"} />
                  <ReviewCell label="Documents" value={`${form.documents.length} attached`} />
                </dl>
                {form.notes && (
                  <div className="mt-4 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                    {form.notes}
                  </div>
                )}
              </div>
              <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-xs text-foreground/90">
                By submitting, you create a PDA-based Bid account seeded to your wallet + this
                tender. The record is immutable — you cannot edit it after submission.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              disabled={stepIndex === 0}
              onClick={() => setStep(STEPS[stepIndex - 1].key)}
            >
              Back
            </Button>
            {step === "review" ? (
              <Button type="button" onClick={submit} disabled={busy || biddingClosed}>
                {busy ? "Submitting…" : biddingClosed ? "Bidding closed" : "Sign & submit bid"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep(STEPS[stepIndex + 1].key)}
                disabled={step === "info" && !canProceedInfo}
                className="gap-1"
              >
                Continue <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <ScoringFormulaWidget
            priceWeight={tender.priceWeight}
            timelineWeight={tender.timelineWeight}
            qualityWeight={tender.qualityWeight}
          />
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Why we ask this</div>
            <p className="mt-1">
              The locked formula only scores price and timeline. Quality certification is shown for
              human review but does not affect the automatic score at this stage.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"mt-0.5 font-medium " + (mono ? "font-mono" : "")}>{value}</dd>
    </div>
  );
}

function SuccessScreen({
  bid,
  tenderId,
  tenderTitle,
  walletAddress,
}: {
  bid: Bid;
  tenderId: string;
  tenderTitle: string;
  walletAddress: string;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-success/40 bg-success/10 p-8 text-center"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/25">
          <PartyPopper className="size-7 text-success-foreground" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Bid submitted on-chain</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your bid PDA is now public. It cannot be edited — and it will be scored by the locked
          formula when the tender closes.
        </p>
        <p className="mt-1 text-sm">
          Tender: <span className="font-medium">{tenderTitle}</span>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/tenders/$tenderId" params={{ tenderId }} search={{ tab: "bids" }}>
              See it in the ledger
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/company">Go to my dashboard</Link>
          </Button>
        </div>
      </motion.div>
      <div className="mt-8">
        <BlockchainExplorerPanel
          facts={{
            transactionHash: bid.signature,
            walletAddress,
            timestamp: bid.submittedAt,
            label: "Bid submission transaction",
          }}
          tenderId={tenderId}
        />
      </div>
    </div>
  );
}

import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicKey } from "@solana/web3.js";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScoringFormulaWidget } from "@/components/tender/scoring-formula-widget";
import { useWallet } from "@/components/wallet/wallet-provider";
import { tenderService } from "@/lib/tender-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/publish")({
  head: () => ({ meta: [{ title: "Publish Tender — TenderChain" }] }),
  component: PublishTenderPage,
});

const STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "timeline", label: "Timeline" },
  { key: "eligibility", label: "Eligibility" },
  { key: "scoring", label: "Scoring" },
  { key: "review", label: "Review & Publish" },
] as const;
type StepKey = typeof STEPS[number]["key"];

const DAY_MS = 86_400_000;

function PublishTenderPage() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<StepKey>("basic");
  const [busy, setBusy] = React.useState(false);
  const idx = STEPS.findIndex((s) => s.key === step);

  const [f, setF] = React.useState({
    title: "Road Construction",
    department: "Department of Road",
    category: "Infrastructure",
    location: "Bhaktapur",
    budgetNpr: "20000000000",
    description: "Bhaktapur Road Construction",
    biddingDays: 1,
    eligibility: "Registered contractor with valid tax clearance\nMinimum turnover NPR 50 Cr\nISO 9001 or equivalent",
    documents: "Company registration\nTax clearance\nPast project proofs",
    // NOTE: only two weights now — the real on-chain formula (price_weight,
    // timeline_weight) only scores these two. Quality certification is
    // self-reported and informational only (see the oracle-problem note in
    // the README) — it is intentionally NOT part of the locked formula.
    priceWeight: 60,
    timelineWeight: 40,
  });

  // Two-way balance: moving one slider adjusts the other so they always sum to 100.
  const setWeight = (key: "priceWeight" | "timelineWeight", value: number) => {
    setF((prev) => {
      const other = key === "priceWeight" ? "timelineWeight" : "priceWeight";
      return { ...prev, [key]: value, [other]: 100 - value };
    });
  };

  const canPublish = wallet.connected && f.title.trim() && f.description.trim() && f.department.trim();
  const totalWeight = f.priceWeight + f.timelineWeight;

  const publish = async () => {
    if (!wallet.publicKey || !wallet.program) {
      toast.error("Connect a wallet to publish");
      return;
    }
    if (totalWeight !== 100) {
      toast.error("Price and timeline weights must sum to 100%");
      return;
    }
    setBusy(true);
    try {
      const tender = await tenderService.createTender(
        wallet.program,
        new PublicKey(wallet.publicKey),
        {
          title: f.title,
          description: f.description,
          priceWeight: f.priceWeight,
          timelineWeight: f.timelineWeight,
          deadline: Date.now() + 10 * 60 * 1000, // TEMP: 2 minutes, for testing only — revert before demo
	  meta: {
            department: f.department,
            category: f.category,
            location: f.location || "—",
            budgetNpr: parseInt(f.budgetNpr || "0", 10),
            scopeOfWork: [],
            eligibility: f.eligibility.split("\n").map((s) => s.trim()).filter(Boolean),
            documentsRequired: f.documents.split("\n").map((s) => s.trim()).filter(Boolean),
          },
        }
      );
      toast.success("Tender published on-chain");
      navigate({ to: "/tenders/$tenderId", params: { tenderId: tender.tenderId }, search: { tab: "overview" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Publish a Tender</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Once published, the scoring formula is locked on-chain. Any change becomes a new,
          publicly visible event.
        </p>
      </div>

      <ol className="mt-6 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
        {STEPS.map((s, i) => {
          const active = s.key === step;
          const done = i < idx;
          return (
            <li
              key={s.key}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm min-w-[140px]",
                active && "bg-primary/10 text-primary font-semibold",
                !active && done && "text-foreground",
                !active && !done && "text-muted-foreground",
              )}
            >
              <span className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                active ? "bg-primary text-primary-foreground" : done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="size-4" /> : i + 1}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="relative min-h-[280px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                {step === "basic" && (
                  <>
                    <Field label="Tender title">
                      <Input value={f.title} onChange={(e) => setF((v) => ({ ...v, title: e.target.value }))} placeholder="e.g. Urban Road Widening — Ward 12" />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Department"><Input value={f.department} onChange={(e) => setF((v) => ({ ...v, department: e.target.value }))} placeholder="e.g. Department of Roads" /></Field>
                      <Field label="Category">
                        <Input value={f.category} onChange={(e) => setF((v) => ({ ...v, category: e.target.value }))} />
                      </Field>
                      <Field label="Location"><Input value={f.location} onChange={(e) => setF((v) => ({ ...v, location: e.target.value }))} placeholder="e.g. Kathmandu" /></Field>
                      <Field label="Estimated Budget (NPR)"><Input type="number" value={f.budgetNpr} onChange={(e) => setF((v) => ({ ...v, budgetNpr: e.target.value }))} /></Field>
                    </div>
                    <Field label="Description">
                      <Textarea rows={5} value={f.description} onChange={(e) => setF((v) => ({ ...v, description: e.target.value }))} placeholder="Scope, deliverables, context…" />
                    </Field>
                    <p className="text-xs text-muted-foreground">
                      Department, category, location, and budget are for display only — not part
                      of the on-chain tender record.
                    </p>
                  </>
                )}

                {step === "timeline" && (
                  <Field label={`Bidding window (${f.biddingDays} days)`}>
                    <Slider
                      min={3}
                      max={60}
                      step={1}
                      value={[f.biddingDays]}
                      onValueChange={([v]) => setF((prev) => ({ ...prev, biddingDays: v }))}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Bidding closes automatically {f.biddingDays} days after publication (enforced
                      on-chain — bids submitted after this will be rejected).
                    </p>
                  </Field>
                )}

                {step === "eligibility" && (
                  <>
                    <Field label="Eligibility criteria (one per line)">
                      <Textarea rows={6} value={f.eligibility} onChange={(e) => setF((v) => ({ ...v, eligibility: e.target.value }))} />
                    </Field>
                    <Field label="Documents required (one per line)">
                      <Textarea rows={5} value={f.documents} onChange={(e) => setF((v) => ({ ...v, documents: e.target.value }))} />
                    </Field>
                    <p className="text-xs text-muted-foreground">
                      Eligibility and document requirements are informational only — not enforced
                      on-chain at this MVP stage.
                    </p>
                  </>
                )}

                {step === "scoring" && (
                  <div className="space-y-6">
                    <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
                      These weights are locked on-chain the moment you publish. Choose deliberately —
                      this is what determines the winner automatically once bidding closes.
                    </div>
                    <WeightSlider label="Price weight" value={f.priceWeight} onChange={(v) => setWeight("priceWeight", v)} color="var(--brand-purple)" />
                    <WeightSlider label="Timeline weight" value={f.timelineWeight} onChange={(v) => setWeight("timelineWeight", v)} color="var(--brand-green)" />
                    <div className={"font-mono text-sm " + (totalWeight === 100 ? "text-success-foreground" : "text-destructive")}>
                      Total: {totalWeight}% {totalWeight !== 100 && "(must equal 100)"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Quality certification is collected from bidders but is self-reported and not
                      independently verified at this MVP stage — it's shown for human review, not
                      scored automatically. See the README for the planned oracle-based fix.
                    </p>
                  </div>
                )}

                {step === "review" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Review before publishing</h3>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <ReviewCell label="Title" value={f.title || "—"} />
                        <ReviewCell label="Department" value={f.department || "—"} />
                        <ReviewCell label="Category" value={f.category} />
                        <ReviewCell label="Budget" value={f.budgetNpr ? `NPR ${parseInt(f.budgetNpr).toLocaleString("en-IN")}` : "—"} />
                        <ReviewCell label="Bidding window" value={`${f.biddingDays} days`} />
                        <ReviewCell label="Formula" value={`Price ${f.priceWeight}% · Timeline ${f.timelineWeight}%`} mono />
                      </dl>
                    </div>
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-xs">
                      Publishing triggers <code className="font-mono">create_tender</code> and locks the formula on-chain.
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" disabled={idx === 0} onClick={() => setStep(STEPS[idx - 1].key)}>
              <ArrowLeft className="mr-1 size-4" /> Back
            </Button>
            {step === "review" ? (
              <Button onClick={publish} disabled={!canPublish || totalWeight !== 100 || busy}>
                {busy ? "Publishing…" : "Sign & Publish Tender"}
              </Button>
            ) : (
              <Button onClick={() => setStep(STEPS[idx + 1].key)} className="gap-1">
                Continue <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <aside>
          <ScoringFormulaWidget priceWeight={f.priceWeight} timelineWeight={f.timelineWeight} qualityWeight={0} />
          <p className="mt-4 text-xs text-muted-foreground">
            The locked formula shown here is what will govern the winner computation. It cannot be
            edited after publication.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function WeightSlider({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="size-2.5 rounded-full" style={{ background: color }} /> {label}
        </div>
        <span className="font-mono text-sm">{value}%</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={5} onValueChange={([v]) => onChange(v)} className="mt-2" />
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

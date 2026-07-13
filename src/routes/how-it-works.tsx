import { createFileRoute } from "@tanstack/react-router";

const STAGES = [
  {
    n: 1,
    title: "Government publishes the tender on-chain",
    body: "Authority connects wallet, fills the tender form (budget, scope, timeline, eligibility, scoring formula, bidding window), and calls create_tender. A new Tender PDA is created and the scoring formula is locked.",
  },
  {
    n: 2,
    title: "Companies apply and submit bids on-chain",
    body: "Bidders connect Phantom or Solflare, browse open tenders, and submit price + timeline + self-reported quality. Each bid becomes a PDA-based Bid account seeded to the bidder's wallet.",
  },
  {
    n: 3,
    title: "Bidding closes and result is published on-chain",
    body: "The bidding window closes automatically. Authority triggers Finalize — the pre-published formula runs. The outcome is identical regardless of who clicks the button, and anyone can independently recompute it.",
  },
  {
    n: 4,
    title: "Verification and project start (mixed on/off-chain)",
    body: "Document verification and contract signing happen off-chain as procurement law requires. Milestones are locked on-chain for public tracking. If verification fails and a bid is disqualified, that action is itself publicly logged.",
  },
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How TenderChain works" }, { name: "description", content: "Four stages: publish, bid, finalize, verify — with on-chain / off-chain steps marked at every point." }] }),
  component: () => (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">How it works</h1>
      <p className="mt-3 text-muted-foreground">
        Four stages, each combining on-chain actions with off-chain steps where procurement law
        requires them.
      </p>
      <ol className="mt-10 space-y-6">
        {STAGES.map((s) => (
          <li key={s.n} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.n}
              </span>
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  ),
});

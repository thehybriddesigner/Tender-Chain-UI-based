import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TenderChain" },
      { name: "description", content: "Why TenderChain exists — moving procurement discretion out of the selection stage and onto Solana." },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">About TenderChain</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Public tenders are designed to be merit-based, but the selection stage is where the process
        breaks down. TenderChain moves the decision rule on-chain and fixes it before bidding opens —
        so no one, including the tender authority, can change the rules or the outcome once bidding has
        started.
      </p>
      <div className="mt-10 space-y-8 text-sm">
        <section>
          <h2 className="text-xl font-semibold">The scale of the problem</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Public procurement is roughly 12–20% of global GDP — around $9.5–11 trillion annually.</li>
            <li>Corruption losses are estimated at 8–25% of contract value — conservatively $880 billion every year.</li>
            <li>Documented Nepal cases: Pokhara Int'l Airport, e-passport procurement, NAC wide-body aircraft, Nepal Television equipment.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">What TenderChain solves</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            <li><strong>Selection corruption</strong> — winner is computed by a fixed, public formula.</li>
            <li><strong>Bid tampering</strong> — bids are on-chain accounts; the record cannot be silently altered.</li>
            <li><strong>Quality verification (partial)</strong> — certifications are self-reported at MVP stage; a production version integrates oracles/registrars.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">The team</h2>
          <p className="mt-2 text-muted-foreground">Kshitij Ban (Solana / Anchor program) · Krishna Thakur (Frontend & integration). Submitted to Superteam Nepal — Open Governance Bounty.</p>
        </section>
      </div>
    </div>
  ),
});

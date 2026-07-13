import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "Docs — TenderChain" }, { name: "description", content: "Data model, program instructions, and integration notes for TenderChain." }] }),
  component: () => (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
      <p className="mt-3 text-muted-foreground">
        TenderChain's on-chain shape, as it will land in the Anchor IDL.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Program instructions</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-2">Instruction</th><th className="px-4 py-2">Purpose</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="px-4 py-3 font-mono">create_tender</td><td className="px-4 py-3">Publishes a tender with locked scoring weights and deadline.</td></tr>
              <tr><td className="px-4 py-3 font-mono">submit_bid</td><td className="px-4 py-3">Creates a PDA-based bid seeded by tender ID + bidder wallet.</td></tr>
              <tr><td className="px-4 py-3 font-mono">finalize_tender</td><td className="px-4 py-3">Closes bidding and computes the winner from the locked formula.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Account shapes</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-xs">
{`Tender  = [ "tender", tenderId ]
  authority: Pubkey
  tenderId: u64
  title: String
  description: String
  priceWeight: u8   // 0..100
  timelineWeight: u8
  qualityWeight: u8
  deadline: i64
  status: Open | Finalized
  winner: Option<Pubkey>

Bid     = [ "bid", tenderId, bidderPubkey ]
  tender: Pubkey
  bidder: Pubkey
  price: u64
  timelineDays: u32
  qualityCert: String   // self-reported (MVP)
  score: Option<u64>`}
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Frontend ↔ Anchor</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          When the IDL ships, swap the mock tenderService for
          <code className="mx-1 font-mono text-foreground">program.methods.instructionName(...)</code>
          and <code className="mx-1 font-mono text-foreground">program.account.tender.fetch(...)</code>.
          Component code does not change.
        </p>
      </section>
    </div>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { Lock, Search, ShieldCheck, BarChart3, Users, Zap } from "lucide-react";

const FEATURES = [
  { icon: Lock, title: "Locked scoring formula", desc: "Price/timeline/quality weights are fixed on-chain at tender creation. No silent edits." },
  { icon: ShieldCheck, title: "Tamper-evident bids", desc: "Every bid is a PDA-based on-chain account seeded to the bidder's wallet." },
  { icon: Zap, title: "Automatic finalization", desc: "Winner is computed by the pre-published formula — anyone can recompute it." },
  { icon: Search, title: "Public audit trail", desc: "Every action links to Solana Explorer for independent verification." },
  { icon: Users, title: "Wallet identity", desc: "Bidders are identified by their Solana wallet — not just a typed company name." },
  { icon: BarChart3, title: "Citizen dashboard", desc: "Journalists and citizens browse every tender and every bid, no wallet required." },
];

export const Route = createFileRoute("/features")({
  head: () => ({ meta: [{ title: "Features — TenderChain" }, { name: "description", content: "Locked formulas, tamper-evident bids, automatic finalization, and a public audit trail." }] }),
  component: () => (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Features</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        TenderChain is intentionally small — every feature exists to make the selection rule visible
        and independently verifiable.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5">
            <f.icon className="size-6 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  ),
});

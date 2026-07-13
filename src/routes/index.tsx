import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Search,
  Lock,
  BarChart3,
  Users,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  FileText,
  Gavel,
  ScrollText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScoringFormulaWidget } from "@/components/tender/scoring-formula-widget";
import { StatusBadge } from "@/components/tender/status-badge";
import { useStats, useTenders } from "@/hooks/use-tenders";
import { formatNpr, formatNumber } from "@/lib/format";
import { tenderService } from "@/lib/tender-service";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/motion-primitives";
import { CountUp } from "@/components/motion/count-up";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TenderChain — Transparent public procurement on Solana" },
      {
        name: "description",
        content:
          "Public tender scoring, fixed on-chain before bidding opens. TenderChain removes discretion from the selection stage — the rule is locked, the outcome is verifiable.",
      },
    ],
  }),
  component: LandingPage,
});

const BRAND_VALUES = [
  { icon: ShieldCheck, label: "Trust", desc: "Locked formula, on-chain" },
  { icon: Search, label: "Transparency", desc: "Every bid is public" },
  { icon: Lock, label: "Security", desc: "Solana-secured records" },
  { icon: BarChart3, label: "Accountability", desc: "Fully auditable trail" },
  { icon: Users, label: "Fairness", desc: "No hidden discretion" },
  { icon: Lightbulb, label: "Innovation", desc: "Programmable procurement" },
];

const HOW_STEPS = [
  {
    icon: FileText,
    title: "Publish",
    desc: "Government defines the tender and locks the scoring formula on-chain before bids open.",
  },
  {
    icon: Gavel,
    title: "Bid",
    desc: "Companies submit price, timeline, and quality. Every bid is a signed Solana transaction.",
  },
  {
    icon: ShieldCheck,
    title: "Finalize",
    desc: "The winner is computed by the locked formula — the same rule anyone can independently verify.",
  },
  {
    icon: ScrollText,
    title: "Audit",
    desc: "Every action lives on the public ledger. Citizens can trace the outcome from start to finish.",
  },
];

function LandingPage() {
  const { data: stats } = useStats();
  const { data: tenders } = useTenders();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -right-40 -top-40 size-[560px] rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -left-40 size-[560px] rounded-full bg-success/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass-surface inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="brand-gradient-bg size-2 rounded-full" />
              Built on Solana · Devnet MVP · Superteam Nepal
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[64px] lg:leading-[1.05]">
              Building trust into every{" "}
              <span className="brand-gradient-text">tender.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              TenderChain moves the scoring formula on-chain and locks it before
              bidding opens. Winners are computed by a public rule — not chosen
              at someone's discretion — and anyone can verify the outcome.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2 shadow-glow-purple">
                <Link to="/admin/publish">
                  Publish Tender <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tenders">Explore Tenders</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success-foreground" /> Locked formula
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success-foreground" /> Tamper-evident bids
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success-foreground" /> Publicly auditable
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/20 via-info/10 to-success/20 blur-2xl" aria-hidden />
            <div className="relative">
              <HeroDashboardMock />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live stat strip */}
      <section className="border-b border-border bg-card">
        <StaggerGroup className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          <StaggerItem><Stat label="Tenders published" value={stats?.totalTenders ?? 0} /></StaggerItem>
          <StaggerItem><Stat label="Total value locked" nprValue={stats?.totalValue ?? 0} /></StaggerItem>
          <StaggerItem><Stat label="Bids on-chain" value={stats?.totalBids ?? 0} /></StaggerItem>
          <StaggerItem><Stat label="Verified companies" value={stats?.companies ?? 0} /></StaggerItem>
        </StaggerGroup>
      </section>

      {/* Trusted-by strip */}
      <section className="border-b border-border bg-secondary/30">
        <FadeIn className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 py-10 sm:px-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Modeled on documented Nepal procurement cases
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-semibold tracking-tight text-muted-foreground/90">
            {[
              "Ministry of Culture, Tourism & Civil Aviation",
              "Nepal Airlines Corporation",
              "Department of Passports",
              "Nepal Television",
              "Kathmandu Metropolitan City",
              "Ministry of Energy",
            ].map((name) => (
              <li key={name} className="inline-flex items-center gap-2 opacity-80 transition hover:opacity-100">
                <span className="size-1.5 rounded-full bg-primary/50" aria-hidden />
                {name}
              </li>
            ))}
          </ul>
        </FadeIn>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <FadeIn className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Four steps. One immutable outcome.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            The same procurement lifecycle you already know — but the scoring
            rule is fixed before bidding, and every event is recorded on Solana.
          </p>
        </FadeIn>
        <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <StaggerItem key={step.title}>
                <div className="group relative h-full rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                  <div className="absolute right-4 top-4 font-mono text-xs text-muted-foreground">
                    0{i + 1}
                  </div>
                  <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="mt-4 text-sm font-semibold">{step.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Brand values */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <FadeIn className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Brand Values
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Six principles, one immutable ledger
            </h2>
          </FadeIn>
          <StaggerGroup className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {BRAND_VALUES.map(({ icon: Icon, label, desc }) => (
              <StaggerItem key={label}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-full flex-col items-center rounded-xl border border-border bg-card p-5 text-center"
                >
                  <Icon className="size-6 text-primary" />
                  <div className="mt-3 text-sm font-semibold">{label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Featured tenders */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <FadeIn className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Live on Devnet
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Recent tenders</h2>
            </div>
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/tenders">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </FadeIn>
          <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(tenders ?? []).slice(0, 3).map((t) => {
              const meta = tenderService.getMeta(t.tenderId);
              return (
                <StaggerItem key={t.tenderId}>
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
                    <Link
                      to="/tenders/$tenderId"
                      params={{ tenderId: t.tenderId }}
                      className="group block h-full rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <StatusBadge status={t.status} />
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {meta?.category}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-base font-semibold group-hover:text-primary">
                        {t.title}
                      </h3>
                      <div className="mt-3 text-sm text-muted-foreground">{meta?.department}</div>
                      <div className="mt-4 border-t border-border pt-3 font-mono text-xs text-muted-foreground">
                        Price {t.priceWeight}% · Timeline {t.timelineWeight}%
                        {t.qualityWeight > 0 ? ` · Quality ${t.qualityWeight}%` : ""}
                      </div>
                    </Link>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>


      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-border surface-navy">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--brand-purple)_40%,transparent)_0%,transparent_70%)]" />
        <FadeIn className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to make procurement <span className="brand-gradient-text">verifiable</span>?
          </h2>
          <p className="max-w-xl text-sm text-white/70">
            Publish your first tender on Devnet, or browse existing ones to see
            the locked formula and full audit trail in action.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/admin/publish">Publish a Tender</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link to="/tenders">Explore Portal</Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}

function Stat({ label, value, nprValue }: { label: string; value?: number; nprValue?: number }) {
  const isNpr = typeof nprValue === "number";
  const n = isNpr ? nprValue! : (value ?? 0);
  return (
    <div>
      <div className="text-3xl font-bold tracking-tight">
        {isNpr ? (
          <CountUp value={n} format={(v) => formatNpr(v)} duration={1400} />
        ) : (
          <CountUp value={n} format={(v) => formatNumber(Math.round(v))} />
        )}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function HeroDashboardMock() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive/50" />
            <span className="size-2.5 rounded-full bg-warning/60" />
            <span className="size-2.5 rounded-full bg-success/60" />
          </div>
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            tenderchain.io/tenders/1001
          </span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <StatusBadge status="Open" />
            <h3 className="mt-2 text-base font-semibold leading-snug">
              Pokhara Airport — Terminal Retrofit Phase II
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ministry of Culture, Tourism &amp; Civil Aviation
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</div>
            <div className="text-sm font-semibold">NPR 1.24 Bn</div>
          </div>
        </div>
        <div className="mt-4">
          <ScoringFormulaWidget priceWeight={60} timelineWeight={30} qualityWeight={10} />
        </div>
        <div className="mt-4 space-y-2">
          {[
            { name: "Himal Infra", price: "1.18 Bn", days: 340, score: 88.4 },
            { name: "Kailash Const.", price: "1.09 Bn", days: 410, score: 76.1 },
            { name: "Everest BuildTech", price: "1.22 Bn", days: 300, score: 72.5 },
          ].map((row, i) => (
            <motion.div
              key={row.name}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
              className={
                "flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs " +
                (i === 0 ? "bg-success/10 border-success/40" : "bg-background")
              }
            >
              <span className="truncate font-medium">
                #{i + 1} {row.name}
              </span>
              <span className="shrink-0 font-mono">
                NPR {row.price} · {row.days}d · {row.score}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

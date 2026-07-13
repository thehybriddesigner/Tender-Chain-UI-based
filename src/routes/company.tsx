import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Briefcase,
  Trophy,
  XCircle,
  Award,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusBadge } from "@/components/tender/status-badge";
import { useMyBids } from "@/hooks/use-tenders";
import { useWallet } from "@/components/wallet/wallet-provider";
import { formatDate, formatNpr, truncateAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { TenderChainLogo } from "@/components/brand/logo";
import { WalletButton, DevnetBadge } from "@/components/wallet/wallet-button";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/motion-primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/company")({
  head: () => ({ meta: [{ title: "Company Dashboard — TenderChain" }] }),
  component: CompanyShell,
});

type TabKey =
  | "applications"
  | "won"
  | "lost"
  | "trust"
  | "performance";

const TABS: { key: TabKey; label: string; icon: typeof Briefcase }[] = [
  { key: "applications", label: "Applications", icon: Briefcase },
  { key: "won", label: "Won", icon: Trophy },
  { key: "lost", label: "Lost", icon: XCircle },
  { key: "trust", label: "Trust Score", icon: Award },
  { key: "performance", label: "Performance", icon: Activity },
];

function CompanyShell() {
  const wallet = useWallet();
  const { data: mine = [] } = useMyBids(wallet.publicKey);
  const [tab, setTab] = React.useState<TabKey>("applications");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const won = mine.filter((x) => x.tender.winner === wallet.publicKey);
  const lost = mine.filter(
    (x) => x.tender.status === "Finalized" && x.tender.winner !== wallet.publicKey,
  );
  const pending = mine.filter((x) => x.tender.status !== "Finalized");
  const total = mine.length;
  const winRate = total > 0 ? Math.round((won.length / total) * 100) : 0;
  // Trust score: weighted blend of win rate + participation. Mock-only.
  const trustScore = Math.min(
    99,
    Math.round(40 + winRate * 0.4 + Math.min(total, 20) * 1.8),
  );

  const counts: Record<TabKey, number> = {
    applications: total,
    won: won.length,
    lost: lost.length,
    trust: 0,
    performance: 0,
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 surface-navy md:flex md:flex-col">
        <SidebarContent
          tab={tab}
          onSelect={setTab}
          counts={counts}
          trustScore={trustScore}
          pubkey={wallet.publicKey}
          bidderName={wallet.bidderName}
        />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col surface-navy md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
              <SidebarContent
                tab={tab}
                onSelect={(t) => {
                  setTab(t);
                  setMobileOpen(false);
                }}
                counts={counts}
                trustScore={trustScore}
                pubkey={wallet.publicKey}
                bidderName={wallet.bidderName}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="size-4" /> Company Portal
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <DevnetBadge />
            <WalletButton />
          </div>
        </header>

        <div className="flex-1 bg-secondary/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            {!wallet.connected ? (
              <FadeIn>
                <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                  <Building2 className="mx-auto size-8 text-muted-foreground" />
                  <h2 className="mt-3 text-lg font-semibold">Connect your wallet</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sign in as a bidder to view your applications, wins, and trust score.
                  </p>
                </div>
              </FadeIn>
            ) : (
              <>
                <FadeIn>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {wallet.bidderName ?? "Company Dashboard"}
                      </h1>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">
                          {truncateAddress(wallet.publicKey!)}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{total} bids on-chain</span>
                        <span aria-hidden>·</span>
                        <span>Win rate {winRate}%</span>
                      </div>
                    </div>
                    <Button asChild variant="outline">
                      <Link to="/tenders">Browse open tenders</Link>
                    </Button>
                  </div>
                </FadeIn>

                {/* KPI strip */}
                <StaggerGroup className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StaggerItem>
                    <StatCard label="Applications" value={total} />
                  </StaggerItem>
                  <StaggerItem>
                    <StatCard label="Pending" value={pending.length} />
                  </StaggerItem>
                  <StaggerItem>
                    <StatCard label="Won" value={won.length} tone="success" />
                  </StaggerItem>
                  <StaggerItem>
                    <StatCard label="Lost" value={lost.length} tone="muted" />
                  </StaggerItem>
                </StaggerGroup>

                {/* Tab switcher (mobile alt) */}
                <div className="mt-6 flex gap-2 overflow-x-auto rounded-lg border border-border bg-card p-1 md:hidden">
                  {TABS.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                          tab === t.key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary",
                        )}
                      >
                        <Icon className="size-3.5" /> {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* Panel */}
                <div className="mt-6">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {tab === "applications" && (
                        <BidsPanel
                          title="All Applications"
                          empty="You haven't submitted any bids yet."
                          items={mine}
                          pubkey={wallet.publicKey}
                        />
                      )}
                      {tab === "won" && (
                        <BidsPanel
                          title="Won Tenders"
                          empty="No wins yet — every winning bid will appear here."
                          items={won}
                          pubkey={wallet.publicKey}
                        />
                      )}
                      {tab === "lost" && (
                        <BidsPanel
                          title="Lost Tenders"
                          empty="No lost bids — you either won or are still in the running."
                          items={lost}
                          pubkey={wallet.publicKey}
                        />
                      )}
                      {tab === "trust" && (
                        <TrustPanel
                          trustScore={trustScore}
                          winRate={winRate}
                          total={total}
                          won={won.length}
                        />
                      )}
                      {tab === "performance" && (
                        <PerformancePanel items={mine} pubkey={wallet.publicKey} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  tab,
  onSelect,
  counts,
  trustScore,
  pubkey,
  bidderName,
}: {
  tab: TabKey;
  onSelect: (t: TabKey) => void;
  counts: Record<TabKey, number>;
  trustScore: number;
  pubkey: string | null;
  bidderName?: string | null;
}) {
  return (
    <>
      <div className="flex h-20 items-center justify-center px-5">
        <Link to="/" className="flex items-center justify-center" aria-label="Home">
          <TenderChainLogo variant="monogram" className="h-14 w-auto" />
        </Link>
      </div>
      {pubkey && (
        <div className="mx-3 mt-3 rounded-lg bg-white/5 p-3 text-xs text-white/70">
          <div className="font-semibold text-white">
            {bidderName ?? "Connected Bidder"}
          </div>
          <div className="mt-0.5 font-mono">{truncateAddress(pubkey)}</div>
          <div className="mt-2 flex items-center justify-between">
            <span>Trust score</span>
            <span className="font-semibold text-[color:var(--brand-green)]">
              {trustScore}
            </span>
          </div>
        </div>
      )}
      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          const badge = counts[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={cn(
                "flex w-full items-center justify-between gap-2.5 rounded-md px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white",
                active && "bg-white/15 font-medium text-white",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4" /> {item.label}
              </span>
              {badge > 0 && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-4 text-[11px] text-white/50">
        Solana Devnet · Company Portal
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "muted";
}) {
  const color =
    tone === "success"
      ? "text-success-foreground"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={"mt-2 text-3xl font-bold " + color}>{value}</div>
    </div>
  );
}

type BidRow = ReturnType<typeof useMyBids>["data"] extends
  | Array<infer T>
  | undefined
  ? T
  : never;

function BidsPanel({
  title,
  empty,
  items,
  pubkey,
}: {
  title: string;
  empty: string;
  items: BidRow[];
  pubkey: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3 text-sm font-semibold">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          {empty}{" "}
          <Link to="/tenders" className="text-primary hover:underline">
            Browse open tenders
          </Link>
          .
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map(({ bid, tender }) => (
            <motion.li
              key={`${tender.tenderId}-${bid.bidder}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:flex sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  to="/tenders/$tenderId"
                  params={{ tenderId: tender.tenderId }}
                  className="truncate text-sm font-medium hover:text-primary"
                >
                  {tender.title}
                </Link>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Bid {formatNpr(bid.price)} · {bid.timelineDays} days · submitted{" "}
                  {formatDate(bid.submittedAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {tender.status === "Finalized" && tender.winner === pubkey && (
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success-foreground">
                    Won
                  </span>
                )}
                <StatusBadge status={tender.status} />
                <Button asChild variant="ghost" size="sm">
                  <Link
                    to="/tenders/$tenderId"
                    params={{ tenderId: tender.tenderId }}
                    search={{ tab: "bids" }}
                  >
                    View
                  </Link>
                </Button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrustPanel({
  trustScore,
  winRate,
  total,
  won,
}: {
  trustScore: number;
  winRate: number;
  total: number;
  won: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="text-sm font-semibold">Trust Score</div>
        <p className="text-xs text-muted-foreground">
          Computed from public wins &amp; participation on-chain.
        </p>
        <TrustGauge value={trustScore} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md border border-border p-2">
            <div className="text-lg font-bold">{total}</div>
            <div className="text-muted-foreground">Bids</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="text-lg font-bold">{won}</div>
            <div className="text-muted-foreground">Won</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="text-lg font-bold">{winRate}%</div>
            <div className="text-muted-foreground">Win rate</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="text-sm font-semibold">How your trust score works</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Every bid, win, and loss is a public event on Solana. Your trust score
          is a transparent aggregation of those events — not an internal rating.
          The formula is the same for every bidder.
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          <TrustRow
            title="On-chain participation"
            desc="Number of bids you have submitted across all tenders."
          />
          <TrustRow
            title="Public win rate"
            desc="Ratio of tenders where the locked formula selected you as winner."
          />
          <TrustRow
            title="Delivery history"
            desc="Reserved for post-award performance signals (roadmap)."
          />
        </ul>
        <div className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
          MVP note: delivery/performance signals are not yet on-chain. The score
          you see reflects participation and win rate only.
        </div>
      </div>
    </div>
  );
}

function TrustRow({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3 rounded-md border border-border/60 bg-background p-3">
      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Award className="size-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}

function TrustGauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="mt-4 flex items-center justify-center">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 120 120" className="-rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="10"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#trustGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="trustGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--brand-purple)" />
              <stop offset="100%" stopColor="var(--brand-green)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            /100
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformancePanel({
  items,
  pubkey,
}: {
  items: BidRow[];
  pubkey: string | null;
}) {
  // Build a monthly bid activity series from submittedAt.
  const months = React.useMemo(() => {
    const now = new Date();
    const buckets: { label: string; bids: number; wins: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: d.toLocaleString("en-GB", { month: "short" }),
        bids: 0,
        wins: 0,
      });
    }
    for (const { bid, tender } of items) {
      const d = new Date(bid.submittedAt);
      const diff =
        (now.getFullYear() - d.getFullYear()) * 12 +
        (now.getMonth() - d.getMonth());
      if (diff >= 0 && diff <= 5) {
        const b = buckets[5 - diff];
        b.bids += 1;
        if (tender.winner === pubkey) b.wins += 1;
      }
    }
    return buckets;
  }, [items, pubkey]);

  const avgTimeline =
    items.length > 0
      ? Math.round(
          items.reduce((s, x) => s + x.bid.timelineDays, 0) / items.length,
        )
      : 0;
  const avgPrice =
    items.length > 0
      ? Math.round(items.reduce((s, x) => s + x.bid.price, 0) / items.length)
      : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
        <div className="text-sm font-semibold">Bidding Activity — last 6 months</div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months}>
              <XAxis
                dataKey="label"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="bids" fill="var(--brand-purple)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="wins" fill="var(--brand-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[color:var(--brand-purple)]" />
            Bids submitted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[color:var(--brand-green)]" />
            Wins
          </span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Average bid price
          </div>
          <div className="mt-2 text-2xl font-bold">
            {avgPrice ? formatNpr(avgPrice) : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Average timeline offered
          </div>
          <div className="mt-2 text-2xl font-bold">
            {avgTimeline ? `${avgTimeline} days` : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Latest activity
          </div>
          <div className="mt-2 text-sm">
            {items[0]
              ? `Bid on "${items[0].tender.title}" · ${formatDate(items[0].bid.submittedAt)}`
              : "No activity yet."}
          </div>
        </div>
      </div>
    </div>
  );
}

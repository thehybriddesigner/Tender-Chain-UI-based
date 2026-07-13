import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusCircle, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/tender/status-badge";
import { useStats, useTenders, useAudits } from "@/hooks/use-tenders";
import { useWallet } from "@/components/wallet/wallet-provider";
import { formatDateTime, formatNpr, formatNumber, truncateAddress } from "@/lib/format";
import { tenderService } from "@/lib/tender-service";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/motion-primitives";
import { CountUp } from "@/components/motion/count-up";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — TenderChain" }] }),
  component: AdminDashboard,
});

const PIE_COLORS = ["var(--brand-green)", "var(--brand-sky)", "var(--brand-purple)", "var(--brand-navy)"];

function AdminDashboard() {
  const { data: stats } = useStats();
  const { data: tenders = [] } = useTenders();
  const { data: audits = [] } = useAudits();
  const wallet = useWallet();
  const mine = wallet.publicKey ? tenders.filter((t) => t.authority === wallet.publicKey) : [];

  const statusData = stats
    ? Object.entries(stats.statusBreakdown).map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <FadeIn className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of every tender, bid, and value locked across TenderChain.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/publish"><PlusCircle className="mr-1 size-4" /> Publish Tender</Link>
        </Button>
      </FadeIn>

      {/* KPIs */}
      <StaggerGroup className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem><Kpi label="Total Tenders" value={stats?.totalTenders ?? 0} trend="+8.4%" /></StaggerItem>
        <StaggerItem><Kpi label="Active Bids" value={stats?.totalBids ?? 0} trend="+12.1%" /></StaggerItem>
        <StaggerItem><Kpi label="Total Value" nprValue={stats?.totalValue ?? 0} trend="+3.2%" /></StaggerItem>
        <StaggerItem><Kpi label="Companies" value={stats?.companies ?? 0} trend="-1.5%" negative /></StaggerItem>
      </StaggerGroup>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="text-sm font-semibold">Tenders Over Time</div>
          <p className="text-xs text-muted-foreground">Last 6 months</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.buckets ?? []}>
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="var(--brand-purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm font-semibold">Tenders by Status</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
            {statusData.map((d, i) => (
              <li key={d.name} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} · {d.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* My tenders + activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">My Tenders</div>
            <span className="text-xs text-muted-foreground">
              {mine.length} tender{mine.length === 1 ? "" : "s"}
            </span>
          </div>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Connect a wallet and publish a tender to see it here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {mine.map((t) => (
                <li key={t.tenderId} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link to="/tenders/$tenderId" params={{ tenderId: t.tenderId }} className="text-sm font-medium hover:text-primary">
                      {t.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {tenderService.getMeta(t.tenderId)?.department}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm font-semibold">Recent Activity</div>
          <ul className="mt-3 space-y-3 text-xs">
            {audits.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 border-b border-border/60 pb-2 last:border-none">
                <div>
                  <div className="font-medium text-foreground">{a.action.replace(/([A-Z])/g, " $1").trim()}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{truncateAddress(a.performedBy)}</div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground">
                  {formatDateTime(a.timestamp)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top categories */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="text-sm font-semibold">Top Performing Categories</div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(stats?.topCategories ?? []).map((c) => (
            <li key={c.category} className="rounded-lg border border-border bg-background px-3 py-2">
              <div className="text-xs text-muted-foreground">{c.category}</div>
              <div className="mt-1 text-lg font-semibold">{c.count}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Kpi({ label, value, nprValue, trend, negative }: { label: string; value?: number; nprValue?: number; trend: string; negative?: boolean }) {
  const Icon = negative ? TrendingDown : TrendingUp;
  const isNpr = typeof nprValue === "number";
  const n = isNpr ? nprValue! : (value ?? 0);
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition hover:shadow-elegant">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold">
        {isNpr ? (
          <CountUp value={n} format={(v) => formatNpr(v)} duration={1400} />
        ) : (
          <CountUp value={n} format={(v) => formatNumber(Math.round(v))} />
        )}
      </div>
      <div className={"mt-1 inline-flex items-center gap-1 text-xs " + (negative ? "text-destructive" : "text-success-foreground")}>
        <Icon className="size-3" /> {trend} <span className="text-muted-foreground">vs last month</span>
      </div>
    </div>
  );
}

import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, ArrowRight, FileText, TrendingUp, ScrollText, Info, Building2, ShieldCheck, Activity, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, CountdownTimer } from "@/components/tender/status-badge";
import { useTenders, useStats } from "@/hooks/use-tenders";
import { tenderService } from "@/lib/tender-service";
import { formatNpr, truncateAddress } from "@/lib/format";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/motion-primitives";
import { CountUp } from "@/components/motion/count-up";
import type { TenderStatus } from "@/lib/types";

interface TenderSearchParams {
  q?: string;
  category?: string;
  status?: TenderStatus | "all";
}

export const Route = createFileRoute("/tenders/")({
  head: () => ({
    meta: [
      { title: "Explore Tenders — Citizen Portal | TenderChain" },
      {
        name: "description",
        content:
          "Search every public tender ever published on TenderChain. Filter by category or status. No wallet required — this dashboard is fully open to anyone.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): TenderSearchParams => ({
    q: (search.q as string) || undefined,
    category: (search.category as string) || undefined,
    status: (search.status as TenderSearchParams["status"]) || "all",
  }),
  component: CitizenDashboard,
});

const SHORTCUTS = [
  { label: "All Tenders", icon: FileText, filter: { status: "all" as const } },
  { label: "Awarded", icon: TrendingUp, filter: { status: "Finalized" as const } },
  { label: "Live Projects", icon: TrendingUp, filter: { status: "Open" as const } },
  { label: "Audit Logs", icon: ScrollText, to: "/tenders" as const, isAudit: true },
  { label: "About TenderChain", icon: Info, to: "/about" as const },
];

function CitizenDashboard() {
  const { data: tenders = [] } = useTenders();
  const { data: stats } = useStats();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const t of tenders) {
      const meta = tenderService.getMeta(t.tenderId);
      if (meta) set.add(meta.category);
    }
    return Array.from(set).sort();
  }, [tenders]);

  const categoryCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tenders) {
      const meta = tenderService.getMeta(t.tenderId);
      if (!meta) continue;
      map.set(meta.category, (map.get(meta.category) ?? 0) + 1);
    }
    return map;
  }, [tenders]);

  const filtered = React.useMemo(() => {
    return tenders.filter((t) => {
      const meta = tenderService.getMeta(t.tenderId);
      if (search.status && search.status !== "all" && t.status !== search.status) return false;
      if (search.category && meta?.category !== search.category) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        const hay =
          t.title.toLowerCase() +
          " " +
          t.description.toLowerCase() +
          " " +
          (meta?.department.toLowerCase() ?? "");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tenders, search]);

  const setStatus = (status: TenderSearchParams["status"]) =>
    navigate({ search: (prev: TenderSearchParams) => ({ ...prev, status }), replace: true });
  const setCategory = (category: string | undefined) =>
    navigate({ search: (prev: TenderSearchParams) => ({ ...prev, category }), replace: true });
  const setQ = (q: string) =>
    navigate({ search: (prev: TenderSearchParams) => ({ ...prev, q: q || undefined }), replace: true });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Citizen / Public Dashboard
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Every tender, in the open</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Search and inspect every tender ever published on TenderChain. No wallet
            required — the audit surface for citizens and journalists.
          </p>
        </div>
      </div>

      {/* Public transparency stats */}
      <StaggerGroup className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <TransparencyStat icon={FileText} label="Tenders on-chain" value={stats?.totalTenders ?? 0} tone="purple" />
        </StaggerItem>
        <StaggerItem>
          <TransparencyStat icon={Activity} label="Bids submitted" value={stats?.totalBids ?? 0} tone="sky" />
        </StaggerItem>
        <StaggerItem>
          <TransparencyStat icon={Coins} label="Public value" nprValue={stats?.totalValue ?? 0} tone="green" />
        </StaggerItem>
        <StaggerItem>
          <TransparencyStat icon={ShieldCheck} label="Verified companies" value={stats?.companies ?? 0} tone="navy" />
        </StaggerItem>
      </StaggerGroup>

      {/* Browse by category */}
      {categories.length > 0 && (
        <FadeIn className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Browse by category</div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">Sectors currently on TenderChain</h2>
            </div>
            {search.category && (
              <button
                onClick={() => setCategory(undefined)}
                className="text-xs font-medium text-muted-foreground hover:text-primary"
              >
                Clear category
              </button>
            )}
          </div>
          <StaggerGroup className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((c) => {
              const active = search.category === c;
              return (
                <StaggerItem key={c}>
                  <button
                    onClick={() => setCategory(active ? undefined : c)}
                    className={
                      "group flex h-full w-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all " +
                      (active
                        ? "border-primary bg-primary/5 shadow-glow-purple"
                        : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant")
                    }
                  >
                    <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15">
                      <Building2 className="size-4" />
                    </div>
                    <div className="text-sm font-semibold leading-tight">{c}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {categoryCounts.get(c) ?? 0} tenders
                    </div>
                  </button>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </FadeIn>
      )}


      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Left rail */}
        <aside className="space-y-1">
          {SHORTCUTS.map((s) =>
            s.to ? (
              <Link
                key={s.label}
                to={s.to}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <s.icon className="size-4" /> {s.label}
              </Link>
            ) : (
              <button
                key={s.label}
                onClick={() => setStatus(s.filter!.status)}
                className={
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary " +
                  (search.status === s.filter!.status
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground")
                }
              >
                <s.icon className="size-4" /> {s.label}
              </button>
            ),
          )}
        </aside>

        {/* Main */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search.q ?? ""}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tenders, departments, keywords…"
                className="pl-9"
              />
            </div>
            <Select value={search.category ?? "all"} onValueChange={(v) => setCategory(v === "all" ? undefined : v)}>
              <SelectTrigger className="sm:w-52">
                <SlidersHorizontal className="mr-1 size-4 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={search.status ?? "all"} onValueChange={(v) => setStatus(v as TenderSearchParams["status"])}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="UnderEvaluation">Under Evaluation</SelectItem>
                <SelectItem value="Finalized">Awarded</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Tender title</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Budget (NPR)</th>
                    <th className="px-4 py-3 font-medium">Deadline</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No tenders match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => {
                      const meta = tenderService.getMeta(t.tenderId);
                      return (
                        <tr key={t.tenderId} className="border-t border-border hover:bg-secondary/40">
                          <td className="px-4 py-3">
                            <Link
                              to="/tenders/$tenderId"
                              params={{ tenderId: t.tenderId }}
                              className="font-medium hover:text-primary"
                            >
                              {t.title}
                            </Link>
                            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                              Authority {truncateAddress(t.authority)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{meta?.department ?? "—"}</td>
                          <td className="px-4 py-3 font-semibold">{meta ? formatNpr(meta.budgetNpr) : "—"}</td>
                          <td className="px-4 py-3">
                            <CountdownTimer deadline={t.deadline} compact />
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                          <td className="px-4 py-3">
                            <Button asChild variant="ghost" size="sm" className="gap-1">
                              <Link to="/tenders/$tenderId" params={{ tenderId: t.tenderId }}>
                                View <ArrowRight className="size-3.5" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Showing {filtered.length} of {tenders.length} tenders · Everything on this page
            is derived from Solana Devnet mock data matching the target Anchor IDL shape.
          </p>
        </div>
      </div>
    </div>
  );
}

const TONE_CLASSES: Record<string, string> = {
  purple: "bg-primary/10 text-primary",
  sky: "bg-info/15 text-info-foreground",
  green: "bg-success/15 text-success-foreground",
  navy: "bg-foreground/10 text-foreground",
};

function TransparencyStat({
  icon: Icon,
  label,
  value,
  nprValue,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  value?: number;
  nprValue?: number;
  tone: keyof typeof TONE_CLASSES;
}) {
  const isNpr = typeof nprValue === "number";
  const n = isNpr ? nprValue! : (value ?? 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition hover:shadow-elegant">
      <div className="flex items-center justify-between">
        <div className={"grid size-9 place-items-center rounded-lg " + TONE_CLASSES[tone]}>
          <Icon className="size-4" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">
        {isNpr ? (
          <CountUp value={n} format={(v) => formatNpr(v)} duration={1400} />
        ) : (
          <CountUp value={n} format={(v) => Math.round(v).toLocaleString("en-US")} />
        )}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

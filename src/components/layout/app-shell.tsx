import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TenderChainLogo } from "@/components/brand/logo";
import { WalletButton, DevnetBadge } from "@/components/wallet/wallet-button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it Works" },
  { to: "/tenders", label: "Explore" },
  { to: "/docs", label: "Docs" },
] as const;

export function AppHeader() {
  const [open, setOpen] = React.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide the public header on admin/company shells — those provide their own top bar.
  if (pathname.startsWith("/admin") || pathname.startsWith("/company")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center" aria-label="TenderChain home">
            <TenderChainLogo variant="horizontal" className="hidden h-14 w-auto sm:block lg:h-[56px]" />
            <TenderChainLogo variant="monogram" className="h-12 w-auto sm:hidden" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "text-foreground bg-secondary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <DevnetBadge />
          <div className="hidden sm:block">
            <WalletButton />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2">
              <WalletButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function AppFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin") || pathname.startsWith("/company")) return null;

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <TenderChainLogo variant="horizontal" className="h-12 w-auto" />
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Transparent public procurement, built on Solana. The scoring rule is fixed
            before bidding — and anyone can independently check the outcome.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/tenders" className="hover:text-primary">Explore Tenders</Link></li>
            <li><Link to="/features" className="hover:text-primary">Features</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary">How it Works</Link></li>
            <li><Link to="/docs" className="hover:text-primary">Documentation</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roles</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/admin" className="hover:text-primary">Admin (Government)</Link></li>
            <li><Link to="/company" className="hover:text-primary">Company Dashboard</Link></li>
            <li><Link to="/tenders" className="hover:text-primary">Citizen Portal</Link></li>
          </ul>
        </div>
      </div>
      <div className="brand-gradient-bg h-1 w-full" aria-hidden />
      <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <span>© {new Date().getFullYear()} TenderChain · Superteam Nepal · Solana Devnet MVP</span>
        <span>Transparent. Verifiable. Trustworthy.</span>
      </div>
    </footer>
  );
}

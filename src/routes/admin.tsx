import * as React from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Building2,
  BarChart3,
  ScrollText,
  Globe,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { TenderChainLogo } from "@/components/brand/logo";
import { WalletButton, DevnetBadge } from "@/components/wallet/wallet-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  to: "/admin" | "/admin/publish" | "/tenders";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};
const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin", label: "My Tenders", icon: FileText },
  { to: "/admin/publish", label: "Publish Tender", icon: PlusCircle },
  { to: "/admin", label: "Bids", icon: Users },
  { to: "/admin", label: "Companies", icon: Building2 },
  { to: "/admin", label: "Analytics", icon: BarChart3 },
  { to: "/admin", label: "Audit Logs", icon: ScrollText },
  { to: "/tenders", label: "Citizen Portal", icon: Globe },
  { to: "/admin", label: "Settings", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  component: AdminShell,
});

function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 surface-navy md:flex md:flex-col">
        <SidebarContent pathname={pathname} />
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
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
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
            <div className="text-sm font-medium text-muted-foreground">
              Government Admin
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <DevnetBadge />
            <WalletButton />
          </div>
        </header>
        <div className="flex-1 bg-secondary/30">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-20 items-center justify-center px-5">
        <Link to="/admin" onClick={onNavigate} className="flex items-center justify-center" aria-label="Admin home">
          <TenderChainLogo variant="monogram" className="h-14 w-auto" />
        </Link>
      </div>
      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const active =
            (item.exact && pathname === item.to) ||
            (!item.exact && pathname.startsWith(item.to) && item.to !== "/admin");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white",
                active && "bg-white/15 font-medium text-white",
              )}
            >
              <Icon className="size-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-[11px] text-white/50">
        Solana Devnet · Admin Portal
      </div>
    </>
  );
}

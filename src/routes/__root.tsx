import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "../lib/buffer-polyfill";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import { AppHeader, AppFooter } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/motion/page-transition";
import { Toaster } from "@/components/ui/sonner";
import faviconUrl from "@/assets/brand/tender_monogram.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The tender or page you're looking for doesn't exist on TenderChain.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return home
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          TenderChain hit an unexpected error. You can try again or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TenderChain — Transparent public procurement on Solana" },
      {
        name: "description",
        content:
          "TenderChain moves the tender scoring formula on-chain — locked before bidding, computed automatically, and verifiable by anyone.",
      },
      { name: "author", content: "TenderChain" },
      { property: "og:title", content: "TenderChain — Transparent public procurement on Solana" },
      {
        property: "og:description",
        content: "The rule was fixed before bidding, and anyone can check it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@TenderChain" },
      { name: "twitter:title", content: "TenderChain — Transparent public procurement on Solana" },
      { name: "description", content: "Public tender scoring, fixed on-chain before bidding opens. TenderChain removes discretion from the selection stage — the rule is locked, the outcome is verifiable." },
      { property: "og:description", content: "Public tender scoring, fixed on-chain before bidding opens. TenderChain removes discretion from the selection stage — the rule is locked, the outcome is verifiable." },
      { name: "twitter:description", content: "Public tender scoring, fixed on-chain before bidding opens. TenderChain removes discretion from the selection stage — the rule is locked, the outcome is verifiable." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8fc45a68-5174-435c-80b3-803be505572a/id-preview-0091f6ea--d8bef2ed-79c8-42b3-b974-a27e561b07b1.lovable.app-1783345443742.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8fc45a68-5174-435c-80b3-803be505572a/id-preview-0091f6ea--d8bef2ed-79c8-42b3-b974-a27e561b07b1.lovable.app-1783345443742.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: faviconUrl, type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <AppHeader />
          <main className="flex-1">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
          <AppFooter />
        </div>
        <Toaster richColors position="top-right" />
      </WalletProvider>
    </QueryClientProvider>
  );
}

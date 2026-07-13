
# TenderChain — Implementation Plan

Built strictly from the four source documents (Proposal → Frontend Guide → Design Spec → Brand Identity). MVP is a frontend-only web app on Solana Devnet framing, wired against **mock data** matching the target Anchor IDL shapes so the swap to `program.account.X.fetch(...)` is mechanical when the IDL ships.

## 1. Project Architecture

- **Stack**: TanStack Start v1 (React 19, Vite 7) — already scaffolded. Tailwind v4 in `src/styles.css`. shadcn/ui components already present.
- **No backend for MVP**: Wallet Adapter is *not* wired to a live program yet. All reads/writes go through a `tenderService` abstraction backed by mock data; interface matches Anchor's `program.methods.*` / `program.account.*.fetch` shapes so it can be swapped 1:1 later.
- **Persistence**: In-memory + `localStorage` for created tenders / submitted bids during the demo session (so the "submit a bid, see it come back" flow from the Frontend Guide works without a chain).
- **Wallet UX**: Mocked "Connect Wallet" that assigns a deterministic devnet-shaped Pubkey to the session (Phantom-style flow, no real SPL calls). Persistent top-right button + "Devnet" badge on every page, per the Global Patterns section.
- **No new features, no workflow redesigns.** Exactly the 8 pages in the sitemap, in the order the Design Spec dictates.

## 2. Routing (TanStack file-based, in `src/routes/`)

```
/                         → Landing page (public)
/tenders                  → Citizen / Public Dashboard (searchable list)
/tenders/$tenderId        → Tender Detail (the "judge screenshot" page)
/tenders/$tenderId/bid    → Submit Bid wizard (3 steps)
/tenders/$tenderId/audit  → Blockchain / Audit Log standalone view
/admin                    → Admin Dashboard (government)
/admin/publish            → Publish Tender wizard (5 steps)
/company                  → Company Dashboard (bidder)
/about, /features, /how-it-works, /docs → Landing nav targets (content pages)
```

`__root.tsx` renders the global `<AppHeader />` (nav + wallet + Devnet badge), `<Outlet />`, and `<AppFooter />`. Admin and Company routes use a nested layout with the left sidebar spec'd on page 07.

## 3. Folder Structure

```
src/
  routes/                     TanStack file-routes (above)
    __root.tsx
    index.tsx
    tenders.tsx               (layout: <Outlet/>)
    tenders.index.tsx         (list = Citizen Dashboard)
    tenders.$tenderId.tsx     (detail — with tab state)
    tenders.$tenderId.bid.tsx
    tenders.$tenderId.audit.tsx
    admin.tsx                 (sidebar layout)
    admin.index.tsx
    admin.publish.tsx
    company.tsx               (sidebar layout)
    company.index.tsx
    about.tsx / features.tsx / how-it-works.tsx / docs.tsx
    sitemap[.]xml.ts
  components/
    layout/     AppHeader, AppFooter, SidebarNav, PageShell, DevnetBadge
    wallet/     WalletButton, WalletProvider (mock), AddressChip
    tender/     TenderCard, TenderTable, StatusBadge, CountdownTimer,
                ScoringFormulaWidget, ScoringDonut, RankedBidsTable,
                TenderDetailTabs, AuditLogTable, TxSignatureLink
    wizards/    PublishTenderWizard/{Step1Basic,Step2Timeline,Step3Eligibility,
                  Step4Scoring,Step5Review, WizardShell, StepRail}
                SubmitBidWizard/{Step1Info,Step2Documents,Step3Review}
    dashboard/  KpiCard, KpiRow, TendersOverTimeChart, StatusDonutChart,
                RecentActivityFeed, TopCategoriesList
    ui/         (existing shadcn — reused, brand-restyled via tokens)
  lib/
    tender-service.ts         Interface matching Anchor client shape
    mock-data.ts              Seed tenders + bids matching target schema
    scoring.ts                Locked-formula calculation (mirrors on-chain)
    format.ts                 NPR formatter, wallet truncation, countdown
    solana-mock.ts            Fake Pubkey generator, tx signature generator
  hooks/
    use-wallet.ts             Session wallet from mock provider
    use-tenders.ts, use-tender.ts, use-my-bids.ts, use-my-tenders.ts
    use-countdown.ts, use-mobile (existing)
  assets/
    logo/                     TenderChain primary/monochrome/dark/app-icon
  styles.css                  Brand tokens (see §6)
```

## 4. Shared Layouts

- **PublicShell** (via `__root.tsx`): top nav (Home / About / Features / How it Works / Docs), Connect Wallet button + Devnet badge, footer.
- **AdminShell** (`admin.tsx`): Deep-Navy left sidebar — Dashboard, My Tenders, Publish Tender, Bids, Companies, Analytics, Audit Logs, Citizen Portal, Settings (order locked by spec).
- **CompanyShell** (`company.tsx`): sidebar with Applications, Won, Lost, Trust Score, Performance.
- **Responsive rules from Page 09**: sidebar → icon rail (768–1199), slide-in nav + floating "+" (<768); KPI wrap 4→2→1; wizard rail → progress bar on mobile.

## 5. Components (feature-level)

- **ScoringFormulaWidget** — donut + explicit "Price 60% · Timeline 40% · Quality 0%" print. Rendered on Publish Step 4, Tender Detail header (top-right), and Ranked Bids. Never a tooltip.
- **RankedBidsTable** — shown only when tender is Finalized; winner row tinted Chain Green; wallets shown as `7xKX...9Qh2` chips.
- **AuditLogTable** — Action / Performed By (wallet) / Tx Signature (truncated, linked to Solana Explorer devnet URL) / Timestamp. Banner: "All actions are recorded on-chain and cannot be tampered with."
- **CountdownTimer** — live time-to-deadline; flips to "Closed" past deadline.
- **StatusBadge** — Open / Under Evaluation / Awarded / Cancelled (spec'd donut categories).
- **Wizards** — controlled by wizard reducer; `next` only advances; `publish`/`submit` on final step calls `tenderService.createTender` / `submitBid`.
- **Quality field** is *always* labeled "Self-reported — not independently verified" (Page 03 callout).

## 6. Design System (locked to Brand Identity)

`src/styles.css` `@theme` tokens (oklch equivalents of the brand hexes):

- `--brand-navy` `#0F172A` (Deep Navy, 60%) → `--background`, sidebars
- `--brand-purple` `#7C3AED` (Solana Purple, 20%) → `--primary`, accent word, primary CTAs
- `--brand-green` `#14F195` (Chain Green, 10%) → `--success`, winner highlight
- `--brand-sky` `#38BDF8` (Sky Blue, 5%) → `--info`, links, chart secondary
- `--brand-gray` `#F1F5F9` (5%) → surfaces
- `--brand-white` `#FFFFFF`

Typography — loaded via `<link>` in `__root.tsx` head:
- **Space Grotesk** (Bold / SemiBold) → `--font-display` (headings, KPIs, logo wordmark)
- **Inter** (Regular / Medium) → `--font-sans` (body, tables, forms)

Iconography: lucide-react filtered to the spec's set (shield, search, lock, chart, users, lightbulb, file, gavel, clock, building, cube). Rounded 8–12px radii, thin borders, generous whitespace. Gradient purple→green reserved for the footer strip and hero accent, per the brand sheet.

Existing shadcn tokens are remapped through `@theme inline` so `bg-primary`, `text-primary`, `bg-background` all pick up TenderChain colors automatically — no hardcoded classes in components.

## 7. State Management

- **Server state / data**: TanStack Query with a `tenderService` boundary.
  - `tenderService.listTenders()`, `getTender(id)`, `listBids(tenderId)`, `getMyBids(pubkey)`, `getMyTenders(pubkey)`, `createTender(input)`, `submitBid(input)`, `finalizeTender(id)`.
  - Query keys mirror future PDA shape: `["tender", tenderId]`, `["bid", tenderId, bidder]`.
  - Loaders use `context.queryClient.ensureQueryData(...)` + `useSuspenseQuery` per the modern-stack pattern.
- **Wallet state**: `MockWalletProvider` context (connected pubkey, connect/disconnect). Later swap for `@solana/wallet-adapter-react` without touching consumers.
- **UI state**: wizard steps via `useReducer` inside each wizard; tender-detail active tab via URL search param (`?tab=bids`) so it's shareable — required for the "judge screenshot" page.
- **Filters/search on Citizen Dashboard**: URL search params (`?category=&status=&q=`), validated via `validateSearch`.

## 8. Mock Data Strategy

- `src/lib/mock-data.ts` seeds ~8 tenders spanning Open / Under Evaluation / Awarded / Cancelled, each with 3–6 bids. Values use NPR budgets modeled on the real cases named in the Proposal (Pokhara airport, e-passport, NAC aircraft, NTV) so the demo is grounded in the same problem the deck describes.
- Types mirror the IDL exactly:

```ts
type Tender = {
  authority: string; tenderId: string; title: string; description: string;
  priceWeight: number; timelineWeight: number; qualityWeight: number;
  deadline: number; status: "Open" | "Finalized";
  winner: string | null;
  // UI-only fields (department, category, location, budgetNpr) live in a
  // sibling TenderMeta record so swapping to the on-chain fetch is clean.
};
type Bid = { tender: string; bidder: string; price: number;
  timelineDays: number; qualityCert: string; score: number | null; };
```

- `scoring.ts` implements the same weighted formula the Anchor program will run, so `finalizeTender` mock produces identical scores to what chain will produce.
- Session-created tenders/bids persist to `localStorage` keyed by mock wallet, cleared via a "Reset demo data" control in the footer (dev-only).
- Every mocked tx generates a fake 88-char base58 signature so the Audit Log and "View on Solana Explorer" links render realistically (link points to `explorer.solana.com/?cluster=devnet`).

---

### What's explicitly out of scope for this MVP build (per source docs)

- Real Anchor program calls / real Phantom signature flow (backend not yet shipped — Frontend Guide §6).
- Oracle-verified certifications (Roadmap item, not MVP).
- Multi-criteria scoring beyond price/timeline/quality weights.
- Mainnet-facing copy — Devnet badge is mandatory and universal.

Waiting for your approval before writing any code.

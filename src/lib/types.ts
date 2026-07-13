// Types mirror the target Anchor IDL from the Frontend Integration Guide.
// UI-only fields live on TenderMeta so swapping mock data for
// program.account.tender.fetch(...) is a mechanical change.

export type TenderStatus = "Open" | "UnderEvaluation" | "Finalized" | "Cancelled";

export interface Tender {
  authority: string;        // Pubkey
  tenderId: string;         // u64 as string for JS safety
  title: string;
  description: string;
  priceWeight: number;      // 0..100
  timelineWeight: number;   // 0..100
  qualityWeight: number;    // 0..100 (spec extends beyond guide's price+timeline)
  deadline: number;         // unix ms
  publishedAt: number;      // unix ms (UI helper)
  status: TenderStatus;
  winner: string | null;    // Pubkey or null
}

export interface TenderMeta {
  tenderId: string;
  department: string;
  category: string;
  location: string;
  budgetNpr: number;
  scopeOfWork: string[];
  eligibility: string[];
  documentsRequired: string[];
}

export interface Bid {
  tender: string;           // tenderId
  bidder: string;           // Pubkey
  bidderName?: string;      // UI convenience (never on-chain)
  price: number;            // NPR for MVP display
  timelineDays: number;
  qualityCert: string;      // self-reported
  notes?: string;
  score: number | null;
  submittedAt: number;
  signature: string;        // fake devnet tx signature
}

export type AuditActionKind =
  | "TenderPublished"
  | "BidSubmitted"
  | "TenderFinalized"
  | "WinnerAnnounced"
  | "TenderCancelled";

export interface AuditEntry {
  id: string;
  tenderId: string;
  action: AuditActionKind;
  performedBy: string;      // Pubkey
  timestamp: number;
  signature: string;        // devnet tx signature
  detail?: string;
}

// ---------------------------------------------------------------------------
// Extended domain models — used by the service layer. Kept intentionally close
// to what real Solana transaction / Anchor account responses will look like so
// the backend integration is a mechanical drop-in.
// ---------------------------------------------------------------------------

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet" | "localnet";

export interface Wallet {
  publicKey: string;                    // Base58 pubkey
  role: "authority" | "bidder" | null;
  displayName: string | null;
  connected: boolean;
  cluster: SolanaCluster;
}

export interface Transaction {
  signature: string;                    // 88-char base58 tx signature
  programId: string;                    // Anchor program ID
  wallet: string;                       // Fee-payer pubkey
  slot: number;
  blockTime: number;                    // unix ms
  confirmationStatus: "processed" | "confirmed" | "finalized";
  cluster: SolanaCluster;
  explorerUrl: string;                  // solana explorer deep link
  instruction: string;                  // e.g. "publish_tender"
  accounts: string[];                   // PDA accounts touched
}

export interface AuditRecord extends AuditEntry {
  transaction?: Transaction;
}

export interface Department {
  id: string;
  name: string;
  authorityPubkey: string;
  tendersPublished: number;
}

export interface Company {
  pubkey: string;
  name: string;
  registration: string;
  category: string;
  certifications: string[];
  trustScore: TrustScore;
  bidsSubmitted: number;
  bidsWon: number;
}

export interface TrustScore {
  value: number;                        // 0..100
  tier: "New" | "Emerging" | "Trusted" | "Elite";
  onTimeDelivery: number;               // 0..100
  qualityRating: number;                // 0..100
  disputeRate: number;                  // 0..100 (lower better)
  updatedAt: number;
}

export interface DashboardStats {
  totalTenders: number;
  active: number;
  finalized: number;
  totalValue: number;
  totalBids: number;
  companies: number;
  statusBreakdown: Record<TenderStatus, number>;
  buckets: Array<{ label: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
}


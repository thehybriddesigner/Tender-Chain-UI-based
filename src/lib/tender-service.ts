// tenderService — REAL implementation, wired to the deployed Solana program.
// Same exported function names/signatures as the mock version, so no
// component/UI code needs to change — only this file and solana.ts do.
//
// Cosmetic-only fields (department, category, location, budget, audits) are
// NOT part of the on-chain program. They're kept in localStorage exactly like
// before, purely for display — they never touch the chain.

import type { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  BN,
  SystemProgram,
  connection,
  friendlyError,
  getAllBidsForTender,
  getBidPda,
  getProgram,
  getTenderPda,
} from "./solana";
import type { AuditEntry, Bid, Tender, TenderMeta, TenderStatus } from "./types";

const STORAGE_KEY = "tenderchain::meta-store::v1"; // metas + audits only now
const isBrowser = typeof window !== "undefined";

interface MetaStore {
  metas: TenderMeta[];
  audits: AuditEntry[];
}

function loadMeta(): MetaStore {
  if (!isBrowser) return { metas: [], audits: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { metas: [], audits: [] };
  } catch {
    return { metas: [], audits: [] };
  }
}

function saveMeta(store: MetaStore) {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

let metaStore = loadMeta();

function commitMeta() {
  saveMeta(metaStore);
  if (isBrowser) window.dispatchEvent(new CustomEvent("tenderchain::mutate"));
}

// ---- Converting on-chain account shape -> the UI's existing Tender/Bid type ----

function decodeStatus(status: any): TenderStatus {
  if ("finalized" in status) return "Finalized";
  return "Open";
}

function toUiTender(publicKey: PublicKey, account: any): Tender {
  return {
    authority: account.authority.toBase58(),
    tenderId: account.tenderId.toString(),
    title: account.title,
    description: account.description,
    priceWeight: account.priceWeight,
    timelineWeight: account.timelineWeight,
    qualityWeight: 0, // not part of the real on-chain formula
    publishedAt: 0, // not stored on-chain; not available without indexing
    deadline: account.deadline.toNumber() * 1000, // seconds -> ms for existing UI
    status: decodeStatus(account.status),
    winner: account.winner ? account.winner.toBase58() : null,
  };
}

function toUiBid(account: any): Bid {
  return {
    tender: account.tender.toBase58(),
    bidder: account.bidder.toBase58(),
    price: Number(account.price.toString()),
    timelineDays: account.timelineDays,
    qualityCert: account.qualityCert,
    score: account.score ? Number(account.score.toString()) : null,
    submittedAt: 0, // not stored on-chain
    signature: "",
  };
}

// IMPORTANT — read this before wiring up a component:
// Every function below needs a `program` instance, which requires a connected
// wallet. Pass it in from your component like:
//   const wallet = useAnchorWallet();
//   const program = wallet ? getProgram(wallet) : null;
// and guard calls with `if (!program) return;` same as any wallet-gated action.

export const tenderService = {
  // ---- Reads ----------------------------------------------------------------

  async listTenders(program: Program): Promise<Tender[]> {
    const all = await (program.account as any).tender.all();
    return all
      .map((a: any) => toUiTender(a.publicKey, a.account))
      .sort((a: Tender, b: Tender) => Number(b.tenderId) - Number(a.tenderId));
  },

  async getTender(program: Program, tenderId: string): Promise<Tender | null> {
    try {
      const pda = getTenderPda(Number(tenderId));
      const account = await (program.account as any).tender.fetch(pda);
      return toUiTender(pda, account);
    } catch {
      return null; // account doesn't exist
    }
  },

  getMeta(tenderId: string): TenderMeta | null {
    return metaStore.metas.find((m) => m.tenderId === tenderId) ?? null;
  },

  async listBids(program: Program, tenderId: string): Promise<Bid[]> {
    const tenderPda = getTenderPda(Number(tenderId));
    const raw = await getAllBidsForTender(tenderPda);
    return raw.map((a) => {
      const decoded = (program.account as any).bid.coder.accounts.decode(
        "Bid",
        a.account.data
      );
      return toUiBid(decoded);
    });
  },

  async getMyBids(
    program: Program,
    pubkey: string | null
  ): Promise<Array<{ bid: Bid; tender: Tender }>> {
    if (!pubkey) return [];
    const allBids = await (program.account as any).bid.all([
      { memcmp: { offset: 8 + 32, bytes: pubkey } },
    ]);
    const results: Array<{ bid: Bid; tender: Tender }> = [];
    for (const a of allBids) {
      const bid = toUiBid(a.account);
      const tender = await tenderService.getTender(program, bid.tender);
      if (tender) results.push({ bid, tender });
    }
    return results;
  },

  async getMyTenders(program: Program, pubkey: string | null): Promise<Tender[]> {
    if (!pubkey) return [];
    const all = await tenderService.listTenders(program);
    return all.filter((t) => t.authority === pubkey);
  },

  listAudits(tenderId?: string): AuditEntry[] {
    const all = [...metaStore.audits].sort((a, b) => b.timestamp - a.timestamp);
    return tenderId ? all.filter((a) => a.tenderId === tenderId) : all;
  },

  // ---- Writes -----------------------------------------------------------------
  // Each of these sends a REAL transaction to devnet and waits for confirmation.

  async createTender(
    program: Program,
    payer: PublicKey,
    input: {
      title: string;
      description: string;
      priceWeight: number;
      timelineWeight: number;
      deadline: number; // ms, same as existing UI passes in
      meta: Omit<TenderMeta, "tenderId">;
    }
  ): Promise<Tender> {
    const tenderId = Math.floor(Date.now() / 1000);
    const tenderPda = getTenderPda(tenderId);
    const deadlineSeconds = Math.floor(input.deadline / 1000);

    const sig = await program.methods
      .createTender(
        new BN(tenderId),
        input.title,
        input.description,
        input.priceWeight,
        input.timelineWeight,
        new BN(deadlineSeconds)
      )
      .accounts({
        payer,
        tender: tenderPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const meta: TenderMeta = { tenderId: String(tenderId), ...input.meta };
    metaStore = {
      metas: [meta, ...metaStore.metas],
      audits: [
        {
          id: `${tenderId}-publish`,
          tenderId: String(tenderId),
          action: "TenderPublished",
          performedBy: payer.toBase58(),
          timestamp: Date.now(),
          signature: sig,
          detail: `Locked formula: Price ${input.priceWeight}% · Timeline ${input.timelineWeight}%`,
        },
        ...metaStore.audits,
      ],
    };
    commitMeta();

    const account = await (program.account as any).tender.fetch(tenderPda);
    return toUiTender(tenderPda, account);
  },

  async submitBid(
    program: Program,
    bidder: PublicKey,
    input: {
      tenderId: string;
      price: number;
      timelineDays: number;
      qualityCert: string;
    }
  ): Promise<Bid> {
    const tenderIdNum = Number(input.tenderId);
    const tenderPda = getTenderPda(tenderIdNum);
    const bidPda = getBidPda(tenderIdNum, bidder);

    console.log("[tenderService.submitBid] derived PDAs", {
      tenderIdNum,
      tenderPda: tenderPda.toBase58(),
      bidPda: bidPda.toBase58(),
      bidder: bidder.toBase58(),
      input,
    });

    let sig: string;
    try {
      console.log("[tenderService.submitBid] sending .rpc()…");
      sig = await program.methods
        .submitBid(
          new BN(tenderIdNum),
          new BN(input.price),
          input.timelineDays,
          input.qualityCert
        )
        .accounts({
          bidder,
          bid: bidPda,
          tender: tenderPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("[tenderService.submitBid] .rpc() resolved, signature:", sig);
    } catch (err) {
      console.error("[tenderService.submitBid] .rpc() threw — raw error:", err);
      throw new Error(friendlyError(err));
    }

    metaStore = {
      ...metaStore,
      audits: [
        {
          id: `${input.tenderId}-bid-${bidder.toBase58()}`,
          tenderId: input.tenderId,
          action: "BidSubmitted",
          performedBy: bidder.toBase58(),
          timestamp: Date.now(),
          signature: sig,
          detail: `Bid @ NPR ${input.price.toLocaleString("en-IN")} · ${input.timelineDays} days`,
        },
        ...metaStore.audits,
      ],
    };
    commitMeta();

    const account = await (program.account as any).bid.fetch(bidPda);
    return toUiBid(account);
  },

  async finalizeTender(
    program: Program,
    authority: PublicKey,
    tenderId: string
  ): Promise<Tender> {
    const tenderIdNum = Number(tenderId);
    const tenderPda = getTenderPda(tenderIdNum);
    const allBidAccounts = await getAllBidsForTender(tenderPda);

    const remainingAccounts = allBidAccounts.map((a) => ({
      pubkey: a.pubkey,
      isWritable: false,
      isSigner: false,
    }));

    let sig: string;
    try {
      sig = await program.methods
        .finalizeTender()
        .accounts({ tender: tenderPda, authority })
        .remainingAccounts(remainingAccounts)
        .rpc();
    } catch (err) {
      throw new Error(friendlyError(err));
    }

    const now = Date.now();
    const account = await (program.account as any).tender.fetch(tenderPda);
    const updated = toUiTender(tenderPda, account);

    metaStore = {
      ...metaStore,
      audits: [
        {
          id: `${tenderId}-winner-${now}`,
          tenderId,
          action: "WinnerAnnounced",
          performedBy: authority.toBase58(),
          timestamp: now + 1000,
          signature: sig,
          detail: updated.winner ? `Winner: ${updated.winner}` : "No bids received.",
        },
        {
          id: `${tenderId}-finalize-${now}`,
          tenderId,
          action: "TenderFinalized",
          performedBy: authority.toBase58(),
          timestamp: now,
          signature: sig,
          detail: "Locked formula executed on-chain — result independently verifiable.",
        },
        ...metaStore.audits,
      ],
    };
    commitMeta();

    return updated;
  },

  reset() {
    if (isBrowser) window.localStorage.removeItem(STORAGE_KEY);
    metaStore = { metas: [], audits: [] };
    if (isBrowser) window.dispatchEvent(new CustomEvent("tenderchain::mutate"));
  },

  // ---- Derived KPIs -----------------------------------------------------------
  // NOTE: now async (real network calls). Call from useEffect, not synchronously.
  async stats(program: Program) {
    const tenders = await tenderService.listTenders(program);
    const totalTenders = tenders.length;
    const active = tenders.filter((t) => t.status === "Open").length;
    const finalized = tenders.filter((t) => t.status === "Finalized").length;
    const totalValue = metaStore.metas.reduce((sum, m) => sum + (m.budgetNpr ?? 0), 0);

    let totalBids = 0;
    const biddersSet = new Set<string>();
    for (const t of tenders) {
      const bids = await tenderService.listBids(program, t.tenderId);
      totalBids += bids.length;
      bids.forEach((b) => biddersSet.add(b.bidder));
    }

    const statusBreakdown: Record<TenderStatus, number> = {
      Open: 0, UnderEvaluation: 0, Finalized: 0, Cancelled: 0,
    };
    for (const t of tenders) statusBreakdown[t.status]++;

    return {
      totalTenders,
      active,
      finalized,
      totalValue,
      totalBids,
      companies: biddersSet.size,
      statusBreakdown,
      buckets: [],
      topCategories: metaStore.metas.reduce((acc: any[], m) => {
        const existing = acc.find((c) => c.category === m.category);
        if (existing) existing.count++;
        else acc.push({ category: m.category, count: 1 });
        return acc;
      }, []),
    };
  },
};

export type TenderService = typeof tenderService;

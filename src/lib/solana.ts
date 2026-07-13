// solana.ts — REAL Solana/Anchor connection layer.
// Replaces solana-mock.ts. Provides the wallet, connection, and program
// instance that tender-service.ts uses to make real on-chain calls.

import { Connection, PublicKey, SystemProgram, clusterApiUrl } from "@solana/web3.js";
import anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import idl from "./tender_tracker.json"; // <-- paste the real IDL file here, same folder

const { AnchorProvider, BN, Program: AnchorProgram } = anchor;

export const PROGRAM_ID = new PublicKey(idl.address);

// The public api.devnet.solana.com endpoint is shared across the whole
// internet and rate-limits hard (HTTP 429) under any real usage — a single
// "Submit Bid" click does several RPC round trips back to back (fetch
// account, simulate, send, poll for confirmation), which is enough to trip
// it. Set VITE_SOLANA_RPC_URL to a dedicated devnet endpoint (Helius,
// QuickNode, Alchemy, Triton, Ankr all have free devnet tiers) to fix this
// for real. Falls back to the public endpoint if unset, which is fine for
// occasional local testing but WILL 429 under normal app usage.
export const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl("devnet");
export const connection = new Connection(RPC_URL, "confirmed");

if (typeof window !== "undefined") {
  console.log(
    "[solana.ts] using RPC endpoint:",
    RPC_URL,
    RPC_URL.includes("api.devnet.solana.com")
      ? "⚠️ PUBLIC endpoint — set VITE_SOLANA_RPC_URL in .env to fix 429s"
      : "✓ dedicated endpoint"
  );
}

export { BN, SystemProgram };

// ---- PDA derivation (must match Rust seeds exactly) ------------------------

export function getTenderPda(tenderId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tender"), new BN(tenderId).toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return pda;
}

export function getBidPda(tenderId: number, bidder: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("bid"),
      new BN(tenderId).toArrayLike(Buffer, "le", 8),
      bidder.toBuffer(),
    ],
    PROGRAM_ID
  );
  return pda;
}

// ---- Program instance -------------------------------------------------------
// Call this once you have a connected wallet (from wallet-adapter's useAnchorWallet())
// AND its sendTransaction function (from useWallet()). Passing sendTransaction
// in lets AnchorProvider use Phantom's preferred signAndSendTransaction path
// instead of the default signTransaction()+manual-send path, which can get
// stuck behind Phantom's Blowfish security simulation for unrecognized
// programs (sometimes for several minutes) — sendTransaction avoids that.

export function getProgram(wallet: Wallet, sendTransaction?: any): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    ...(sendTransaction
      ? {
          sendAndConfirm: async (tx: any) => {
            const sig = await sendTransaction(tx, connection);
            await connection.confirmTransaction(sig, "confirmed");
            return sig;
          },
        }
      : {}),
  } as any);
  return new AnchorProgram(idl as any, provider) as Program;
}

// ---- Fetch all Bid accounts for a given tender (for finalize_tender) -------
// NOTE: dataSize filter uses the real compiled size of the Bid account.
// If this ever returns zero results unexpectedly, that number is the first
// thing to double check (8 + Bid::INIT_SPACE from the Rust struct).
const BID_ACCOUNT_DATA_SIZE = 8 + 32 + 32 + 8 + 4 + (4 + 300) + (1 + 8);

export async function getAllBidsForTender(tenderPda: PublicKey) {
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { dataSize: BID_ACCOUNT_DATA_SIZE },
      { memcmp: { offset: 8, bytes: tenderPda.toBase58() } },
    ],
  });
  return accounts; // [{ pubkey, account: { data, ... } }, ...]
}

// ---- Error helper -----------------------------------------------------------
// Anchor errors surface with a nested errorCode.code string. This turns them
// into clean, human messages instead of raw stack traces.

export function friendlyError(err: any): string {
  const code = err?.error?.errorCode?.code;
  if (code === "DeadlinePassed") return "Bidding has closed for this tender.";
  if (code === "Unauthorized") return "Only the tender's authority can do this.";
  return err?.message ?? "Something went wrong while sending the transaction.";
}

// ---- Fake-signature helper kept for audit-log display only ------------------
// (Real transaction signatures come back from .rpc() itself — see tender-service.ts.
// This is only used for anything cosmetic that never touches the chain, like
// meta annotations, if still needed by existing UI.)
export function shortAddress(pubkey: string, chars = 4): string {
  if (!pubkey || pubkey.length < chars * 2) return pubkey;
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

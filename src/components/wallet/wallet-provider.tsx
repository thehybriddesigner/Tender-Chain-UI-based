import * as React from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet as useSolanaWallet,
} from "@solana/wallet-adapter-react";
import { getProgram, RPC_URL } from "@/lib/solana";
import type { Program } from "@coral-xyz/anchor";
import type { WalletAdapter } from "@solana/wallet-adapter-base";

interface WalletContextValue {
  publicKey: string | null;
  connecting: boolean;
  connected: boolean;
  role: "authority" | "bidder" | null;
  bidderName: string | null;
  program: Program | null;
  connect: (role: "authority" | "bidder", displayName?: string) => Promise<string>;
  disconnect: () => void;
}

const WalletContext = React.createContext<WalletContextValue | null>(null);
const ROLE_KEY = "tenderchain::role::v1";

function InnerWalletBridge({ children }: { children: React.ReactNode }) {
  const solanaWallet = useSolanaWallet();
  const [role, setRole] = React.useState<"authority" | "bidder" | null>(null);
  const [bidderName, setBidderName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem(ROLE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setRole(parsed.role);
      setBidderName(parsed.bidderName ?? null);
    }
  }, []);

  React.useEffect(() => {
    if (!solanaWallet.wallet && solanaWallet.wallets.length > 0) {
      solanaWallet.select(solanaWallet.wallets[0].adapter.name);
    }
  }, [solanaWallet.wallet, solanaWallet.wallets, solanaWallet.select]);

  // Passing sendTransaction through lets getProgram use Phantom's fast
  // signAndSendTransaction path instead of the slow signTransaction+manual
  // send path (which can hang for minutes behind Phantom's Blowfish
  // simulation for a new/unrecognized program).
  const program = React.useMemo(() => {
    if (!solanaWallet.publicKey || !solanaWallet.signTransaction) return null;
    const anchorWallet = {
      publicKey: solanaWallet.publicKey,
      signTransaction: solanaWallet.signTransaction,
      signAllTransactions: solanaWallet.signAllTransactions,
    };
    return getProgram(anchorWallet as any, solanaWallet.sendTransaction);
  }, [
    solanaWallet.publicKey,
    solanaWallet.signTransaction,
    solanaWallet.signAllTransactions,
    solanaWallet.sendTransaction,
  ]);

  const connect = React.useCallback(
    (r: "authority" | "bidder", displayName?: string): Promise<string> => {
      const next = { role: r, bidderName: displayName ?? null };
      localStorage.setItem(ROLE_KEY, JSON.stringify(next));
      setRole(r);
      setBidderName(displayName ?? null);

      const walletName = solanaWallet.wallet?.adapter.name ?? solanaWallet.wallets[0]?.adapter.name;
      if (!walletName) {
        return Promise.reject(
          new Error("Wallet not ready yet — please try again in a moment, or install Phantom.")
        );
      }
      if (!solanaWallet.wallet) solanaWallet.select(walletName);

      // Calling the PROVIDER's own connect() (not the raw adapter directly)
      // keeps solanaWallet.connected/publicKey properly in sync.
      return solanaWallet
        .connect()
        .then(() => solanaWallet.publicKey?.toBase58() ?? "");
    },
    [solanaWallet]
  );

  const disconnect = React.useCallback(() => {
    solanaWallet.disconnect();
    localStorage.removeItem(ROLE_KEY);
    setRole(null);
  }, [solanaWallet]);

  const value: WalletContextValue = {
    publicKey: solanaWallet.publicKey?.toBase58() ?? null,
    connecting: solanaWallet.connecting,
    connected: solanaWallet.connected,
    role,
    bidderName,
    program,
    connect,
    disconnect,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = React.useState<WalletAdapter[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    import("@solana/wallet-adapter-wallets").then(
      ({ PhantomWalletAdapter, SolflareWalletAdapter }) => {
        if (!cancelled) {
          setWallets([new PhantomWalletAdapter(), new SolflareWalletAdapter()]);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <InnerWalletBridge>{children}</InnerWalletBridge>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = React.useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}

import * as React from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet as useSolanaWallet,
} from "@solana/wallet-adapter-react";
import { getProgram, RPC_URL } from "@/lib/solana";
import type { Program } from "@coral-xyz/anchor";
import type { WalletAdapter, WalletName } from "@solana/wallet-adapter-base";

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

type WalletOption = { adapter: { name: WalletName } };
type PendingConnect = {
  walletName: WalletName;
  resolve: (publicKey: string) => void;
  reject: (error: unknown) => void;
};

function getPreferredWalletName(wallets: WalletOption[]): WalletName | null {
  return (
    wallets.find((wallet) => wallet.adapter.name === "Phantom")?.adapter.name ??
    wallets.find((wallet) => wallet.adapter.name.toString().toLowerCase().includes("phantom"))
      ?.adapter.name ??
    wallets[0]?.adapter.name ??
    null
  );
}

function InnerWalletBridge({ children }: { children: React.ReactNode }) {
  const solanaWallet = useSolanaWallet();
  const [role, setRole] = React.useState<"authority" | "bidder" | null>(null);
  const [bidderName, setBidderName] = React.useState<string | null>(null);
  const [pendingConnect, setPendingConnect] = React.useState<PendingConnect | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem(ROLE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setRole(parsed.role);
      setBidderName(parsed.bidderName ?? null);
    }
  }, []);

  React.useEffect(() => {
    const preferredWalletName = getPreferredWalletName(solanaWallet.wallets);
    if (
      preferredWalletName &&
      solanaWallet.wallet?.adapter.name !== preferredWalletName
    ) {
      solanaWallet.select(preferredWalletName);
    }
  }, [solanaWallet.wallet, solanaWallet.wallets, solanaWallet.select]);

  React.useEffect(() => {
    if (!pendingConnect) return;
    if (solanaWallet.wallet?.adapter.name !== pendingConnect.walletName) return;

    let cancelled = false;
    solanaWallet
      .connect()
      .then(() => {
        if (cancelled) return;
        pendingConnect.resolve(solanaWallet.publicKey?.toBase58() ?? "");
        setPendingConnect(null);
      })
      .catch((error) => {
        if (cancelled) return;
        pendingConnect.reject(error);
        setPendingConnect(null);
      });

    return () => {
      cancelled = true;
    };
  }, [
    pendingConnect,
    solanaWallet.connect,
    solanaWallet.publicKey,
    solanaWallet.wallet?.adapter.name,
  ]);

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

      const walletName = getPreferredWalletName(solanaWallet.wallets);
      if (!walletName) {
        throw new Error("Wallet not ready yet — please try again in a moment, or install Phantom.");
      }
      if (solanaWallet.wallet?.adapter.name !== walletName) {
        solanaWallet.select(walletName);
      }

      return new Promise((resolve, reject) => {
        setPendingConnect({ walletName, resolve, reject });
      });
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

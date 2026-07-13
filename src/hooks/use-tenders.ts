import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { tenderService } from "@/lib/tender-service";
import { useWallet } from "@/components/wallet/wallet-provider";

// Subscribe to service mutations so all queries auto-refresh across tabs/routes.
export function useTenderStoreVersion() {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const handler = () => setV((x) => x + 1);
    window.addEventListener("tenderchain::mutate", handler);
    return () => window.removeEventListener("tenderchain::mutate", handler);
  }, []);
  return v;
}

export function useTenders() {
  const v = useTenderStoreVersion();
  const { program } = useWallet();
  return useQuery({
    queryKey: ["tenders", v],
    queryFn: () => tenderService.listTenders(program!),
    enabled: !!program,
    staleTime: 0,
  });
}

export function useTender(tenderId: string) {
  const v = useTenderStoreVersion();
  const { program } = useWallet();
  return useQuery({
    queryKey: ["tender", tenderId, v],
    queryFn: async () => {
      const tender = await tenderService.getTender(program!, tenderId);
      const meta = tenderService.getMeta(tenderId);
      const bids = tender ? await tenderService.listBids(program!, tenderId) : [];
      const audits = tenderService.listAudits(tenderId);
      return { tender, meta, bids, audits };
    },
    enabled: !!program,
  });
}

export function useAudits(tenderId?: string) {
  const v = useTenderStoreVersion();
  // Audits are local-only (not on-chain), so this one doesn't need `program` at all.
  return useQuery({
    queryKey: ["audits", tenderId ?? "all", v],
    queryFn: () => tenderService.listAudits(tenderId),
  });
}

export function useStats() {
  const v = useTenderStoreVersion();
  const { program } = useWallet();
  return useQuery({
    queryKey: ["stats", v],
    queryFn: () => tenderService.stats(program!),
    enabled: !!program,
  });
}

export function useMyBids(pubkey: string | null) {
  const v = useTenderStoreVersion();
  const { program } = useWallet();
  return useQuery({
    queryKey: ["my-bids", pubkey, v],
    queryFn: () => tenderService.getMyBids(program!, pubkey),
    enabled: !!program,
  });
}

export function useMyTenders(pubkey: string | null) {
  const v = useTenderStoreVersion();
  const { program } = useWallet();
  return useQuery({
    queryKey: ["my-tenders", pubkey, v],
    queryFn: () => tenderService.getMyTenders(program!, pubkey),
    enabled: !!program,
  });
}

export function useCountdownTick(intervalMs = 1000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

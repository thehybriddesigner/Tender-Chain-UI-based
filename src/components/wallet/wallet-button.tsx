import * as React from "react";
import { Copy, LogOut, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWallet } from "./wallet-provider";
import { truncateAddress } from "@/lib/format";
import { toast } from "sonner";

export function WalletButton() {
  const wallet = useWallet();
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState<"authority" | "bidder">("bidder");
  const [name, setName] = React.useState("");

  const onConnect = async () => {
    try {
      await wallet.connect(role, name.trim() || undefined);
      setOpen(false);
      toast.success("Wallet connected", {
        description: `You are signed in as ${role === "authority" ? "an issuing authority" : "a bidder"}.`,
      });
    } catch (e) {
      toast.error("Could not connect wallet");
    }
  };

  const copy = async () => {
    if (!wallet.publicKey) return;
    await navigator.clipboard.writeText(wallet.publicKey);
    toast.success("Wallet address copied");
  };

  if (!wallet.connected || !wallet.publicKey) {
    return (
      <>
        <Button onClick={() => setOpen(true)} className="font-medium">
          Connect Wallet
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                TenderChain is on Solana Devnet. Choose the role you want to preview
                as — the app will mint a session wallet for the demo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Role
                </Label>
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setRole(v as "authority" | "bidder")}
                  className="mt-2 grid grid-cols-2 gap-2"
                >
                  <label
                    htmlFor="role-bidder"
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem id="role-bidder" value="bidder" />
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Building2 className="size-4" /> Bidder
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submit bids on open tenders
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="role-authority"
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem id="role-authority" value="authority" />
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <User className="size-4" /> Authority
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Publish & finalize tenders
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Display name (optional)
                </Label>
                <Input
                  id="name"
                  placeholder={role === "authority" ? "e.g. Kathmandu Metropolitan City" : "e.g. Himal Infra Pvt. Ltd."}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Your wallet address is what actually ties you to your bids — display names are UI convenience only.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={onConnect} disabled={wallet.connecting}>
                {wallet.connecting ? "Connecting..." : "Connect"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 font-mono text-xs">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          {truncateAddress(wallet.publicKey)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Connected {wallet.role}
          </div>
          {wallet.bidderName && (
            <div className="mt-0.5 truncate text-sm font-normal">{wallet.bidderName}</div>
          )}
          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {wallet.publicKey}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copy}>
          <Copy className="mr-2 size-4" /> Copy address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={wallet.disconnect} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AddressChip({ address, className }: { address: string; className?: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(address);
    toast.success("Wallet address copied");
  };
  return (
    <button
      onClick={copy}
      title={address}
      className={
        "inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/80 hover:bg-accent " +
        (className ?? "")
      }
    >
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      {truncateAddress(address)}
    </button>
  );
}

export function DevnetBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-warning-foreground">
      <span className="size-1.5 rounded-full bg-warning" aria-hidden />
      Devnet
    </span>
  );
}

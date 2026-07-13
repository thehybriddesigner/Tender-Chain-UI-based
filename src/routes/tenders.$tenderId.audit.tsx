import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditLogTable } from "@/components/tender/audit-log-table";
import { StatusBadge } from "@/components/tender/status-badge";
import { useTender } from "@/hooks/use-tenders";

export const Route = createFileRoute("/tenders/$tenderId/audit")({
  loader: ({ params }) => ({ tenderId: params.tenderId }),
  head: () => ({
    meta: [
      { title: "Audit log — TenderChain" },
      {
        name: "description",
        content: "Tamper-evident action trail for this tender, linked directly to Solana Explorer.",
      },
    ],
  }),
  component: TenderAuditPage,
});

function TenderAuditPage() {
  const { tenderId } = Route.useParams();
  const { data, isLoading } = useTender(tenderId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md py-24 text-center text-sm text-muted-foreground">
        Loading tender…
      </div>
    );
  }

  if (!data || !data.tender) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-2xl font-semibold">Tender not found</h1>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/tenders">Back to all tenders</Link>
        </Button>
      </div>
    );
  }

  const { tender, audits } = data;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/tenders/$tenderId"
        params={{ tenderId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to tender
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <StatusBadge status={tender.status} />
        <span className="text-xs font-mono text-muted-foreground">Tender · {tender.tenderId}</span>
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Blockchain audit log</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every action on this tender — publication, bid submission, finalization, winner
        announcement — is recorded on Solana Devnet and independently verifiable off-platform.
      </p>
      <div className="mt-6">
        <AuditLogTable entries={audits} />
      </div>
    </div>
  );
}

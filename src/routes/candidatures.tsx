import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, PartyPopper, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyLogo, EmptyState, PageHeader, STATUS, StatusBadge } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { offerOf } from "@/lib/mock-data";
import type { AppStatus } from "@/lib/rules";
import { fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/candidatures")({
  head: () => ({
    meta: [
      { title: "Mes candidatures — StageManager" },
      { name: "description", content: "Suivez le statut de toutes vos candidatures de stage." },
      { property: "og:title", content: "Mes candidatures — StageManager" },
      { property: "og:description", content: "Suivez le statut de toutes vos candidatures de stage." },
    ],
  }),
  component: Applications,
});

function Applications() {
  const { applications, confirm, confirmed } = useStore();
  const [q, setQ] = useState("");
  const [st, setSt] = useState<"all" | AppStatus>("all");
  const [pick, setPick] = useState<string | null>(null);
  const accepted = applications.filter((a) => a.status === "acceptee");
  const list = applications.filter((a) => (st === "all" || a.status === st) && offerOf(a.offerId).title.toLowerCase().includes(q.toLowerCase()));
  const pickOffer = pick ? offerOf(applications.find((a) => a.id === pick)!.offerId) : null;

  return (
    <div>
      <PageHeader title="Mes candidatures" desc={`${applications.length} candidature${applications.length > 1 ? "s" : ""} au total`} />

      {!confirmed && accepted.length > 0 && (
        <div className="card-surface mb-6 border-success/30 bg-success-soft p-5">
          <div className="flex items-start gap-3"><PartyPopper className="mt-0.5 size-5 text-success" />
            <div className="flex-1"><p className="font-semibold">Félicitations, vous avez {accepted.length} proposition{accepted.length > 1 ? "s" : ""} de stage</p>
              <p className="mt-1 text-sm text-muted-foreground">Vous ne pouvez confirmer qu'une seule entreprise. Les autres seront informées de votre décision.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{accepted.map((a) => { const o = offerOf(a.offerId); return (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border bg-card p-3"><CompanyLogo id={o.companyId} size="sm" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{o.title}</p><p className="text-xs text-muted-foreground">{o.location}</p></div>
                  <Button size="sm" onClick={() => setPick(a.id)}>Choisir</Button></div>); })}</div>
            </div></div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une candidature…" className="h-9 w-full rounded-md border bg-card pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-ring/30" /></div>
        <Select value={st} onValueChange={(v) => setSt(v as typeof st)}><SelectTrigger className="bg-card sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous les statuts</SelectItem>{(Object.keys(STATUS) as AppStatus[]).map((k) => <SelectItem key={k} value={k}>{STATUS[k].label}</SelectItem>)}</SelectContent></Select>
      </div>

      {list.length === 0 ? <EmptyState icon={FileText} title="Aucune candidature" desc="Aucune candidature ne correspond à ces critères." action={<Button asChild><Link to="/offres">Parcourir les offres</Link></Button>} /> : (
        <div className="card-surface overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b bg-muted px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid"><span>Stage</span><span>Date</span><span>Statut</span><span className="w-24 text-right">Actions</span></div>
          <ul className="divide-y">{list.map((a) => { const o = offerOf(a.offerId); return (
            <li key={a.id} className="grid gap-3 px-5 py-4 transition-colors hover:bg-muted/50 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center md:gap-4">
              <div className="flex items-center gap-3"><CompanyLogo id={o.companyId} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-medium">{o.title}</p><p className="text-xs text-muted-foreground">FINCA RDC · {o.department}</p></div></div>
              <span className="text-sm text-muted-foreground"><span className="md:hidden">Envoyée le </span>{fmtDate(a.date)}</span>
              <span><StatusBadge status={a.status} /></span>
              <div className="flex gap-2 md:w-24 md:justify-end">
                {a.status === "acceptee" && !confirmed ? <Button size="sm" onClick={() => setPick(a.id)}>Choisir</Button>
                  : a.status === "confirmee" ? <Button size="sm" asChild><Link to="/stage">Mon stage</Link></Button>
                  : <Button size="sm" variant="outline" asChild><Link to="/offres/$id" params={{ id: o.id }}>Voir</Link></Button>}
              </div>
            </li>); })}</ul>
        </div>
      )}

      <AlertDialog open={!!pick} onOpenChange={(v) => !v && setPick(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmer ce stage ?</AlertDialogTitle>
            <AlertDialogDescription>Vous allez confirmer « {pickOffer?.title} ». Ce choix est définitif : les autres propositions seront déclinées et les entreprises concernées informées.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirm(pick!); setPick(null); toast.success("Stage confirmé", { description: "La rubrique « Mon stage » est désormais active." }); }}>Confirmer mon choix</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

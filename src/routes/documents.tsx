import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Download, Eye, FileText, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, SectionCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Mes documents — StageManager" },
      { name: "description", content: "Attestation de fin de stage et documents transmis par l'entreprise." },
      { property: "og:title", content: "Mes documents — StageManager" },
      { property: "og:description", content: "Attestation de fin de stage et documents transmis par l'entreprise." },
    ],
  }),
  component: Documents,
});

function Documents() {
  const { documents, confirmed } = useStore();
  const demo = () => toast.info("Document de démonstration", { description: "Le fichier sera disponible une fois le stockage connecté." });
  return (
    <div>
      <PageHeader title="Mes documents" desc="Documents mis à disposition par l'entreprise" />
      <SectionCard title="Attestation de fin de stage" className="mb-6">
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4"><Award className="size-5 text-accent" /><p className="text-sm text-muted-foreground">{confirmed ? "Votre attestation sera déposée ici par FINCA RDC à la fin de votre stage." : "Disponible après confirmation et réalisation d'un stage."}</p></div>
      </SectionCard>
      {documents.length === 0 ? <EmptyState icon={FolderOpen} title="Aucun document pour le moment" desc="Les documents transmis par l'entreprise apparaîtront ici après la confirmation de votre stage." action={<Button asChild variant="outline"><Link to="/candidatures">Mes candidatures</Link></Button>} /> : (
        <div className="card-surface divide-y">{documents.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-md bg-danger-soft text-destructive"><FileText className="size-4" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.category} · {d.type} · {d.size} · ajouté le {fmtDate(d.date)}</p></div>
            <Button variant="outline" size="sm" onClick={demo}><Eye className="size-4" />Consulter</Button>
            <Button variant="outline" size="sm" onClick={demo}><Download className="size-4" />Télécharger</Button>
          </div>))}</div>
      )}
    </div>
  );
}

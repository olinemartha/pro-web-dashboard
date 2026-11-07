import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Printer } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Mes documents — StageManager" },
      { name: "description", content: "Consultez, téléchargez et imprimez vos documents de stage." },
    ],
  }),
  component: DocumentsPage,
});

const DOCS = [
  { id: "d1", name: "CV_Grace_Mukendi.pdf", category: "Entreprise", date: "2026-10-02", size: "248 Ko" },
  { id: "d2", name: "Lettre d'affectation.pdf", category: "Stage", date: "2026-11-06", size: "184 Ko" },
  { id: "d3", name: "Règlement intérieur FINCA RDC.pdf", category: "Stage", date: "2026-11-06", size: "412 Ko" },
];

function DocumentsPage() {
  return (
    <div>
      <PageHeader title="Mes documents" desc="Consultez, téléchargez et imprimez vos documents : CV, pièces déposées, diplômes, certificats et attestation de fin de stage." />

      <SectionCard title="Documents disponibles">
        <div className="divide-y">
          {DOCS.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-3 py-3 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.category} · {d.size}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="size-4" /></Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Printer className="size-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Attestation de fin de stage">
        <div className="rounded-lg border p-5 text-center text-sm">
          <p className="text-muted-foreground mb-3">Votre attestation sera disponible ici après validation par l'entreprise.</p>
          <p className="text-xs text-muted-foreground">Elle comportera une référence unique et un QR code permettant d'en vérifier l'authenticité.</p>
        </div>
      </SectionCard>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, Download, FileText, Printer, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ARROW_NUDGE,
  ActionMenu,
  EmptyNote,
  FilterChips,
  MenuItem,
  PageIntro,
  SECTION_LINK,
  SectionHeader,
  rowActionClass,
} from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { fmtDate } from "@/lib/dates";
import { internshipExtras } from "@/lib/mock-data";
import { useMyAssignment, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Mes documents — StageManager" },
      { name: "description", content: "Consultez, téléchargez et imprimez vos documents de stage." },
    ],
  }),
  component: DocumentsPage,
});

type Category = "tous" | "personnels" | "stage";

type DocRow = { id: string; name: string; category: Exclude<Category, "tous">; source: string; date: string; size: string };

function DocumentsPage() {
  const { profile, applications } = useStore();
  const [filter, setFilter] = useState<Category>("tous");
  const confirmedApp = applications.find((a) => a.status === "confirmee");
  const confirmed = Boolean(confirmedApp);
  const assignment = useMyAssignment(confirmedApp?.candidateId);
  const end = assignment?.intern.end ?? internshipExtras.end;

  const docs: DocRow[] = [
    ...(profile.cv
      ? [{ id: "cv", name: profile.cv.name, category: "personnels" as const, source: "Votre CV", date: profile.cv.date.slice(0, 10), size: `${Math.round(profile.cv.size / 1000)} Ko` }]
      : []),
    ...(confirmed
      ? internshipExtras.documents.map((doc) => ({
          id: doc.id,
          name: doc.name,
          category: "stage" as const,
          source: "Envoyé par FINCA RDC",
          date: doc.date,
          size: doc.size,
        }))
      : []),
  ];
  const count = (category: Exclude<Category, "tous">) => docs.filter((doc) => doc.category === category).length;
  const list = filter === "tous" ? docs : docs.filter((doc) => doc.category === filter);

  const download = (name: string) => toast.success("Téléchargement lancé", { description: name });
  const print = (name: string) => toast.success("Impression préparée", { description: name });

  return (
    <div className="space-y-6">
      <PageIntro desc="Retrouvez vos pièces personnelles, les documents envoyés par l'entreprise et, à la fin du stage, votre attestation." />

      <div className="flex flex-col gap-6">
        <Reveal as="section" className="card-surface overflow-hidden" aria-labelledby="docs-title">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b px-5 pb-3.5 pt-4">
            <h2 id="docs-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Mes documents
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {docs.length}
              </span>
            </h2>
            <FilterChips
              label="Filtrer les documents"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "tous", label: "Tous", count: docs.length },
                { value: "personnels", label: "Personnels", count: count("personnels") },
                { value: "stage", label: "Stage", count: count("stage") },
              ]}
            />
          </div>

          {list.length === 0 ? (
            <div className="pb-8">
              <EmptyNote
                icon={FileText}
                title={filter === "stage" ? "Aucun document de stage" : "Aucun document"}
                desc={filter === "stage" ? "Les documents de l'entreprise arrivent après la confirmation de votre stage." : "Ajoutez votre CV depuis votre profil."}
                className="py-10"
              />
              <div className="flex justify-center">
                <Link to={filter === "stage" ? "/candidatures" : "/profil"} className={SECTION_LINK}>
                  {filter === "stage" ? "Voir mes candidatures" : "Ouvrir mon profil"}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {list.map((doc, index) => (
                <Reveal as="li" key={doc.id} delay={80 + index * 40} className="group">
                  <div className="flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-muted/40">
                    <FileText className="nav-icon nav-icon--lift size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{doc.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {doc.source} · {fmtDate(doc.date)} · {doc.size}
                      </p>
                    </div>
                    <button type="button" onClick={() => download(doc.name)} aria-label={`Télécharger ${doc.name}`} className={cn(rowActionClass(), "group")}>
                      <span className="hidden whitespace-nowrap sm:inline">Télécharger</span>
                      <Download className="size-3.5 shrink-0" />
                    </button>
                    <ActionMenu label={`Plus d'actions pour ${doc.name}`}>
                      <MenuItem onSelect={() => print(doc.name)}>
                        <Printer className="size-4 text-muted-foreground" />
                        Imprimer
                      </MenuItem>
                    </ActionMenu>
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </Reveal>

        <aside className="flex min-w-0 flex-col gap-6">
          <Reveal delay={120} className="card-surface p-5">
            <SectionHeader title="Attestation de fin de stage" />
            <div className="mt-4 flex items-start gap-3">
              <Award className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
              <p className="max-w-[68ch] text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {confirmed
                  ? `Disponible ici après l'évaluation finale du ${fmtDate(end)} et sa validation par l'entreprise.`
                  : "Elle sera disponible ici à la fin de votre stage, après validation par l'entreprise."}
              </p>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <QrCode className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
              <p className="max-w-[68ch] text-pretty text-[13px] leading-relaxed text-muted-foreground">
                Chaque attestation porte une référence unique et un code QR qui permet d'en vérifier l'authenticité.
              </p>
            </div>
            {!confirmed && (
              <Link to="/candidatures" className={cn(SECTION_LINK, "mt-4 w-full justify-center")}>
                Suivre mes candidatures
                <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} />
              </Link>
            )}
          </Reveal>
        </aside>
      </div>
    </div>
  );
}

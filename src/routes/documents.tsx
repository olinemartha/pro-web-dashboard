import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Award, Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ARROW_NUDGE, EmptyNote, FilterChips, PageIntro, SECTION_LINK, SectionHeader, rowActionClass } from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";
import { downloadCv } from "@/lib/files";
import { companyOf, offerOf } from "@/lib/mock-data";
import { remoteState } from "@/lib/remote-flag";
import { useMyAssignment, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Mes documents — StageManager" },
      { name: "description", content: "Consultez et téléchargez votre CV et votre attestation de stage." },
    ],
  }),
  component: DocumentsPage,
});

type Category = "tous" | "personnels" | "stage";

type DocRow = { id: string; name: string; category: Exclude<Category, "tous">; source: string; date: string; detail: string; open: () => void; action: string };

function DocumentsPage() {
  const { profile, applications } = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Category>("tous");
  const confirmedApp = applications.find((a) => a.status === "confirmee");
  const confirmed = Boolean(confirmedApp);
  const assignment = useMyAssignment(confirmedApp?.candidateId);
  const intern = assignment?.intern;
  const company = confirmedApp ? companyOf(offerOf(confirmedApp.offerId).companyId) : null;

  const docs: DocRow[] = [
    ...(profile.cv
      ? [
          {
            id: "cv",
            name: profile.cv.name,
            category: "personnels" as const,
            source: "Votre CV",
            date: profile.cv.date.slice(0, 10),
            detail: `${Math.round(profile.cv.size / 1000)} Ko`,
            action: "Télécharger",
            open: () => {
              const userId = useAuth.getState().session?.userId;
              if (remoteState.active && userId) void downloadCv(userId, profile.cv?.name ?? "CV.pdf");
              else toast.info("CV de démonstration", { description: "Aucun fichier réel n'est associé à ce profil." });
            },
          },
        ]
      : []),
    ...(intern?.certificate === "validee"
      ? [
          {
            id: "attestation",
            name: "Attestation de fin de stage",
            category: "stage" as const,
            source: `Délivrée par ${company?.name ?? "l'entreprise"}`,
            date: (intern.certificateValidatedAt ?? intern.end).slice(0, 10),
            detail: "à imprimer ou enregistrer en PDF",
            action: "Ouvrir",
            open: () => void navigate({ to: "/attestation/$internId", params: { internId: intern.id } }),
          },
        ]
      : []),
  ];
  const count = (category: Exclude<Category, "tous">) => docs.filter((doc) => doc.category === category).length;
  const list = filter === "tous" ? docs : docs.filter((doc) => doc.category === filter);

  return (
    <div className="space-y-6">
      <PageIntro desc="Retrouvez votre CV et, à la fin du stage, votre attestation validée par l'entreprise." />

      <div className="flex flex-col gap-6">
        <Reveal as="section" className="card-surface overflow-hidden" aria-labelledby="docs-title">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b px-5 pb-3.5 pt-4">
            <h2 id="docs-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Mes documents
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{docs.length}</span>
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
                desc={filter === "stage" ? "Votre attestation apparaîtra ici une fois validée par l'entreprise." : "Ajoutez votre CV depuis votre profil."}
                className="py-10"
              />
              <div className="flex justify-center">
                <Link to={filter === "stage" ? "/stage" : "/profil"} className={SECTION_LINK}>
                  {filter === "stage" ? "Voir le suivi du stage" : "Ouvrir mon profil"}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {list.map((doc, index) => (
                <Reveal as="li" key={doc.id} delay={80 + index * 40} className="group">
                  <div className="flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-muted/40">
                    {doc.id === "attestation" ? (
                      <Award className="nav-icon nav-icon--lift size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    ) : (
                      <FileText className="nav-icon nav-icon--lift size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{doc.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {doc.source} · {fmtDate(doc.date)} · {doc.detail}
                      </p>
                    </div>
                    <button type="button" onClick={doc.open} aria-label={`${doc.action} : ${doc.name}`} className={cn(rowActionClass(), "group")}>
                      <span className="hidden whitespace-nowrap sm:inline">{doc.action}</span>
                      {doc.action === "Ouvrir" ? <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} /> : <Download className="size-3.5 shrink-0" />}
                    </button>
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
                {intern?.certificate === "validee"
                  ? "Votre attestation est validée : ouvrez-la ci-dessus pour l'imprimer ou l'enregistrer en PDF. Elle porte une référence unique."
                  : confirmed
                    ? `Disponible ici après l'évaluation finale${intern?.end ? ` du ${fmtDate(intern.end)}` : ""} et sa validation par ${company?.name ?? "l'entreprise"}.`
                    : "Elle sera disponible ici à la fin de votre stage, après validation par l'entreprise."}
              </p>
            </div>
            {!confirmed && (
              <Link to="/candidatures" className={cn(SECTION_LINK, "group mt-4 w-full justify-center")}>
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

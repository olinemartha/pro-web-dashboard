import { createFileRoute } from "@tanstack/react-router";
import { Calendar, User, FileText, CheckCircle2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { internshipExtras } from "@/lib/mock-data";

export const Route = createFileRoute("/stage")({
  head: () => ({
    meta: [
      { title: "Mon stage — StageManager" },
      { name: "description", content: "Suivi de votre stage en cours : entreprise, service, dates, missions et rapports." },
    ],
  }),
  component: StagePage,
});

function StagePage() {
  const { supervisor, start, end, infos, calendar, documents } = internshipExtras;

  return (
    <div>
      <PageHeader title="Mon stage" desc="Suivi de votre stage chez FINCA RDC — Direction Crédit." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Informations du stage">
            <div className="space-y-3">
              <div className="flex items-center gap-3"><Calendar className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Date de début</p><p className="text-xs text-muted-foreground">{start}</p></div></div>
              <div className="flex items-center gap-3"><Calendar className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Date de fin</p><p className="text-xs text-muted-foreground">{end}</p></div></div>
              <div className="flex items-center gap-3"><User className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Superviseur</p><p className="text-xs text-muted-foreground">{supervisor.name} — {supervisor.role}</p></div></div>
              <div className="flex items-center gap-3"><FileText className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Statut</p><p className="text-xs text-muted-foreground">En cours</p></div></div>
            </div>
          </SectionCard>

          <SectionCard title="Missions et objectifs">
            <ul className="space-y-2 list-disc pl-5 text-sm text-muted-foreground">
              {infos.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </SectionCard>

          <SectionCard title="Calendrier du stage">
            <div className="divide-y">
              {calendar.map((c) => (
                <div key={c.date} className="flex justify-between px-3 py-3 text-sm">
                  <span className="text-muted-foreground">{new Date(c.date).toLocaleDateString("fr-FR")}</span>
                  <span className="font-medium">{c.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Superviseur">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">{supervisor.name.split(" ")[0][0]}{supervisor.name.split(" ")[1][0]}</div>
              <div>
                <p className="text-sm font-medium">{supervisor.name}</p>
                <p className="text-xs text-muted-foreground">{supervisor.role}</p>
                <p className="text-xs text-primary">{supervisor.email}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Documents">
            <div className="divide-y">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-3 py-3 text-sm">
                  <span className="truncate text-sm font-medium">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.size}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Évaluation finale">
            <div className="rounded-lg border p-4 text-center text-sm">
              <CheckCircle2 className="mx-auto size-6 mb-2 text-success" />
              <p className="text-sm font-medium">À venir</p>
              <p className="text-xs text-muted-foreground">L'évaluation finale sera saisie par votre entreprise à la fin du stage.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

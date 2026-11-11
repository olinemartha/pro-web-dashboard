import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Building2, Inbox, Users } from "lucide-react";
import { LabeledBars, SplitBar, WeeklyBars } from "@/components/admin/charts";
import { LogList } from "@/components/admin/log";
import { EmptyNote, PIPELINE_SHORT_LABELS, SectionHeader, StatCard } from "@/components/company/ui";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import { useAdminData } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Tableau de bord — Administration StageManager" }] }),
  component: AdminDashboard,
});

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

function AdminDashboard() {
  const data = useAdminData();
  const published = data.offers.filter((o) => o.status === "publiee").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard key="etudiants" label="Étudiants" value={data.students.length} icon={Users} motion="bounce" foot={`${plural(data.students.filter((s) => s.applications > 0).length, "candidat")} actif${data.students.filter((s) => s.applications > 0).length > 1 ? "s" : ""}`} />,
          <StatCard key="entreprises" label="Entreprises" value={data.companies.length} icon={Building2} motion="lift" foot={data.companies.map((c) => c.name).join(", ")} />,
          <StatCard key="offres" label="Offres publiées" value={published} icon={Briefcase} motion="lift" foot={`sur ${plural(data.offers.length, "offre")}`} />,
          <StatCard
            key="candidatures"
            label="Candidatures"
            value={data.candidates.length}
            icon={Inbox}
            motion="bounce"
            foot={data.last30 ? `+${data.last30} en 30 jours` : "aucune ce mois-ci"}
            tone={data.last30 ? "trend" : "neutral"}
          />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Reveal as="section" delay={80} className="card-surface p-5">
            <SectionHeader title="Candidatures par semaine" description="Les 8 dernières semaines, toutes offres confondues" />
            <WeeklyBars data={data.weekly} />
          </Reveal>

          <Reveal as="section" delay={140} className="card-surface p-5 xl:flex-1">
            <SectionHeader
              title="Parcours des candidatures"
              description={`Statut actuel de chaque candidature · ${data.acceptance} % d'acceptation parmi les décisions prises`}
            />
            <LabeledBars
              caption="Candidatures par statut"
              rows={data.byStatus.map((entry) => ({ label: PIPELINE_SHORT_LABELS[entry.status], count: entry.count, dot: entry.status }))}
            />
          </Reveal>
        </div>

        <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 xl:flex xl:flex-col">
          <Reveal delay={120} className="card-surface p-5">
            <SectionHeader title="Système expert" to="/admin/systeme-expert" linkLabel="Détails" />
            <p className="mt-4 text-[30px] font-semibold leading-none tracking-tight">
              <AnimatedNumber value={data.expert.adoption} suffix=" %" />
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              des affectations validées suivent la recommandation du système
            </p>
            <SplitBar
              first={{ label: "Recommandation suivie", count: data.expert.followed }}
              second={{ label: "Choix manuel motivé", count: data.expert.manual }}
            />
            <dl className="mt-4 grid grid-cols-2 divide-x rounded-xl border py-3 text-center">
              <div>
                <dt className="text-[11px] font-medium text-muted-foreground">Analyses</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">{data.expert.runs}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-muted-foreground">Données insuffisantes</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">{data.expert.insufficient}</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={180} className="card-surface p-5 xl:flex-1">
            <SectionHeader title="Filières des candidats" description="Les formations les plus représentées" />
            {data.filieres.length ? (
              <LabeledBars caption="Candidatures par filière" rows={data.filieres.slice(0, 6)} />
            ) : (
              <EmptyNote icon={Users} title="Aucune candidature" className="mt-4 rounded-lg border border-dashed" />
            )}
          </Reveal>
        </aside>
      </div>

      <Reveal as="section" delay={220} className="card-surface p-5">
        <SectionHeader title="Activité récente" description="Les derniers événements de la plateforme" to="/admin/journal" linkLabel="Ouvrir le journal" />
        <LogList entries={data.log.slice(0, 6)} className="-mx-5 mt-4 border-t" />
      </Reveal>
    </div>
  );
}

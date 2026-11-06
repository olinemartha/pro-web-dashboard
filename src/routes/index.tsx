import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bookmark, CalendarCheck, CheckCircle2, Eye, Send, UserCheck, XCircle } from "lucide-react";
import { CompanyLogo, OfferCard, SectionCard, StatusBadge } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { offerOf, offers } from "@/lib/mock-data";
import { missingFields } from "@/lib/rules";
import { fmtDate, fmtRel, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — StageManager" },
      { name: "description", content: "Vue d'ensemble de vos candidatures, offres et stage sur StageManager." },
      { property: "og:title", content: "Tableau de bord — StageManager" },
      { property: "og:description", content: "Vue d'ensemble de vos candidatures, offres et stage sur StageManager." },
    ],
  }),
  component: Dashboard,
});

const ACT_ICON = { envoi: Send, vue: Eye, entretien: CalendarCheck, acceptee: CheckCircle2, refusee: XCircle };

function Dashboard() {
  const { profile, applications, saved, activity, completion } = useStore();
  const interviews = applications.filter((a) => a.status === "entretien").length;
  const accepted = applications.filter((a) => a.status === "acceptee").length;
  const appliedIds = applications.map((a) => a.offerId);
  const recommended = [...offers]
    .filter((o) => !appliedIds.includes(o.id))
    .sort((a, b) => b.skills.filter((s) => profile.competences.includes(s)).length - a.skills.filter((s) => profile.competences.includes(s)).length)
    .slice(0, 3);
  const missing = missingFields(profile);

  const kpis = [
    { label: "Candidatures envoyées", value: applications.length, hint: `${accepted} acceptée${accepted > 1 ? "s" : ""}`, icon: Send },
    { label: "Entretiens programmés", value: interviews, hint: interviews ? "Consultez vos notifications" : "Aucun pour le moment", icon: CalendarCheck },
    { label: "Offres enregistrées", value: saved.length, hint: `Sur ${offers.length} offres disponibles`, icon: Bookmark },
    { label: "Profil complété", value: `${completion}%`, hint: missing.length ? `${missing.length} élément${missing.length > 1 ? "s" : ""} manquant${missing.length > 1 ? "s" : ""}` : "Profil complet", icon: UserCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="card-surface relative overflow-hidden p-6 sm:p-7">
        <div className="absolute -right-10 -top-10 size-44 rounded-full bg-accent-soft" />
        <div className="absolute -right-2 top-12 size-20 rounded-full border-8 border-accent/30" />
        <div className="relative max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight">Bonjour, {profile.prenom} 👋</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Retrouvez ici toutes les informations concernant vos opportunités de stage et votre parcours professionnel.</p>
          {accepted > 0 && (
            <Link to="/candidatures" className="mt-4 inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-xs font-medium text-success hover:underline">
              <CheckCircle2 className="size-3.5" />{accepted} proposition{accepted > 1 ? "s" : ""} en attente de votre choix <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card-surface p-4 sm:p-5">
            <div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground sm:text-sm">{k.label}</p><span className="grid size-8 place-items-center rounded-md bg-accent-soft text-primary"><k.icon className="size-4" /></span></div>
            <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
          </div>
        ))}
      </div>

      {missing.length > 0 && (
        <div className="card-surface flex flex-col gap-4 border-accent/40 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-semibold">Votre profil n'est pas encore complet</p>
            <p className="mt-1 text-sm text-muted-foreground">Complétez vos informations pour améliorer vos chances de trouver un stage correspondant à vos compétences. Manquant : {missing.map((m) => m.label).join(", ")}.</p>
            <div className="mt-3 flex items-center gap-3"><Progress value={completion} className="h-2 max-w-xs" /><span className="text-xs font-medium">{completion}%</span></div>
          </div>
          <Button asChild><Link to="/profil">Compléter mon profil</Link></Button>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Offres recommandées</h2><Button asChild variant="ghost" size="sm"><Link to="/offres">Voir toutes les offres <ArrowRight className="size-4" /></Link></Button></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recommended.map((o) => <OfferCard key={o.id} offer={o} />)}</div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard title="Mes candidatures récentes" className="lg:col-span-3" action={<Link to="/candidatures" className="text-sm font-medium text-primary hover:underline">Tout voir</Link>}>
          <ul className="divide-y">
            {applications.slice(0, 4).map((a) => { const o = offerOf(a.offerId); return (
              <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <CompanyLogo id={o.companyId} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{o.title}</p><p className="text-xs text-muted-foreground">FINCA RDC · {fmtDate(a.date)}</p></div>
                <StatusBadge status={a.status} />
              </li>); })}
          </ul>
        </SectionCard>
        <SectionCard title="Activité récente" className="lg:col-span-2">
          <ol className="relative space-y-4 before:absolute before:inset-y-1 before:left-[15px] before:w-px before:bg-border">
            {activity.slice(0, 5).map((a) => { const I = ACT_ICON[a.kind]; return (
              <li key={a.id} className="relative flex gap-3">
                <span className={cn("relative grid size-8 shrink-0 place-items-center rounded-full border bg-card", a.kind === "acceptee" && "text-success", a.kind === "refusee" && "text-destructive", a.kind === "entretien" && "text-primary")}><I className="size-3.5" /></span>
                <div className="min-w-0"><p className="text-sm font-medium">{a.label}</p><p className="truncate text-xs text-muted-foreground">{a.detail}</p><p className="text-[11px] text-muted-foreground">{fmtRel(a.date)}</p></div>
              </li>); })}
          </ol>
        </SectionCard>
      </div>
    </div>
  );
}

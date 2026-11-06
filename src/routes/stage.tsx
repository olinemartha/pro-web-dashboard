import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CalendarDays, GraduationCap, Loader2, Lock, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, PageHeader, SectionCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { internshipExtras as X, offerOf } from "@/lib/mock-data";
import { fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/stage")({
  head: () => ({
    meta: [
      { title: "Mon stage — StageManager" },
      { name: "description", content: "Informations, rapports périodiques, calendrier et assiduité de votre stage." },
      { property: "og:title", content: "Mon stage — StageManager" },
      { property: "og:description", content: "Informations, rapports périodiques, calendrier et assiduité de votre stage." },
    ],
  }),
  component: Stage,
});

const empty = { periode: "", activites: "", difficultes: "", competences: "" };

function Stage() {
  const { confirmed, reports, addReport } = useStore();
  const [f, setF] = useState(empty);
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!confirmed) return (
    <div><PageHeader title="Mon stage" />
      <EmptyState icon={Lock} title="Cette rubrique n'est pas encore active" desc="Elle sera activée dès que vous aurez confirmé une proposition de stage dans « Mes candidatures »." action={<Button asChild><Link to="/candidatures">Voir mes candidatures</Link></Button>} />
    </div>
  );
  const o = offerOf(confirmed.offerId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.periode.trim()) er.periode = "Indiquez la période concernée.";
    if (f.activites.trim().length < 20) er.activites = "Décrivez vos activités (20 caractères minimum).";
    setErr(er); if (Object.keys(er).length) return;
    setLoading(true);
    setTimeout(() => { addReport(f); setF(empty); setLoading(false); toast.success("Rapport soumis à votre encadreur"); }, 600);
  };
  const field = (k: keyof typeof empty, label: string, ph: string, area = true) => (
    <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>
      {area ? <Textarea value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} rows={3} />
        : <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-ring/30" />}
      {err[k] && <span className="mt-1 block text-xs text-destructive">{err[k]}</span>}</label>
  );

  const info = [
    { icon: Building2, l: "Entreprise", v: "FINCA RDC" }, { icon: GraduationCap, l: "Service", v: o.department },
    { icon: CalendarDays, l: "Période", v: `${fmtDate(X.start)} → ${fmtDate(X.end)}` }, { icon: UserRound, l: "Encadreur", v: `${X.supervisor.name} · ${X.supervisor.role}` },
  ];

  return (
    <div>
      <PageHeader title={o.title} desc="Votre stage confirmé chez FINCA RDC" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{info.map((i) => (
        <div key={i.l} className="card-surface flex gap-3 p-4"><i.icon className="mt-0.5 size-4 text-accent" /><div><p className="text-xs text-muted-foreground">{i.l}</p><p className="text-sm font-medium">{i.v}</p></div></div>))}</div>

      <Tabs defaultValue="rapports">
        <TabsList className="mb-4"><TabsTrigger value="rapports">Rapports</TabsTrigger><TabsTrigger value="calendrier">Calendrier</TabsTrigger><TabsTrigger value="assiduite">Assiduité</TabsTrigger><TabsTrigger value="infos">Infos utiles</TabsTrigger></TabsList>
        <TabsContent value="rapports" className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Nouveau rapport périodique">
            <form onSubmit={submit} className="space-y-4">
              {field("periode", "Période concernée", "Ex. : 16 – 30 novembre 2026", false)}
              {field("activites", "Activités réalisées", "Décrivez les tâches effectuées…")}
              {field("difficultes", "Difficultés rencontrées", "Facultatif")}
              {field("competences", "Compétences développées", "Facultatif")}
              <Button type="submit" disabled={loading}>{loading && <Loader2 className="size-4 animate-spin" />}Soumettre le rapport</Button>
            </form>
          </SectionCard>
          <SectionCard title="Historique des rapports">
            {reports.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun rapport soumis pour le moment.</p> : (
              <ul className="space-y-3">{reports.map((r) => (
                <li key={r.id} className="rounded-lg border p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium">{r.periode}</p><span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-primary">{r.statut}</span></div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.activites}</p><p className="mt-2 text-xs text-muted-foreground">Soumis le {fmtDate(r.date)}</p></li>))}</ul>)}
          </SectionCard>
        </TabsContent>
        <TabsContent value="calendrier"><SectionCard title="Calendrier du stage">
          <ol className="space-y-3">{X.calendar.map((c) => (
            <li key={c.date} className="flex items-center gap-4 rounded-lg border p-3"><div className="w-14 text-center"><p className="text-lg font-semibold leading-none">{new Date(c.date).getDate()}</p><p className="text-[11px] uppercase text-muted-foreground">{new Date(c.date).toLocaleDateString("fr-FR", { month: "short" })}</p></div><p className="text-sm">{c.label}</p></li>))}</ol>
        </SectionCard></TabsContent>
        <TabsContent value="assiduite"><SectionCard title="Mon assiduité" action={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" />Privé</span>}>
          <div className="grid gap-3 sm:grid-cols-2">{X.attendance.map((w) => (
            <div key={w.week} className="rounded-lg border p-4"><p className="text-sm font-medium">{w.week}</p><div className="mt-2 flex gap-4 text-sm"><span className="text-success">{w.present} présent</span><span className="text-warning">{w.late} retard</span><span className="text-destructive">{w.absent} absent</span></div></div>))}</div>
          <p className="mt-4 text-xs text-muted-foreground">L'évaluation finale est réalisée en présentiel par votre encadreur ; son résultat sera ensuite enregistré ici.</p>
        </SectionCard></TabsContent>
        <TabsContent value="infos"><SectionCard title="Informations utiles"><ul className="list-disc space-y-1.5 pl-5 text-sm">{X.infos.map((i) => <li key={i}>{i}</li>)}<li>Contact encadreur : {X.supervisor.email}</li></ul></SectionCard></TabsContent>
      </Tabs>
    </div>
  );
}

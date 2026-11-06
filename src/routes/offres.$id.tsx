import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, GraduationCap, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyLogo, SaveButton, SectionCard, StatusBadge } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { companyOf, offers } from "@/lib/mock-data";
import { ESSENTIAL_FIELDS, missingEssentials } from "@/lib/rules";
import { fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/offres/$id")({
  loader: ({ params }) => { const o = offers.find((x) => x.id === params.id); if (!o) throw notFound(); return o; },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.title} — StageManager` },
      { name: "description", content: loaderData.description },
      { property: "og:title", content: `${loaderData.title} — StageManager` },
      { property: "og:description", content: loaderData.description },
    ] : [{ title: "Offre indisponible — StageManager" }, { name: "robots", content: "noindex" }],
  }),
  component: OfferDetail,
});

function OfferDetail() {
  const o = Route.useLoaderData();
  const c = companyOf(o.companyId);
  const { profile, applications, apply } = useStore();
  const existing = applications.find((a) => a.offerId === o.id);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const missing = missingEssentials(profile);
  void ESSENTIAL_FIELDS;

  const submit = () => {
    setLoading(true);
    setTimeout(() => {
      const r = apply(o.id);
      setLoading(false); setOpen(false);
      if (r.ok) toast.success("Candidature envoyée", { description: `${c.name} a reçu votre candidature et votre CV.` });
      else toast.error("Impossible de postuler", { description: r.reason === "profil" ? "Complétez d'abord les informations essentielles de votre profil." : "Vous avez déjà postulé à cette offre." });
    }, 700);
  };

  return (
    <div>
      <Link to="/offres" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Retour aux offres</Link>
      <div className="card-surface mb-6 flex flex-col gap-5 p-6 md:flex-row md:items-center">
        <CompanyLogo id={o.companyId} size="lg" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{c.name} · {o.department}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{o.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-4" />{o.location}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-4" />{o.type} · {o.duration}</span>
            <span className="inline-flex items-center gap-1"><GraduationCap className="size-4" />{o.level}</span>
            <span className="inline-flex items-center gap-1"><CalendarClock className="size-4" />Avant le {fmtDate(o.deadline)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <SaveButton id={o.id} />
          {existing ? <div className="flex items-center"><StatusBadge status={existing.status} /></div>
            : <Button size="lg" onClick={() => setOpen(true)}>Postuler maintenant</Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Description du stage"><p className="text-sm leading-relaxed text-muted-foreground">{o.description}</p></SectionCard>
          <SectionCard title="Missions principales"><ul className="space-y-2">{o.missions.map((m) => <li key={m} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />{m}</li>)}</ul></SectionCard>
          <SectionCard title="Profil recherché"><p className="text-sm leading-relaxed text-muted-foreground">{o.profile}</p>
            <div className="mt-4 flex flex-wrap gap-2">{o.skills.map((s) => <span key={s} className={profile.competences.includes(s) ? "rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success" : "rounded-full bg-muted px-3 py-1 text-xs font-medium"}>{s}</span>)}</div>
          </SectionCard>
        </div>
        <SectionCard title={`À propos de ${c.name}`} className="h-fit"><p className="text-sm leading-relaxed text-muted-foreground">{c.about}</p></SectionCard>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{missing.length ? "Profil incomplet" : "Confirmer votre candidature"}</AlertDialogTitle>
            <AlertDialogDescription>
              {missing.length ? "Renseignez les informations essentielles (identité, contact, parcours académique et CV) avant de postuler."
                : `Votre profil et votre CV (${profile.cv?.name}) seront transmis uniquement à ${c.name} pour l'offre « ${o.title} ».`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            {missing.length ? <AlertDialogAction asChild><Link to="/profil">Compléter mon profil</Link></AlertDialogAction>
              : <Button onClick={submit} disabled={loading}>{loading && <Loader2 className="size-4 animate-spin" />}Envoyer ma candidature</Button>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

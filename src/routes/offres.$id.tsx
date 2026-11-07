import { createFileRoute } from "@tanstack/react-router";
import { FileText, MapPin, Clock, Briefcase } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { offerOf } from "@/lib/mock-data";
import { canApply } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/offres/$id")({
  head: ({ params }) => {
    const o = offerOf(params.id);
    return {
      meta: [
        { title: o ? `${o.title} — StageManager` : "Offre — StageManager" },
        { name: "description", content: o ? o.description : "" },
      ],
    };
  },
  component: OfferDetail,
});

function OfferDetail() {
  const { profile, applications, addApplication } = useStore();
  const offer = offerOf(Route.useParams().id);
  const can = canApply(profile, applications, offer.id);

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={offer.title} desc={offer.description} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Détails de l'offre">
            <div className="space-y-3">
              <div className="flex items-center gap-3"><Briefcase className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Entreprise</p><p className="text-xs text-muted-foreground">FINCA RDC</p></div></div>
              <div className="flex items-center gap-3"><MapPin className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Localisation</p><p className="text-xs text-muted-foreground">{offer.location}</p></div></div>
              <div className="flex items-center gap-3"><Clock className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Durée</p><p className="text-xs text-muted-foreground">{offer.duration}</p></div></div>
              <div className="flex items-center gap-3"><FileText className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Niveau requis</p><p className="text-xs text-muted-foreground">{offer.level}</p></div></div>
              <div className="flex items-center gap-3"><Clock className="size-4 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">Date limite</p><p className="text-xs text-muted-foreground">{offer.deadline}</p></div></div>
            </div>
          </SectionCard>

          <SectionCard title="Profil recherché">
            <p className="text-sm text-muted-foreground">{offer.profile}</p>
          </SectionCard>

          <SectionCard title="Missions">
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {offer.missions.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Compétences">
            <div className="flex flex-wrap gap-2">
              {offer.skills.map((s) => (
                <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-primary">{s}</span>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Candidature">
            {can.ok ? (
              <Button onClick={() => { addApplication({ id: "a-new", offerId: offer.id, date: new Date().toISOString().split("T")[0], status: "envoyee" }); toast.success("Candidature envoyée"); }}>Envoyer ma candidature</Button>
            ) : can.reason === "deja" ? (
              <Button variant="outline" disabled>Vous avez déjà postulé à cette offre</Button>
            ) : (
              <Button variant="outline" disabled>Complétez votre profil avant de postuler</Button>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

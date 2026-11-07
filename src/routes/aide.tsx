import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, ShieldCheck, FileText } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/app/ui";

export const Route = createFileRoute("/aide")({
  head: () => ({
    meta: [
      { title: "Aide — StageManager" },
      { name: "description", content: "Centre d'aide et foire aux questions de StageManager." },
    ],
  }),
  component: AidePage,
});

function AidePage() {
  return (
    <div>
      <PageHeader title="Aide" desc="Trouvez des réponses à vos questions sur l'utilisation de StageManager." />

      <SectionCard title="Comment postuler à une offre ?">
        <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
          <li>Accédez à l'onglet « Trouver un stage ».</li>
          <li>Recherchez ou filtrez les offres qui vous intéressent.</li>
          <li>Consultez le détail d'une offre.</li>
          <li>Vérifiez que votre profil est complet (CV requis).</li>
          <li>Déposez votre candidature.</li>
        </ol>
      </SectionCard>

      <SectionCard title="Comment fonctionne le système expert ?">
        <p className="text-sm text-muted-foreground">
          Après qu'une entreprise vous a sélectionné, le système expert analyse votre profil et les besoins de ses services. Il propose une ou plusieurs affectations avec une explication. <strong>La décision finale appartient toujours à l'entreprise.</strong>
        </p>
      </SectionCard>

      <SectionCard title="Confidentialité">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><ShieldCheck className="inline size-4 mr-2" />Votre adresse e-mail et votre numéro de téléphone restent privés par défaut.</p>
          <p><FileText className="inline size-4 mr-2" />Votre CV n'est accessible qu'aux entreprises auxquelles vous avez postulé.</p>
          <p><HelpCircle className="inline size-4 mr-2" />Les données des entreprises sont isolées : une entreprise ne voit pas les données d'une autre.</p>
        </div>
      </SectionCard>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — StageManager" },
      { name: "description", content: "Paramètres de votre espace étudiant StageManager." },
      { property: "og:title", content: "Paramètres — StageManager" },
      { property: "og:description", content: "Paramètres de votre espace étudiant StageManager." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { reset } = useStore();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Paramètres" />
      <SectionCard title="Données de démonstration">
        <p className="mb-4 text-sm text-muted-foreground">Restaurez les candidatures, notifications et profil fictifs d'origine.</p>
        <Button variant="outline" onClick={reset}>Réinitialiser la démo</Button>
      </SectionCard>
    </div>
  );
}

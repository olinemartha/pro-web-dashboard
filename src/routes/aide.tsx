import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/aide")({
  head: () => ({
    meta: [
      { title: "Aide et assistance — StageManager" },
      { name: "description", content: "Questions fréquentes sur l'espace étudiant StageManager." },
      { property: "og:title", content: "Aide et assistance — StageManager" },
      { property: "og:description", content: "Questions fréquentes sur l'espace étudiant StageManager." },
    ],
  }),
  component: Help,
});

const FAQ = [
  ["Comment postuler à une offre ?", "Complétez les informations essentielles de votre profil (dont votre CV), ouvrez une offre puis cliquez sur « Postuler maintenant »."],
  ["Puis-je accepter plusieurs stages ?", "Vous pouvez recevoir plusieurs réponses positives, mais vous ne confirmez qu'une seule entreprise. Les autres sont informées de votre choix."],
  ["Qui peut voir mon CV ?", "Uniquement les entreprises auxquelles vous avez soumis une candidature."],
  ["Où trouver mon attestation de fin de stage ?", "Dans « Mes documents », dès que l'entreprise l'a mise à disposition."],
];

function Help() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Aide et assistance" desc="Questions fréquentes" />
      <Accordion type="single" collapsible className="card-surface px-5">
        {FAQ.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
      </Accordion>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { UserSearch } from "lucide-react";
import { Reveal } from "@/components/ui/motion";

export const Route = createFileRoute("/entreprise/stagiaires/")({
  component: CompanyInternsIndex,
});

/** Volet de droite tant qu'aucun dossier n'est ouvert (masqué sur téléphone : la liste suffit). */
function CompanyInternsIndex() {
  return (
    <Reveal
      delay={160}
      className="card-surface hidden h-full min-h-[320px] flex-col items-center justify-center px-8 py-12 text-center lg:flex"
    >
      <UserSearch className="size-7 text-muted-foreground" />
      <h2 className="mt-3 text-[15px] font-semibold tracking-tight">Sélectionnez un dossier</h2>
      <p className="mt-1 max-w-[46ch] text-pretty text-[13px] leading-relaxed text-muted-foreground">
        Chaque dossier rassemble le rapport d'expertise, l'affectation, les rapports périodiques, l'évaluation finale et
        l'attestation.
      </p>
    </Reveal>
  );
}

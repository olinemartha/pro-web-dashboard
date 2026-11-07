import { createFileRoute } from "@tanstack/react-router";
import { UserSearch } from "lucide-react";

export const Route = createFileRoute("/entreprise/stagiaires/")({
  component: CompanyInternsIndex,
});

function CompanyInternsIndex() {
  return (
    <div className="card-surface flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-primary">
        <UserSearch className="size-5" />
      </span>
      <h2 className="mt-3 text-lg font-semibold tracking-tight">Sélectionnez un dossier</h2>
      <p className="mt-1 max-w-[52ch] text-pretty text-sm leading-relaxed text-muted-foreground">
        Chaque stagiaire dispose d'un dossier unique : rapport d'expertise, affectation, suivi,
        évaluation et attestation.
      </p>
    </div>
  );
}

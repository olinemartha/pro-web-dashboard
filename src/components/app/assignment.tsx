import { useState } from "react";
import { Check, Layers, Minus, Sparkles } from "lucide-react";
import { Badge, ExpertBadge, Modal, RuleMeter } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { useMyAssignment as useAssignment } from "@/lib/store";
import { Reveal } from "@/components/ui/motion";
import type { ExpertCriterion, ExpertRun } from "@/lib/company-data";
import { fmtDate } from "@/lib/dates";
import type { useMyAssignment } from "@/lib/store";
import { cn } from "@/lib/utils";

export type Assignment = NonNullable<ReturnType<typeof useMyAssignment>>;

/** Seuls les services qui satisfont au moins un critère sont présentés à l'étudiant comme des propositions. */
export function visibleProposals(run: ExpertRun | undefined) {
  return (run?.proposals ?? []).filter((proposal) => proposal.satisfied.some((c) => c.satisfied));
}

/* ------------------------------------------------------------------ */
/* Affectation : ce que le système expert propose, ce que l'entreprise décide */
/* ------------------------------------------------------------------ */

export function CriteriaList({ criteria }: { criteria: ExpertCriterion[] }) {
  return (
    <ul className="space-y-2">
      {criteria.map((criterion) => (
        <li key={criterion.label} className="flex gap-2.5 text-[13px]">
          {criterion.satisfied ? (
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-label="Critère satisfait" />
          ) : (
            <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Critère non satisfait" />
          )}
          <span className="min-w-0">
            <span className={cn("font-medium", !criterion.satisfied && "text-muted-foreground")}>{criterion.label}</span>
            {criterion.ruleId && (
              <span className="ml-1.5 rounded bg-muted px-1 py-px text-[11px] font-medium tabular-nums text-muted-foreground">
                Règle {criterion.ruleId}
              </span>
            )}
            <span className="block text-pretty text-xs text-muted-foreground">{criterion.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AssignmentCard({
  assignment,
  offerTitle,
  delay = 60,
}: {
  assignment: Assignment;
  /** Offre concernée, quand plusieurs analyses sont affichées (avant le choix du stage). */
  offerTitle?: string;
  delay?: number;
}) {
  const { intern, run, decision } = assignment;
  const decided = intern.confirmed;
  const retained = decided ? run?.proposals.find((proposal) => proposal.serviceId === intern.serviceId) : undefined;
  const proposals = visibleProposals(run);
  const titleId = `affectation-titre-${intern.id}`;

  return (
    <Reveal
      as="section"
      delay={delay}
      className={cn("card-surface overflow-hidden", (decided ? Boolean(retained) : proposals.length > 0) && "expert-border")}
      aria-labelledby={titleId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 pb-3.5 pt-4 sm:px-6">
        <div className="min-w-0">
          <h2 id={titleId} className="text-[15px] font-semibold tracking-tight">
            {offerTitle ? `Analyse pour « ${offerTitle} »` : "Votre affectation"}
          </h2>
          <p className="mt-0.5 max-w-[68ch] text-pretty text-xs text-muted-foreground">
            {decided
              ? `FINCA RDC a validé votre service d'accueil${decision ? ` le ${fmtDate(decision.decidedAt.slice(0, 10))}` : ""}.`
              : run
                ? "Le système expert a comparé votre profil aux besoins des services. FINCA RDC choisira votre service d'accueil parmi ses propositions."
                : "FINCA RDC n'a pas encore lancé l'analyse de votre profil."}
          </p>
        </div>
        <Badge label={decided ? "Service retenu" : "Analyse en cours"} tone={decided ? "success" : "primary"} dot={decided ? "acceptee" : "examen"} />
      </div>

      {decided ? (
        <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Service d'accueil</p>
            <p className="mt-1 flex items-center gap-2 text-[15px] font-semibold">
              <Layers className="size-[18px] shrink-0 text-primary" />
              {intern.service}
            </p>
            {retained ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <ExpertBadge label="Proposé par le système expert" />
                <RuleMeter met={retained.satisfied.filter((c) => c.satisfied).length} total={retained.satisfied.length} />
              </div>
            ) : (
              <p className="mt-2 text-pretty text-xs leading-relaxed text-muted-foreground">
                Choisi directement par l'entreprise, en dehors des propositions du système expert.
              </p>
            )}
          </div>
          {retained ? (
            <div>
              <h3 className="text-[13px] font-semibold">Pourquoi ce service</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Les règles appliquées par le système expert à votre profil.</p>
              <div className="mt-3">
                <CriteriaList criteria={retained.satisfied} />
              </div>
            </div>
          ) : null}
        </div>
      ) : proposals.length > 0 ? (
        <ul className="divide-y">
          {proposals.map((proposal, index) => (
            <li
              key={proposal.serviceId}
              className={cn(
                "grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]",
                index === 0 && "bg-primary-soft/50 shadow-[inset_3px_0_0_hsl(var(--primary))]"
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  <Layers className={cn("size-4 shrink-0", index === 0 ? "text-primary" : "text-muted-foreground")} />
                  {proposal.serviceName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {index === 0 && <ExpertBadge label="Recommandé" />}
                  <RuleMeter met={proposal.satisfied.filter((c) => c.satisfied).length} total={proposal.satisfied.length} />
                </div>
              </div>
              <CriteriaList criteria={proposal.satisfied} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-5 text-[13px] text-muted-foreground sm:px-6">Les propositions apparaîtront ici dès que l'analyse aura été faite.</p>
      )}

      <p className="flex items-start gap-2 border-t bg-muted/30 px-5 py-3 text-xs text-muted-foreground sm:px-6">
        <Sparkles className="mt-px size-3.5 shrink-0" />
        Le système expert recommande ; la décision d'affectation appartient à l'entreprise.
      </p>
    </Reveal>
  );
}

/**
 * Avant le choix du stage : ce que le système expert propose pour cette offre,
 * en une ligne, avec l'analyse complète (services et critères, sans scores) dans une fenêtre.
 */
export function ExpertHint({ candidateId, offerTitle }: { candidateId?: string; offerTitle: string }) {
  const assignment = useAssignment(candidateId);
  const [open, setOpen] = useState(false);
  if (!assignment) return null;
  const proposals = visibleProposals(assignment.run);
  const top = proposals[0];
  return (
    <>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
        {top ? (
          <ExpertBadge label={`Service proposé : ${top.serviceName}`} />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0" /> Analyse du système expert à venir
          </span>
        )}
        {top && (
          <>
            <span aria-hidden className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative z-10 -my-2 py-2 font-medium text-primary underline-offset-2 hover:underline"
            >
              Voir l'analyse
            </button>
          </>
        )}
      </p>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={Sparkles}
        wide
        title="Analyse du système expert"
        description={`${offerTitle} · services proposés pour votre profil`}
        footer={<Button onClick={() => setOpen(false)}>Fermer</Button>}
      >
        <ul className="divide-y rounded-lg border">
          {proposals.map((proposal) => (
            <li key={proposal.serviceId} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  <Layers className="size-4 shrink-0 text-muted-foreground" />
                  {proposal.serviceName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {proposal.satisfied.filter((c) => c.satisfied).length} critère{proposal.satisfied.filter((c) => c.satisfied).length > 1 ? "s" : ""} sur {proposal.satisfied.length}
                </p>
              </div>
              <CriteriaList criteria={proposal.satisfied} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-pretty text-xs text-muted-foreground">
          Le système expert recommande ; FINCA RDC choisira votre service d'accueil une fois votre stage confirmé.
        </p>
      </Modal>
    </>
  );
}

/** Analyse d'une offre acceptée, pour la page « Suivi du stage » avant la confirmation. */
export function AcceptedAnalysis({ candidateId, offerTitle, delay }: { candidateId?: string; offerTitle: string; delay?: number }) {
  const assignment = useAssignment(candidateId);
  if (!assignment) return null;
  return <AssignmentCard assignment={assignment} offerTitle={offerTitle} delay={delay} />;
}

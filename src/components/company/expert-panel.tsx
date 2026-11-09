import { useState } from "react";
import { CheckCircle2, Info, RefreshCw, Scale, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Field, SectionLabel, inputClass, textareaClass } from "@/components/company/ui";
import { Stamp, stampDate } from "@/components/company/stamp";
import { useCompanyStore } from "@/lib/company-store";
import type { ExpertProposal, Intern } from "@/lib/company-data";
import { cn } from "@/lib/utils";
import { DEMO_RULES, isRecommendedService, latestRunFor } from "@/lib/expert-engine";

function fmtDateTime(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ProposalCard({ proposal }: { proposal: ExpertProposal }) {
  const satisfied = proposal.satisfied.filter((criterion) => criterion.satisfied);
  const missing = proposal.satisfied.filter((criterion) => !criterion.satisfied);
  const recommended = proposal.rank === 1;

  return (
    <article
      className={cn(
        "rounded-lg border p-4",
        recommended
          ? "border-accent/50 bg-accent-soft/40"
          : "border border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold leading-none tabular-nums",
              recommended ? "bg-accent text-white" : "bg-primary-soft text-primary"
            )}
          >
            {proposal.rank}
          </span>
          <div>
            <h3 className="text-sm font-semibold leading-snug">{proposal.serviceName}</h3>
            <p className="mt-0.5 text-xs leading-relaxed tabular-nums text-muted-foreground">
              {proposal.capacityAtRun.left} place(s) restante(s) ·{" "}
              {proposal.capacityAtRun.filled} déjà pourvue(s) sur{" "}
              {proposal.capacityAtRun.needed}
            </p>
          </div>
        </div>
        <Badge
          label={proposal.summary}
          tone={satisfied.length >= 3 ? "success" : satisfied.length >= 2 ? "primary" : "muted"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {satisfied.map((criterion) => (
          <span
            key={criterion.ruleId}
            className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-xs font-medium text-success"
          >
            <CheckCircle2 className="size-3" /> {criterion.label}
          </span>
        ))}
        {missing.map((criterion) => (
          <span
            key={criterion.ruleId}
            className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning"
          >
            <ShieldAlert className="size-3" /> {criterion.label}
          </span>
        ))}
      </div>

      {proposal.limits.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs leading-relaxed text-warning">
          {proposal.limits.map((limit) => (
            <li key={limit}>• {limit}</li>
          ))}
        </ul>
      )}

      <details className="mt-3 border-t pt-2">
        <summary className="cursor-pointer text-xs font-medium text-primary">
          Voir le raisonnement
        </summary>
        <div className="mt-2 space-y-2">
          <ul className="space-y-1 text-xs leading-relaxed">
            {proposal.satisfied.map((criterion) => (
              <li key={criterion.ruleId} className="flex gap-2">
                <span
                  className={
                    criterion.satisfied
                      ? "mt-1 size-1.5 shrink-0 rounded-full bg-success"
                      : "mt-1 size-1.5 shrink-0 rounded-full bg-warning"
                  }
                />
                <span>
                  <span className="font-medium">{criterion.label}</span> — {criterion.detail}{" "}
                  <span className="text-muted-foreground">({criterion.ruleId})</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Règles appliquées : {proposal.ruleIds.join(", ")}
          </p>
        </div>
      </details>
    </article>
  );
}

export function ExpertPanel({ intern }: { intern: Intern }) {
  const {
    offers,
    services,
    expertRuns,
    decisions,
    runExpertAnalysis,
    validateAssignment,
  } = useCompanyStore();

  const offer = offers.find((entry) => entry.id === intern.offerId);
  const latestRun = latestRunFor(expertRuns, intern.id);
  const decision = decisions.find((entry) => entry.internId === intern.id);

  const recommendedId = latestRun?.proposals[0]?.serviceId ?? "";
  const [selected, setSelected] = useState(recommendedId);
  const [otherServiceId, setOtherServiceId] = useState("");
  const [custom, setCustom] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [reasoningOpen, setReasoningOpen] = useState(true);

  const targetServiceId = custom ? otherServiceId : selected;
  const targetIsRecommended = isRecommendedService(latestRun, targetServiceId);

  const relaunch = () => {
    const run = runExpertAnalysis(intern.id);
    if (!run) return;
    setCustom(false);
    setOtherServiceId("");
    setSelected(run.proposals[0]?.serviceId ?? "");
    setError("");
    toast.success("Analyse relancée", {
      description: `Nouvelle version créée — ${run.proposals.length} proposition(s).`,
    });
  };

  const submitDecision = () => {
    if (!targetServiceId) {
      setError("Choisissez un service d'affectation.");
      return;
    }
    if (!targetIsRecommended && !reason.trim()) {
      setError(
        "Un motif est requis lorsque vous vous écartez de la recommandation du système expert."
      );
      return;
    }
    const service = services.find((entry) => entry.id === targetServiceId);
    const result = validateAssignment(intern.id, targetServiceId, reason);
    if (!result.ok) {
      setError(result.error ?? "L'affectation n'a pas pu être validée.");
      return;
    }
    setError("");
    toast.success("Affectation validée", {
      description: `${intern.name} — ${service?.name ?? "service retenu"}`,
    });
  };

  return (
    <section id="affectation" className="scroll-mt-6 space-y-4">
      <div className="card-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Rapport d'expertise</h2>
              <Badge label="Recommandation" tone="primary" />
              {intern.confirmed ? (
                <Badge label="Affectation confirmée" tone="success" />
              ) : (
                <Badge label="Affectation à confirmer" tone="muted" />
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed tabular-nums text-muted-foreground">
              {intern.name} · {offer?.title ?? "Offre introuvable"} · du {fmtDate(intern.start)} au{" "}
              {fmtDate(intern.end)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={relaunch}>
            <RefreshCw className="mr-1.5 size-3.5" /> Relancer l'analyse
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs leading-relaxed tabular-nums text-muted-foreground">
          <span className="rounded-md bg-muted px-2.5 py-1">
            {services.length} service(s) comparé(s)
          </span>
          <span className="rounded-md bg-muted px-2.5 py-1">
            {latestRun?.proposals.length ?? 0} proposition(s)
          </span>
          <span className="rounded-md bg-muted px-2.5 py-1">
            {latestRun?.rules.length ?? DEMO_RULES.length} règle(s) appliquée(s)
          </span>
          <span className="rounded-md bg-muted px-2.5 py-1">
            Moteur {latestRun?.engineVersion ?? "demo-1.0"}
          </span>
        </div>

        <p className="mt-3 flex max-w-[75ch] items-start gap-2 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs leading-relaxed text-warning">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Les règles utilisées sont des règles de démonstration : elles ne représentent pas les règles
          réelles d'affectation de FINCA RDC.
        </p>
      </div>

      {!latestRun ? (
        <div className="card-surface p-8 text-center">
          <Sparkles className="mx-auto size-6 text-primary" />
          <p className="mt-2 text-sm font-semibold">Aucune analyse pour ce dossier</p>
          <p className="mx-auto mt-1 max-w-[58ch] text-pretty text-sm leading-relaxed text-muted-foreground">
            Lancez l'analyse pour comparer les services et leurs besoins.
          </p>
          <Button className="mt-4" onClick={relaunch}>
            <Sparkles className="mr-2 size-4" /> Lancer l'analyse
          </Button>
        </div>
      ) : (
        <>
          {latestRun.status !== "prete" && (
            <div className="card-surface border-warning/30 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
                <div>
                  <h3 className="text-sm font-semibold leading-snug">
                    {latestRun.status === "donnees_insuffisantes"
                      ? "Données insuffisantes pour recommander"
                      : "Aucune proposition disponible"}
                  </h3>
                  <p className="mt-1 max-w-[70ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                    Le système ne produit pas de fausse recommandation. Complétez les données
                    manquantes ou procédez à une affectation manuelle motivée.
                  </p>
                  {latestRun.missingFacts.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                      {latestRun.missingFacts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* La colonne de décision ne se détache qu'à partir de xl : dans un
              dossier déjà encadré par la liste des stagiaires, une grille à lg
              laisse la largeur des propositions s'effondrer. */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              {latestRun.proposals.length === 0 ? (
                <div className="card-surface p-5 text-sm leading-relaxed text-muted-foreground">
                  Aucune proposition classée. Vous pouvez choisir un service manuellement, avec un
                  motif.
                </div>
              ) : (
                latestRun.proposals.map((proposal) => (
                  <ProposalCard key={proposal.serviceId} proposal={proposal} />
                ))
              )}
            </div>

            <aside className="self-start xl:sticky xl:top-4">
              <div className="card-surface p-5">
                <div className="flex items-center gap-2">
                  <Scale className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold leading-snug">Votre décision</h3>
                </div>

                {intern.confirmed && decision ? (
                  <div className="mt-3 rounded-md border border-success/30 bg-card p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-success">
                          Décision enregistrée
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-snug">{decision.service}</p>
                        <p className="mt-0.5 text-xs leading-relaxed tabular-nums text-muted-foreground">
                          Par {decision.decidedBy}, le {fmtDateTime(decision.decidedAt)}
                        </p>
                      </div>
                      <Stamp label="Affectation validée" detail={stampDate(decision.decidedAt)} />
                    </div>
                    <dl className="mt-2.5 space-y-1 border-t border-success/20 pt-2.5 text-xs leading-relaxed text-muted-foreground">
                      <div className="flex gap-1.5">
                        <dt className="shrink-0">Source :</dt>
                        <dd>
                          {decision.source === "recommandation"
                            ? "recommandation du système"
                            : "décision manuelle"}
                        </dd>
                      </div>
                      {decision.reason && (
                        <div className="flex gap-1.5">
                          <dt className="shrink-0">Motif :</dt>
                          <dd className="min-w-0">{decision.reason}</dd>
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <dt className="shrink-0">Moteur :</dt>
                        <dd className="min-w-0 tabular-nums">
                          {decision.engineVersion} · exécution {decision.runId || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : intern.confirmed ? (
                  <p className="mt-3 rounded-md border border-success/30 bg-success-soft p-3 text-sm leading-relaxed text-success">
                    Affectation confirmée. La trace détaillée de la décision n'est pas disponible
                    pour ce dossier.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                      {latestRun.proposals.map((proposal) => (
                        <label
                          key={proposal.serviceId}
                          className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-muted/60"
                        >
                          <input
                            type="radio"
                            name={`decision-${intern.id}`}
                            className="mt-1"
                            checked={!custom && selected === proposal.serviceId}
                            onChange={() => {
                              setCustom(false);
                              setSelected(proposal.serviceId);
                              setError("");
                            }}
                          />
                          <span>
                            <span className="block font-medium">{proposal.serviceName}</span>
                            <span className="text-xs leading-relaxed text-muted-foreground">
                              {proposal.summary}
                              {proposal.rank === 1 ? " · recommandé" : ""}
                            </span>
                          </span>
                        </label>
                      ))}
                      <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-muted/60">
                        <input
                          type="radio"
                          name={`decision-${intern.id}`}
                          className="mt-1"
                          checked={custom}
                          onChange={() => {
                            setCustom(true);
                            setError("");
                          }}
                        />
                        <span className="font-medium">Choisir un autre service</span>
                      </label>
                    </div>

                    {custom && (
                      <Field label="Service retenu" htmlFor={`service-${intern.id}`} required>
                        <select
                          id={`service-${intern.id}`}
                          className={inputClass}
                          value={otherServiceId}
                          onChange={(event) => {
                            setOtherServiceId(event.target.value);
                            setError("");
                          }}
                        >
                          <option value="">— Sélectionner un service —</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    <Field
                      label="Motif"
                      htmlFor={`motif-${intern.id}`}
                      required={!targetIsRecommended}
                      error={error}
                      hint="Requis si vous vous écartez de la recommandation."
                    >
                      <textarea
                        id={`motif-${intern.id}`}
                        className={textareaClass}
                        value={reason}
                        onChange={(event) => {
                          setReason(event.target.value);
                          setError("");
                        }}
                      />
                    </Field>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Le système recommande ; la décision finale vous appartient.
                    </p>

                    <Button className="w-full" onClick={submitDecision}>
                      Valider l'affectation
                    </Button>
                  </div>
                )}
              </div>
            </aside>
          </div>

          <div className="card-surface p-5">
            <button
              type="button"
              onClick={() => setReasoningOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-2 text-left"
              aria-expanded={reasoningOpen}
            >
              <span className="text-sm font-semibold leading-snug">Trace de l'analyse</span>
              <span className="text-xs leading-relaxed tabular-nums text-muted-foreground">
                {fmtDateTime(latestRun.createdAt)} · {latestRun.id}
              </span>
            </button>

            {reasoningOpen && (
              <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
                <div>
                  <SectionLabel as="h4">Faits utilisés</SectionLabel>
                  <dl className="mt-2 space-y-1.5 text-sm leading-relaxed">
                    {latestRun.facts.map((fact) => (
                      <div key={fact.label} className="flex gap-2">
                        <dt className="w-28 shrink-0 text-xs leading-relaxed text-muted-foreground">
                          {fact.label}
                        </dt>
                        <dd className="min-w-0">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <SectionLabel as="h4">Règles appliquées</SectionLabel>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                    {latestRun.rules.map((rule) => (
                      <li key={rule.id}>
                        <span className="font-medium">
                          {rule.id} — {rule.label}
                        </span>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {rule.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

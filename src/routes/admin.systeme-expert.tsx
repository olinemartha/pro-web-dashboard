import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert, ListChecks, Sparkles, UserRoundCheck } from "lucide-react";
import { Badge, EmptyNote, ExpertBadge, PageIntro, SectionHeader, StatCard } from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { useAdminData } from "@/lib/admin-data";
import { useCompanyStore } from "@/lib/company-store";
import { fmtDate } from "@/lib/dates";
import { DEMO_RULES, EXPERT_ENGINE_VERSION } from "@/lib/expert-engine";
import { OFFER_MATCHING_VERSION, OFFER_RULES } from "@/lib/offer-matching";

export const Route = createFileRoute("/admin/systeme-expert")({
  head: () => ({ meta: [{ title: "Système expert — Administration StageManager" }] }),
  component: ExpertPage,
});

function RuleList({ title, version, rules }: { title: string; version: string; rules: { id: string; label: string; description: string }[] }) {
  return (
    <div>
      <p className="flex items-baseline justify-between gap-3 text-[13px] font-semibold">
        {title}
        <span className="text-[11px] font-medium text-muted-foreground">moteur {version}</span>
      </p>
      <ul className="mt-2 space-y-2.5">
        {rules.map((rule) => (
          <li key={rule.id} className="flex gap-2.5 text-[13px]">
            <span className="mt-px h-fit shrink-0 rounded bg-muted px-1.5 py-px text-[11px] font-semibold tabular-nums text-muted-foreground">{rule.id}</span>
            <span className="min-w-0">
              <span className="font-medium">{rule.label}</span>
              <span className="block text-pretty text-xs text-muted-foreground">{rule.description.replace(" Règle de démonstration.", "")}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExpertPage() {
  const data = useAdminData();
  const { expertRuns, decisions, interns, hosting } = useCompanyStore();
  const runs = [...expertRuns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <PageIntro desc="Toutes les analyses du moteur d'inférence, les décisions qui ont suivi et les règles appliquées. Le système recommande ; l'entreprise décide." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard key="a" label="Analyses" value={data.expert.runs} icon={Sparkles} motion="pop" foot="propositions d'affectation" />,
          <StatCard key="s" label="Recommandations suivies" value={data.expert.adoption} suffix=" %" icon={UserRoundCheck} motion="pop" foot={`${data.expert.followed} sur ${data.expert.decisions} décisions`} tone={data.expert.adoption >= 50 ? "trend" : "neutral"} />,
          <StatCard key="m" label="Choix manuels" value={data.expert.manual} icon={ListChecks} motion="pop" foot="toujours motivés" />,
          <StatCard key="i" label="Données insuffisantes" value={data.expert.insufficient} icon={CircleAlert} motion="pop" foot={data.expert.insufficient ? "profils à compléter" : "aucune analyse bloquée"} tone={data.expert.insufficient ? "alert" : "neutral"} />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Reveal as="section" delay={120} className="card-surface overflow-hidden" aria-labelledby="runs-title">
          <div className="border-b px-5 pb-3.5 pt-4">
            <h2 id="runs-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Analyses et décisions
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{runs.length}</span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">La plus récente d'abord. Chaque analyse reste tracée, même relancée.</p>
          </div>
          {runs.length === 0 ? (
            <EmptyNote icon={Sparkles} title="Aucune analyse pour le moment" className="py-12" />
          ) : (
            <ul className="divide-y">
              {runs.map((run) => {
                const intern = interns.find((i) => i.id === run.internId);
                const decision = decisions.find((d) => d.runId === run.id);
                const top = run.proposals[0];
                return (
                  <li key={run.id} className="grid gap-2 px-5 py-3.5 transition-colors duration-200 hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                        <span className="font-semibold">{intern?.name ?? "Stagiaire"}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{fmtDate(run.createdAt.slice(0, 10))} · moteur {run.engineVersion}</span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {run.status === "prete" && top ? (
                          <ExpertBadge label={`Proposé : ${top.serviceName}`} />
                        ) : (
                          <Badge label="Données insuffisantes" tone="warning" className="text-[11px]" />
                        )}
                        {run.status === "prete" && <span className="text-xs text-muted-foreground">{run.proposals.length} service(s) évalué(s)</span>}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      {decision ? (
                        <>
                          <p className="text-[13px] font-medium">{decision.service}</p>
                          <Badge
                            label={decision.source === "recommandation" ? "Recommandation suivie" : "Choix manuel"}
                            tone={decision.source === "recommandation" ? "success" : "muted"}
                            className="mt-1 text-[11px]"
                          />
                        </>
                      ) : (
                        <Badge label="En attente de décision" tone="warning" className="text-[11px]" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Reveal>

        <Reveal as="aside" delay={180} className="card-surface p-5">
          <SectionHeader title="Base de règles" description="Règles de démonstration, à remplacer par les critères réels de FINCA RDC." />
          <div className="mt-4 space-y-6">
            <RuleList title="Affectation à un service" version={EXPERT_ENGINE_VERSION} rules={DEMO_RULES} />
            <RuleList title="Recommandation d'offres aux étudiants" version={OFFER_MATCHING_VERSION} rules={OFFER_RULES} />
            <div className="border-t pt-4">
              <p className="text-[13px] font-semibold">Critères déclarés par l'entreprise</p>
              {hosting ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hosting.criteria.map((criterion) => (
                    <span key={criterion} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                      {criterion}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-pretty text-xs text-muted-foreground">
                  Enquête FINCA RDC : formation, niveau d'études, besoins de l'entreprise et disponibilité des services. Ils seront repris à l'inscription de l'entreprise.
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

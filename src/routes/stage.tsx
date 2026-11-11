import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Download, FileText, GraduationCap, Layers, Mail, Minus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CompanyMark } from "@/components/app/ui";
import { ARROW_NUDGE, AvatarInitials, Badge, EmptyNote, SECTION_LINK, SectionHeader } from "@/components/company/ui";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import { daysFromToday, fmtDate } from "@/lib/dates";
import { companyOf, internshipExtras, offerOf } from "@/lib/mock-data";
import { useMyAssignment, useStore } from "@/lib/store";
import type { ExpertCriterion } from "@/lib/company-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stage")({
  head: () => ({
    meta: [
      { title: "Suivi du stage — StageManager" },
      { name: "description", content: "Suivi de votre stage : entreprise, service, dates, encadreur, calendrier et documents." },
    ],
  }),
  component: StagePage,
});

const initialsOf = (name: string) =>
  name
    .replace(/^(M\.|Mme|Mlle)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

function StagePage() {
  const { applications } = useStore();
  const confirmedApp = applications.find((a) => a.status === "confirmee");

  if (!confirmedApp) {
    const accepted = applications.filter((a) => a.status === "acceptee").length;
    return (
      <Reveal className="card-surface">
        <EmptyNote
          icon={GraduationCap}
          title="Votre stage n'est pas encore confirmé"
          desc={
            accepted
              ? `Vous avez ${accepted > 1 ? `${accepted} propositions acceptées` : "une proposition acceptée"} : confirmez votre choix pour ouvrir le suivi du stage.`
              : "Le suivi s'ouvre dès que vous confirmez une proposition acceptée par une entreprise."
          }
          className="pb-6 pt-12"
        />
        <div className="flex justify-center pb-10">
          <Link to={accepted ? "/candidatures" : "/offres"} className={SECTION_LINK}>
            {accepted ? "Choisir mon stage" : "Parcourir les offres"}
            <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} />
          </Link>
        </div>
        <div className="border-t px-5 py-5 sm:px-6">
          <h2 className="text-[13px] font-semibold">Ce qui se passe ensuite</h2>
          <ol className="mt-3 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Vous confirmez votre stage", desc: "Une seule proposition acceptée ; les autres sont déclinées." },
              { title: "L'entreprise vous affecte", desc: "Elle choisit votre service, aidée par le système expert." },
              { title: "Le suivi s'ouvre ici", desc: "Calendrier, encadreur, présence et documents du stage." },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums",
                    index === 0 && accepted ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{step.title}</span>
                  <span className="mt-0.5 block text-pretty text-xs leading-relaxed text-muted-foreground">{step.desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    );
  }

  const offer = offerOf(confirmedApp.offerId);
  const assignment = useMyAssignment(confirmedApp.candidateId);
  const company = companyOf(offer.companyId);
  const { infos, calendar, documents, attendance } = internshipExtras;
  // Le dossier de l'entreprise fait foi pour les dates et l'encadreur ; à défaut, la démonstration.
  const start = assignment?.intern.start ?? internshipExtras.start;
  const end = assignment?.intern.end ?? internshipExtras.end;
  const supervisor = assignment
    ? assignment.supervisor
      ? { name: assignment.supervisor.name, role: assignment.supervisor.role, email: assignment.supervisor.email }
      : null
    : internshipExtras.supervisor;
  const total = Math.max(1, daysFromToday(end) - daysFromToday(start));
  const elapsed = Math.min(total, Math.max(0, -daysFromToday(start)));
  const progress = Math.round((elapsed / total) * 100);
  const started = daysFromToday(start) <= 0;
  const ended = daysFromToday(end) < 0;
  const nextIndex = calendar.findIndex((step) => daysFromToday(step.date) >= 0);
  const present = attendance.reduce((sum, week) => sum + week.present, 0);
  const late = attendance.reduce((sum, week) => sum + week.late, 0);
  const absent = attendance.reduce((sum, week) => sum + week.absent, 0);

  const facts = [
    { label: "Début", value: fmtDate(start) },
    { label: "Fin", value: fmtDate(end) },
    { label: "Durée", value: offer.duration },
    { label: "Lieu", value: offer.location },
  ];

  return (
    <div className="space-y-6">
      {/* ============================ En-tête du stage ============================ */}
      <Reveal as="section" className="card-surface p-5 sm:p-6" aria-labelledby="stage-title">
        <div className="flex flex-wrap items-start gap-4">
          <CompanyMark id={offer.companyId} className="size-12 text-sm" />
          <div className="min-w-0 flex-1">
            <h2 id="stage-title" className="text-pretty text-xl font-semibold leading-snug tracking-tight">
              {offer.title}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {company.name} · {offer.department}
            </p>
          </div>
          <Badge label={ended ? "Stage terminé" : started ? "Stage en cours" : "Stage confirmé"} tone={ended ? "muted" : "success"} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-y-4 rounded-xl border py-3.5 sm:grid-cols-4 sm:divide-x">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0 px-4">
              <dt className="text-[11px] font-medium text-muted-foreground">{fact.label}</dt>
              <dd className="mt-0.5 truncate text-[13px] font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              {started ? "Avancement du stage" : `Début dans ${daysFromToday(start)} jours`}
            </span>
            {started && (
              <span className="text-sm font-semibold tabular-nums">
                <AnimatedNumber value={progress} suffix="%" />
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="animate-grow-x h-full rounded-full bg-primary" style={{ width: `${progress}%`, ["--delay" as string]: "200ms" }} />
          </div>
        </div>
      </Reveal>

      {assignment && <AssignmentCard assignment={assignment} />}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Calendrier */}
          <Reveal as="section" delay={80} className="card-surface p-5">
            <SectionHeader title="Calendrier du stage" description="Les grandes étapes fixées par l'entreprise" />
            <ol className="-mx-5 mt-4 divide-y border-t">
              {calendar.map((step, index) => {
                const past = daysFromToday(step.date) < 0;
                const next = index === nextIndex;
                return (
                  <li
                    key={step.date}
                    className={cn(
                      "grid grid-cols-[20px_88px_minmax(0,1fr)] items-center gap-x-3.5 px-5 py-3 transition-colors duration-200",
                      !next && "hover:bg-muted/40",
                      next && "bg-primary-soft shadow-[inset_3px_0_0_hsl(var(--primary))]"
                    )}
                  >
                    {past ? (
                      <Check className="size-4 text-success" aria-label="Étape passée" />
                    ) : (
                      <span className={cn("mx-auto size-2 rounded-full", next ? "bg-primary" : "bg-border")} aria-hidden />
                    )}
                    <span className={cn("text-xs tabular-nums", next ? "font-semibold text-primary" : "text-muted-foreground")}>
                      {fmtDate(step.date)}
                    </span>
                    <span className={cn("text-[13px]", past ? "text-muted-foreground" : "font-medium")}>
                      {step.label}
                      {next && <span className="sr-only"> (prochaine étape)</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          {/* Informations pratiques */}
          <Reveal as="section" delay={140} className="card-surface p-5 xl:flex-1">
            <SectionHeader title="Informations pratiques" />
            <ul className="mt-4 space-y-2.5">
              {infos.map((info) => (
                <li key={info} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {info}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 xl:flex xl:flex-col">
          {/* Encadreur */}
          <Reveal delay={120} className="card-surface p-5">
            <SectionHeader title="Votre encadreur" />
            {supervisor ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <AvatarInitials initials={initialsOf(supervisor.name)} className="size-11 text-sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{supervisor.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{supervisor.role}</p>
                  </div>
                </div>
                <a href={`mailto:${supervisor.email}`} className={cn(SECTION_LINK, "mt-4 w-full justify-center")}>
                  <Mail className="nav-icon nav-icon--fly size-3.5" />
                  Écrire à {supervisor.name.replace(/^(M\.|Mme)\s+/, "").split(" ")[0]}
                </a>
              </>
            ) : (
              <p className="mt-3 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                FINCA RDC désignera votre encadreur après avoir validé votre service d'accueil.
              </p>
            )}
          </Reveal>

          {/* Présence */}
          <Reveal delay={160} className="card-surface p-5">
            <SectionHeader title="Présence" description={started ? "Pointage saisi par l'entreprise" : "Le pointage commencera au début du stage"} />
            {started && (
            <dl className="mt-4 grid grid-cols-3 divide-x rounded-xl border py-3 text-center">
              {[
                { label: "Présent", value: present },
                { label: "Retard", value: late },
                { label: "Absent", value: absent },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] font-medium text-muted-foreground">{item.label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums">{item.value} j</dd>
                </div>
              ))}
            </dl>
            )}
          </Reveal>

          {/* Documents */}
          <Reveal delay={200} className="card-surface p-5 xl:flex-1">
            <SectionHeader title="Documents du stage" count={documents.length} to="/documents" />
            <ul className="-mx-5 mt-4 divide-y border-t">
              {documents.map((doc) => (
                <li key={doc.id} className="group flex items-center gap-3 px-5 py-3 transition-colors duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-muted/40">
                  <FileText className="nav-icon nav-icon--lift size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{doc.name.replace(/\.pdf$/i, "")}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type} · {doc.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success("Téléchargement lancé", { description: doc.name })}
                    aria-label={`Télécharger ${doc.name}`}
                    className="press grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Download className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Affectation : ce que le système expert propose, ce que l'entreprise décide */
/* ------------------------------------------------------------------ */

function CriteriaList({ criteria }: { criteria: ExpertCriterion[] }) {
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

function AssignmentCard({ assignment }: { assignment: NonNullable<ReturnType<typeof useMyAssignment>> }) {
  const { intern, run, decision } = assignment;
  const decided = intern.confirmed;
  const retained = decided ? run?.proposals.find((proposal) => proposal.serviceId === intern.serviceId) : undefined;
  // Seuls les services qui satisfont au moins un critère sont présentés comme des propositions.
  const proposals = (run?.proposals ?? []).filter((proposal) => proposal.satisfied.some((c) => c.satisfied));

  return (
    <Reveal as="section" delay={60} className="card-surface overflow-hidden" aria-labelledby="affectation-titre">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 pb-3.5 pt-4 sm:px-6">
        <div className="min-w-0">
          <h2 id="affectation-titre" className="text-[15px] font-semibold tracking-tight">
            Votre affectation
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
            <p className="mt-2 text-pretty text-xs leading-relaxed text-muted-foreground">
              {retained
                ? `Proposé par le système expert : ${retained.satisfied.filter((c) => c.satisfied).length} critères satisfaits sur ${retained.satisfied.length}.`
                : "Choisi directement par l'entreprise, en dehors des propositions du système expert."}
            </p>
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
          {proposals.map((proposal) => (
            <li key={proposal.serviceId} className="grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  <Layers className="size-4 shrink-0 text-muted-foreground" />
                  {proposal.serviceName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {proposal.satisfied.filter((c) => c.satisfied).length} critère{proposal.satisfied.filter((c) => c.satisfied).length > 1 ? "s" : ""} satisfait{proposal.satisfied.filter((c) => c.satisfied).length > 1 ? "s" : ""} sur {proposal.satisfied.length}
                </p>
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

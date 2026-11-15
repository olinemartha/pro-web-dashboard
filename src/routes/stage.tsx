import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, Check, FilePlus2, FileText, GraduationCap, Mail, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyMark } from "@/components/app/ui";
import { ARROW_NUDGE, AvatarInitials, Badge, EmptyNote, Field, Modal, SECTION_LINK, SectionHeader, inputClass, textareaClass, type Tone } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import type { Intern, InternReport, ReportStatus } from "@/lib/company-data";
import { daysFromToday, fmtDate, relativeDay } from "@/lib/dates";
import { companyOf, offerOf } from "@/lib/mock-data";
import { submitInternReport, type ReportInput } from "@/lib/remote";
import type { Application } from "@/lib/rules";
import { useMyAssignment, useStore } from "@/lib/store";
import { AcceptedAnalysis, AssignmentCard } from "@/components/app/assignment";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stage")({
  head: () => ({
    meta: [
      { title: "Suivi du stage — StageManager" },
      { name: "description", content: "Suivi de votre stage : entreprise, service, dates, encadreur, rapports et attestation." },
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

const REPORT_STATUS: Record<ReportStatus, { label: string; tone: Tone }> = {
  soumis: { label: "En relecture", tone: "primary" },
  valide: { label: "Validé", tone: "success" },
  corrige: { label: "À corriger", tone: "warning" },
};

function StagePage() {
  const { applications } = useStore();
  const confirmedApp = applications.find((a) => a.status === "confirmee");
  return confirmedApp ? <ConfirmedStage app={confirmedApp} /> : <NotConfirmed applications={applications} />;
}

function NotConfirmed({ applications }: { applications: Application[] }) {
  const acceptedApps = applications.filter((a) => a.status === "acceptee");
  const accepted = acceptedApps.length;
  return (
    <div className="space-y-6">
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
              { title: "Le suivi s'ouvre ici", desc: "Dates, missions, encadreur, rapports et attestation." },
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
      {acceptedApps.map((a, index) => (
        <AcceptedAnalysis key={a.id} candidateId={a.candidateId} offerTitle={offerOf(a.offerId).title} delay={80 + index * 60} />
      ))}
    </div>
  );
}

function ConfirmedStage({ app }: { app: Application }) {
  const offer = offerOf(app.offerId);
  const assignment = useMyAssignment(app.candidateId);
  const company = companyOf(offer.companyId);
  const intern = assignment?.intern;
  const supervisor = assignment?.supervisor;
  const start = intern?.start ?? "";
  const end = intern?.end ?? "";
  const hasDates = Boolean(start && end);
  const total = hasDates ? Math.max(1, daysFromToday(end) - daysFromToday(start)) : 1;
  const elapsed = hasDates ? Math.min(total, Math.max(0, -daysFromToday(start))) : 0;
  const progress = Math.round((elapsed / total) * 100);
  const started = hasDates && daysFromToday(start) <= 0;
  const ended = hasDates && daysFromToday(end) < 0;

  // Calendrier tiré du dossier : début, rapports déposés, fin et évaluation.
  const calendar = [
    ...(start ? [{ key: "debut", date: start, label: "Début du stage — accueil et intégration" }] : []),
    ...(intern?.reports ?? []).map((report) => ({ key: report.id, date: report.date, label: `Rapport « ${report.period} » déposé` })),
    ...(end ? [{ key: "fin", date: end, label: "Fin du stage — évaluation finale" }] : []),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const nextIndex = calendar.findIndex((step) => daysFromToday(step.date) >= 0);

  const facts = [
    { label: "Début", value: start ? fmtDate(start) : "À préciser" },
    { label: "Fin", value: end ? fmtDate(end) : "À préciser" },
    { label: "Durée", value: offer.duration || "À préciser" },
    { label: "Lieu", value: offer.location || "À préciser" },
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
              {[company.name, intern?.confirmed ? intern.service : offer.department].filter(Boolean).join(" · ")}
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

        {hasDates && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {started ? "Avancement du stage" : `Début dans ${daysFromToday(start)} jour${daysFromToday(start) > 1 ? "s" : ""}`}
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
        )}
      </Reveal>

      {assignment && <AssignmentCard assignment={assignment} />}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {intern ? (
            <ReportsCard intern={intern} />
          ) : (
            <Reveal className="card-surface p-5">
              <SectionHeader title="Rapports de stage" />
              <p className="mt-3 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {company.name} n'a pas encore ouvert votre dossier de stage : vous pourrez y déposer vos rapports dès qu'il sera créé.
              </p>
            </Reveal>
          )}

          {/* Missions et objectifs fixés par l'entreprise */}
          <Reveal as="section" delay={140} className="card-surface p-5 xl:flex-1">
            <SectionHeader title="Missions et objectifs" description="Fixés par l'entreprise pour votre stage" />
            {intern?.missions || intern?.objectives ? (
              <dl className="mt-4 space-y-4">
                {intern.missions && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Missions</dt>
                    <dd className="mt-1 whitespace-pre-line text-pretty text-[13px] leading-relaxed">{intern.missions}</dd>
                  </div>
                )}
                {intern.objectives && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Objectifs</dt>
                    <dd className="mt-1 whitespace-pre-line text-pretty text-[13px] leading-relaxed">{intern.objectives}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <EmptyNote icon={Target} title="Pas encore précisés" desc={`${company.name} les précisera avec votre encadreur.`} className="py-8" />
            )}
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
                {supervisor.email && (
                  <a href={`mailto:${supervisor.email}`} className={cn(SECTION_LINK, "group mt-4 w-full justify-center")}>
                    <Mail className="nav-icon nav-icon--fly size-3.5" />
                    Écrire à {supervisor.name.replace(/^(M\.|Mme)\s+/, "").split(" ")[0]}
                  </a>
                )}
              </>
            ) : (
              <p className="mt-3 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {company.name} désignera votre encadreur après avoir validé votre service d'accueil.
              </p>
            )}
          </Reveal>

          {/* Calendrier */}
          <Reveal as="section" delay={160} className="card-surface p-5">
            <SectionHeader title="Calendrier du stage" description="Les dates de votre dossier" />
            {calendar.length === 0 ? (
              <p className="mt-3 text-pretty text-[13px] leading-relaxed text-muted-foreground">Les dates seront fixées par {company.name}.</p>
            ) : (
              <ol className="-mx-5 mt-4 divide-y border-t">
                {calendar.map((step, index) => {
                  const past = daysFromToday(step.date) < 0;
                  const next = index === nextIndex;
                  return (
                    <li
                      key={step.key}
                      className={cn(
                        "grid grid-cols-[20px_80px_minmax(0,1fr)] items-center gap-x-3 px-5 py-3",
                        next && "bg-primary-soft shadow-[inset_3px_0_0_hsl(var(--primary))]"
                      )}
                    >
                      {past ? (
                        <Check className="size-4 text-success" aria-label="Étape passée" />
                      ) : (
                        <span className={cn("mx-auto size-2 rounded-full", next ? "bg-primary" : "bg-border")} aria-hidden />
                      )}
                      <span className={cn("text-xs tabular-nums", next ? "font-semibold text-primary" : "text-muted-foreground")}>{fmtDate(step.date)}</span>
                      <span className={cn("text-[13px]", past ? "text-muted-foreground" : "font-medium")}>
                        {step.label}
                        {next && <span className="sr-only"> (prochaine étape)</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Reveal>

          {/* Attestation */}
          <Reveal delay={200} className="card-surface p-5 xl:flex-1">
            <SectionHeader title="Attestation de fin de stage" />
            <div className="mt-4 flex items-start gap-3">
              <Award className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
              <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {intern?.certificate === "validee"
                  ? `Validée par ${company.name}${intern.certificateValidatedAt ? ` le ${fmtDate(intern.certificateValidatedAt.slice(0, 10))}` : ""}.`
                  : intern?.certificate === "generee"
                    ? `Rédigée par ${company.name} : elle sera disponible ici dès sa validation.`
                    : `Disponible ici après l'évaluation finale${end ? ` du ${fmtDate(end)}` : ""} et sa validation par ${company.name}.`}
              </p>
            </div>
            {intern?.certificate === "validee" && (
              <Link to="/attestation/$internId" params={{ internId: intern.id }} className={cn(SECTION_LINK, "group mt-4 w-full justify-center")}>
                Ouvrir l'attestation
                <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} />
              </Link>
            )}
          </Reveal>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rapports de stage                                                   */
/* ------------------------------------------------------------------ */

const EMPTY_REPORT: ReportInput = { period: "", activites: "", difficultes: "", competences: "" };

function ReportsCard({ intern }: { intern: Intern }) {
  const [open, setOpen] = useState(false);
  const [replaces, setReplaces] = useState<InternReport | null>(null);
  const [form, setForm] = useState<ReportInput>(EMPTY_REPORT);
  const [errors, setErrors] = useState<Partial<Record<keyof ReportInput, string>>>({});
  const [pending, setPending] = useState(false);
  const reports = [...intern.reports].reverse();
  const toCorrect = intern.reports.filter((report) => report.status === "corrige").length;

  const start = (report?: InternReport) => {
    setReplaces(report ?? null);
    setForm(
      report
        ? { period: report.period, activites: report.activites ?? "", difficultes: report.difficultes ?? "", competences: report.competences ?? "" }
        : EMPTY_REPORT
    );
    setErrors({});
    setOpen(true);
  };

  const set = (patch: Partial<ReportInput>) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      (Object.keys(patch) as (keyof ReportInput)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (!form.period.trim()) next.period = "Indiquez la période couverte.";
    if (!form.activites.trim()) next.activites = "Décrivez les activités réalisées.";
    setErrors(next);
    const first = (["period", "activites"] as const).find((key) => next[key]);
    if (first) {
      document.getElementById(`report-${first}`)?.focus();
      return;
    }
    setPending(true);
    const error = await submitInternReport(intern.id, form, replaces?.id);
    setPending(false);
    if (error) {
      toast.error("Rapport non envoyé", { description: error });
      return;
    }
    setOpen(false);
    toast.success(replaces ? "Version corrigée envoyée" : "Rapport envoyé", { description: "L'entreprise est prévenue et le relira." });
  };

  return (
    <Reveal as="section" delay={80} className="card-surface overflow-hidden" aria-labelledby="rapports-titre">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 pb-3.5 pt-4">
        <div className="min-w-0">
          <h2 id="rapports-titre" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            Rapports de stage
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{intern.reports.length}</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {toCorrect ? `${toCorrect} rapport${toCorrect > 1 ? "s" : ""} à corriger` : "Déposez un rapport à chaque période de votre stage."}
          </p>
        </div>
        {intern.confirmed && (
          <Button size="sm" onClick={() => start()}>
            <FilePlus2 className="mr-1.5 size-3.5" /> Déposer un rapport
          </Button>
        )}
      </div>
      {!intern.confirmed ? (
        <p className="px-5 py-5 text-pretty text-[13px] leading-relaxed text-muted-foreground">
          Vous pourrez déposer vos rapports une fois votre affectation validée par l'entreprise.
        </p>
      ) : reports.length === 0 ? (
        <EmptyNote icon={FileText} title="Aucun rapport déposé" desc="Votre premier rapport décrira vos activités, vos difficultés et ce que vous avez appris." className="py-10" />
      ) : (
        <ul className="divide-y">
          {reports.map((report) => (
            <li key={report.id} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5">
              <FileText className="size-[18px] text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{report.period}</p>
                <p className="text-xs text-muted-foreground">Déposé {relativeDay(report.date)}</p>
              </div>
              {report.status === "corrige" ? (
                <button type="button" onClick={() => start(report)} className={SECTION_LINK}>
                  Corriger
                </button>
              ) : (
                <Badge label={REPORT_STATUS[report.status].label} tone={REPORT_STATUS[report.status].tone} className="whitespace-nowrap" />
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={FilePlus2}
        title={replaces ? "Corriger le rapport" : "Déposer un rapport"}
        description={replaces ? `Nouvelle version de « ${replaces.period} »` : "Il est envoyé à l'entreprise, qui le valide ou le retourne pour correction."}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Envoi…" : "Envoyer le rapport"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Période couverte" htmlFor="report-period" required error={errors.period}>
            <input
              id="report-period"
              className={inputClass}
              placeholder="Ex. Semaines 1 et 2"
              value={form.period}
              readOnly={Boolean(replaces)}
              onChange={(event) => set({ period: event.target.value })}
            />
          </Field>
          <Field label="Activités réalisées" htmlFor="report-activites" required error={errors.activites}>
            <textarea
              id="report-activites"
              className={cn(textareaClass, "min-h-24 [field-sizing:content]")}
              placeholder="Ex. Analyse de dossiers de crédit, participation au comité"
              value={form.activites}
              onChange={(event) => set({ activites: event.target.value })}
            />
          </Field>
          <Field label="Difficultés rencontrées" htmlFor="report-difficultes">
            <textarea
              id="report-difficultes"
              className={cn(textareaClass, "[field-sizing:content]")}
              placeholder="Ex. Prise en main du logiciel de gestion"
              value={form.difficultes}
              onChange={(event) => set({ difficultes: event.target.value })}
            />
          </Field>
          <Field label="Compétences acquises" htmlFor="report-competences">
            <textarea
              id="report-competences"
              className={cn(textareaClass, "[field-sizing:content]")}
              placeholder="Ex. Lecture des états financiers"
              value={form.competences}
              onChange={(event) => set({ competences: event.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </Reveal>
  );
}

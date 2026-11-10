import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Layers,
  Mail,
  Pencil,
  Phone,
  Undo2,
  UserCheck,
  UserRound,
  UserSearch,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ActionMenu,
  AvatarInitials,
  Badge,
  EmptyNote,
  Field,
  MenuItem,
  SECTION_LINK,
  Select,
  iconMotion,
  inputClass,
  rowActionClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
import { DatePicker } from "@/components/company/date-picker";
import { Reveal } from "@/components/ui/motion";
import { daysFromToday, fmtDate, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ExpertPanel } from "@/components/company/expert-panel";
import { Stamp, stampDate } from "@/components/company/stamp";
import { useCompanyStore } from "@/lib/company-store";
import type { Intern, ReportStatus } from "@/lib/company-data";
import { isRecommendedService, latestRunFor } from "@/lib/expert-engine";

export const Route = createFileRoute("/entreprise/stagiaires/$internId")({
  head: () => ({
    meta: [{ title: "Dossier stagiaire — Espace entreprise" }],
  }),
  component: InternDossierPage,
});

const reportTone: Record<ReportStatus, Tone> = {
  soumis: "warning",
  valide: "success",
  corrige: "muted",
};

const reportLabel: Record<ReportStatus, string> = {
  soumis: "Soumis",
  valide: "Validé",
  corrige: "À corriger",
};

const certificateLabel: Record<Intern["certificate"], string> = {
  non_generee: "Non générée",
  generee: "Générée, à valider",
  validee: "Validée",
};

const certificateTone: Record<Intern["certificate"], Tone> = {
  non_generee: "muted",
  generee: "warning",
  validee: "success",
};

function InternDossierPage() {
  const { internId } = Route.useParams();
  const {
    interns,
    candidates,
    offers,
    decisions,
    expertRuns,
    setReportStatus,
    setEvaluation,
    generateCertificate,
    validateCertificate,
  } = useCompanyStore();

  const intern = interns.find((entry) => entry.id === internId);

  if (!intern) {
    return (
      <div className="card-surface pb-10">
        <EmptyNote
          icon={UserSearch}
          title="Dossier introuvable"
          desc="Ce stagiaire n'existe pas ou son dossier a été supprimé."
          className="pb-4 pt-12"
        />
        <div className="flex justify-center">
          <Link to="/entreprise/stagiaires" className={SECTION_LINK}>
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const candidate = candidates.find((entry) => entry.id === intern.candidateId);
  const offer = offers.find((entry) => entry.id === intern.offerId);
  const decision = decisions.find((entry) => entry.internId === intern.id);
  const pendingReports = intern.reports.filter((report) => report.status === "soumis").length;
  const run = latestRunFor(expertRuns, intern.id);
  const elapsed = intern.start ? -daysFromToday(intern.start) : 0;
  const total = intern.start && intern.end ? elapsed + daysFromToday(intern.end) : 0;
  const progress = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 0;

  const tabs = [
    { href: "#affectation", label: "Affectation", badge: intern.confirmed ? undefined : "!" },
    { href: "#suivi", label: "Rapports", badge: pendingReports ? String(pendingReports) : undefined },
    { href: "#evaluation", label: "Évaluation", done: Boolean(intern.evaluation) },
    { href: "#attestation", label: "Attestation", done: intern.certificate === "validee" },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête du dossier */}
      <Reveal as="section" className="card-surface overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <AvatarInitials initials={intern.initials} className="size-12 text-base" />
            <div className="min-w-0 flex-1">
              <h2 className="text-balance text-lg font-semibold leading-tight tracking-tight">{intern.name}</h2>
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{offer?.title ?? "Offre supprimée"}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {intern.confirmed ? (
                  <Badge label={intern.service} tone="success" />
                ) : (
                  <Badge label="Affectation à valider" tone="warning" />
                )}
                <Badge label={`Attestation ${certificateLabel[intern.certificate].toLowerCase()}`} tone={certificateTone[intern.certificate]} />
              </div>
            </div>
          </div>

          {/* Repères en bande, comme dans le détail d'une offre */}
          <dl className="mt-5 grid grid-cols-2 gap-y-4 rounded-xl border py-3.5 lg:grid-cols-4 lg:divide-x">
            <div className="min-w-0 px-4">
              <dt className="text-xs text-muted-foreground">Période</dt>
              <dd className="mt-0.5 truncate text-[13px] font-medium tabular-nums">
                {intern.start ? `${fmtDate(intern.start, false)} → ${fmtDate(intern.end, false)}` : "À définir"}
              </dd>
            </div>
            <div className="min-w-0 px-4">
              <dt className="text-xs text-muted-foreground">Avancement</dt>
              <dd className="mt-1.5 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="animate-grow-x block h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </span>
                <span className="text-xs font-medium tabular-nums">{progress} %</span>
              </dd>
            </div>
            <div className="min-w-0 px-4">
              <dt className="text-xs text-muted-foreground">Encadreur</dt>
              <dd className={cn("mt-0.5 truncate text-[13px] font-medium", !intern.supervisor && "text-warning")}>
                {intern.supervisor || "À désigner"}
              </dd>
            </div>
            <div className="min-w-0 px-4">
              <dt className="text-xs text-muted-foreground">Affectation</dt>
              <dd className="mt-0.5 truncate text-[13px] font-medium">
                {decision ? (decision.source === "recommandation" ? "Recommandée" : "Choix motivé") : "À valider"}
              </dd>
              {decision && <dd className="truncate text-xs text-muted-foreground">par {decision.decidedBy}</dd>}
            </div>
          </dl>

          {candidate && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary">
                <Mail className="size-3.5" /> {candidate.email}
              </a>
              <a href={`tel:${candidate.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary">
                <Phone className="size-3.5" /> {candidate.phone}
              </a>
            </div>
          )}
        </div>

        {/* Sous-navigation ancrée, en puces */}
        <nav aria-label="Sections du dossier" className="flex flex-wrap gap-0.5 border-t bg-muted/30 px-4 py-2 sm:gap-1">
          {tabs.map((tab) => (
            <a
              key={tab.href}
              href={tab.href}
              className="press inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary"
            >
              {tab.label}
              {tab.badge && (
                <span
                  className={cn(
                    "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                    tab.badge === "!" ? "bg-warning-soft text-warning" : "bg-primary text-primary-foreground"
                  )}
                >
                  {tab.badge}
                </span>
              )}
              {tab.done && <Check className="size-3.5 text-success" aria-label="fait" />}
            </a>
          ))}
        </nav>
      </Reveal>

      <ExpertPanel key={intern.id} intern={intern} />

      <ManualAdjust key={`adjust-${intern.id}`} intern={intern} run={run ?? undefined} />

      {/* Suivi */}
      <Reveal as="section" delay={60} id="suivi" className="card-surface scroll-mt-6 overflow-hidden" aria-labelledby="suivi-titre">
        <div className="flex items-center justify-between gap-3 border-b px-5 pb-3.5 pt-4">
          <h2 id="suivi-titre" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            Rapports périodiques
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {intern.reports.length}
            </span>
          </h2>
          {pendingReports > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
              <Clock className="size-3" /> {pendingReports} à relire
            </span>
          )}
        </div>
        {intern.reports.length === 0 ? (
          <EmptyNote icon={FileText} title="Aucun rapport déposé" desc="Les rapports du stagiaire apparaîtront ici dès leur dépôt." />
        ) : (
          <ul className="divide-y">
            {[...intern.reports].reverse().map((report) => (
              <li key={report.id} className="group grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/50 sm:grid-cols-[20px_minmax(0,1fr)_auto_auto]">
                <FileText className={iconMotion("lift", "size-[18px] text-muted-foreground group-hover:text-foreground")} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{report.period}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    Déposé {relativeDay(report.date)}
                    <span className="sm:hidden"> · {reportLabel[report.status]}</span>
                  </p>
                </div>
                <Badge label={reportLabel[report.status]} tone={reportTone[report.status]} className="hidden whitespace-nowrap sm:inline-flex" />
                <div className="flex items-center gap-1">
                  {report.status !== "valide" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReportStatus(intern.id, report.id, "valide");
                        toast.success("Rapport validé", { description: report.period });
                      }}
                      aria-label={`Valider le rapport ${report.period}`}
                      className={rowActionClass()}
                    >
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span className="hidden whitespace-nowrap sm:inline">Valider</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toast.success("Téléchargement du rapport", { description: report.period })}
                      aria-label={`Télécharger le rapport ${report.period}`}
                      className={rowActionClass()}
                    >
                      <Download className="size-3.5 shrink-0" />
                      <span className="hidden whitespace-nowrap sm:inline">Télécharger</span>
                    </button>
                  )}
                  {report.status === "soumis" ? (
                    <ActionMenu>
                      <MenuItem
                        onSelect={() => {
                          setReportStatus(intern.id, report.id, "corrige");
                          toast.success("Rapport retourné pour correction", {
                            description: "Le stagiaire peut déposer une version corrigée.",
                          });
                        }}
                      >
                        <Undo2 className="size-3.5" /> Retourner pour correction
                      </MenuItem>
                    </ActionMenu>
                  ) : (
                    <span className="w-8" aria-hidden />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      {/* Évaluation */}
      <EvaluationSection intern={intern} onSave={setEvaluation} />

      {/* Attestation */}
      <Reveal as="section" delay={120} id="attestation" className="card-surface scroll-mt-6 p-5" aria-labelledby="attestation-titre">
        <h2 id="attestation-titre" className="text-[15px] font-semibold tracking-tight">
          Attestation de fin de stage
        </h2>
        <p className="mt-0.5 text-pretty text-xs text-muted-foreground">
          Générée après l'évaluation finale, puis validée avant d'être remise au stagiaire.
        </p>
        <div className="group mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <Award className={iconMotion("lift", "size-5 shrink-0 text-muted-foreground")} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">Attestation — {intern.name}</p>
              <p className="text-xs text-muted-foreground">{certificateLabel[intern.certificate]}</p>
            </div>
            {intern.certificate === "validee" && (
              <Stamp
                label="Attestation validée"
                detail={intern.certificateValidatedAt ? stampDate(intern.certificateValidatedAt) : undefined}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {/* L'attestation suit l'évaluation finale : tant qu'elle manque, le bouton mène au champ à remplir. */}
            {intern.certificate === "non_generee" && !intern.evaluation && (
              <button
                type="button"
                onClick={() => {
                  document.getElementById("evaluation")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  document.getElementById(`intern-score-${intern.id}`)?.focus({ preventScroll: true });
                }}
                className={SECTION_LINK}
              >
                <ClipboardCheck className="size-3.5" /> Saisir l'évaluation finale
              </button>
            )}
            {intern.certificate === "non_generee" && intern.evaluation && (
              <Button
                size="sm"
                onClick={() => {
                  generateCertificate(intern.id);
                  toast.success("Attestation générée", { description: `${intern.name} — à valider avant remise au stagiaire.` });
                }}
              >
                <Award className="mr-1.5 size-3.5" /> Générer l'attestation
              </Button>
            )}
            {intern.certificate !== "non_generee" && (
              <button
                type="button"
                onClick={() => toast.success("Téléchargement de l'attestation", { description: `Attestation_${intern.name}.pdf` })}
                className={SECTION_LINK}
              >
                <Download className="size-3.5" /> Télécharger
              </button>
            )}
            {intern.certificate === "generee" && (
              <Button
                size="sm"
                onClick={() => {
                  validateCertificate(intern.id);
                  toast.success("Attestation validée", { description: `Elle peut maintenant être remise à ${intern.name}.` });
                }}
              >
                <BadgeCheck className="mr-1.5 size-3.5" /> Valider
              </Button>
            )}
          </div>
        </div>
        {!intern.evaluation && intern.certificate === "non_generee" && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-warning">
            <Clock className="size-3" /> L'attestation se génère une fois l'évaluation finale enregistrée.
          </p>
        )}
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Évaluation finale                                                   */
/* ------------------------------------------------------------------ */

function EvaluationSection({
  intern,
  onSave,
}: {
  intern: Intern;
  onSave: (internId: string, score: number, comment: string) => void;
}) {
  const [score, setScore] = useState(intern.evaluation ? String(intern.evaluation.score) : "");
  const [comment, setComment] = useState(intern.evaluation?.comment ?? "");
  const [error, setError] = useState("");

  const save = () => {
    const value = Number(score.replace(",", "."));
    if (!score || Number.isNaN(value) || value < 0 || value > 20) {
      setError("Saisissez une note entre 0 et 20.");
      document.getElementById(`intern-score-${intern.id}`)?.focus();
      return;
    }
    setError("");
    onSave(intern.id, value, comment.trim());
    toast.success("Évaluation finale enregistrée", { description: `${intern.name} — ${value}/20` });
  };

  return (
    <Reveal as="section" delay={90} id="evaluation" className="card-surface scroll-mt-6 p-5" aria-labelledby="evaluation-titre">
      <h2 id="evaluation-titre" className="text-[15px] font-semibold tracking-tight">
        Évaluation finale
      </h2>
      <p className="mt-0.5 max-w-[68ch] text-pretty text-xs text-muted-foreground">
        L'évaluation reste une décision de l'entreprise ; StageManager enregistre le résultat.
      </p>

      {intern.evaluation && (
        <div className="mt-4 flex items-center gap-4 rounded-xl border px-4 py-3.5">
          <p className="shrink-0 text-[30px] font-semibold leading-none tracking-tight tabular-nums text-success-ink">
            {intern.evaluation.score}
            <span className="text-sm font-medium text-muted-foreground">/20</span>
          </p>
          <p className="min-w-0 text-pretty text-[13px] leading-relaxed text-muted-foreground">
            {intern.evaluation.comment || "Aucune observation."}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Field label="Note sur 20" htmlFor={`intern-score-${intern.id}`} required error={error}>
          <input
            id={`intern-score-${intern.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.5}
            className={cn(inputClass, "tabular-nums")}
            placeholder="Ex. 16"
            value={score}
            onChange={(event) => {
              setScore(event.target.value);
              if (error) setError("");
            }}
          />
        </Field>
        <Field label="Observations" htmlFor={`intern-comment-${intern.id}`}>
          <textarea
            id={`intern-comment-${intern.id}`}
            className={textareaClass}
            placeholder="Ex. Stagiaire autonome, analyses rigoureuses et bien présentées."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save}>
          <ClipboardCheck className="mr-2 size-4" />
          {intern.evaluation ? "Mettre à jour l'évaluation" : "Enregistrer l'évaluation"}
        </Button>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Ajustement manuel                                                   */
/* ------------------------------------------------------------------ */

function ManualAdjust({ intern, run }: { intern: Intern; run?: ReturnType<typeof latestRunFor> }) {
  const { services, updateIntern, validateAssignment } = useCompanyStore();

  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState(intern.serviceId ?? "");
  const [supervisor, setSupervisor] = useState(intern.supervisor);
  const [start, setStart] = useState(intern.start);
  const [end, setEnd] = useState(intern.end);
  const [missions, setMissions] = useState(intern.missions);
  const [objectives, setObjectives] = useState(intern.objectives);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topId = run?.proposals[0]?.serviceId;
  const serviceChanged = serviceId !== (intern.serviceId ?? "");
  const requiresDecision = !intern.confirmed || serviceChanged;
  const recommended = isRecommendedService(run, serviceId);
  const panelId = `ajustement-${intern.id}`;

  const clear = (key: string) => setErrors((current) => ({ ...current, [key]: "", form: "" }));

  /** Revenir aux valeurs enregistrées et refermer. */
  const cancel = () => {
    setServiceId(intern.serviceId ?? "");
    setSupervisor(intern.supervisor);
    setStart(intern.start);
    setEnd(intern.end);
    setMissions(intern.missions);
    setObjectives(intern.objectives);
    setReason("");
    setErrors({});
    setOpen(false);
  };

  const save = () => {
    const next: Record<string, string> = {};
    if (!serviceId) next.service = "Choisissez un service d'accueil.";
    if (!supervisor.trim()) next.supervisor = "Désignez l'encadreur du stagiaire.";
    if (!start) next.start = "Choisissez la date de début.";
    if (!end) next.end = "Choisissez la date de fin.";
    else if (start && end < start) next.end = "La date de fin doit suivre la date de début.";
    setErrors(next);
    const first = ["service", "supervisor", "start", "end"].find((key) => next[key]);
    if (first) {
      document.getElementById(`intern-${first}-${intern.id}`)?.focus();
      return;
    }

    if (requiresDecision) {
      const result = validateAssignment(intern.id, serviceId, reason);
      if (!result.ok) {
        setErrors({ form: result.error ?? "L'affectation n'a pas pu être validée." });
        document.getElementById(`intern-reason-${intern.id}`)?.focus();
        return;
      }
    }

    updateIntern(intern.id, { supervisor: supervisor.trim(), start, end, missions, objectives });
    setErrors({});
    setReason("");
    setOpen(false);
    toast.success("Affectation et encadrement enregistrés", { description: intern.name });
  };

  const currentService = intern.confirmed ? intern.service : "";

  return (
    <Reveal as="section" delay={40} className="card-surface overflow-hidden" aria-labelledby={`${panelId}-titre`}>
      {/* En-tête : l'état actuel se lit sans ouvrir le formulaire */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id={`${panelId}-titre`} className="text-[15px] font-semibold tracking-tight">
            Affectation et encadrement
          </h2>
          <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <dt className="sr-only">Service d'accueil</dt>
              <Layers className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <dd className={cn("truncate font-medium", !currentService && "text-warning")}>
                {currentService || "Service à valider"}
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <dt className="sr-only">Encadreur</dt>
              <UserRound className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <dd className={cn("truncate font-medium", !intern.supervisor && "text-warning")}>
                {intern.supervisor || "Encadreur à désigner"}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Période</dt>
              <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <dd className="tabular-nums text-muted-foreground">
                {intern.start ? `${fmtDate(intern.start, false)} → ${fmtDate(intern.end)}` : "Période à définir"}
              </dd>
            </div>
          </dl>
        </div>
        <button
          type="button"
          onClick={() => (open ? cancel() : setOpen(true))}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(SECTION_LINK, "self-start sm:self-center")}
        >
          <Pencil className="size-3.5" />
          {open ? "Fermer" : "Modifier"}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] motion-reduce:transition-none",
              open && "rotate-180"
            )}
          />
        </button>
      </div>

      {open && (
        <div id={panelId} className="animate-fade-in border-t">
          <div className="divide-y">
            {/* 1. Affectation */}
            <div className="px-5 py-5">
              <h3 className="text-[13px] font-semibold">Affectation</h3>
              <p className="mt-0.5 text-pretty text-xs text-muted-foreground">
                Le rapport d'expertise reste la référence ; un choix différent doit être motivé.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Service d'accueil" htmlFor={`intern-service-${intern.id}`} required error={errors.service}>
                  <Select
                    id={`intern-service-${intern.id}`}
                    placeholder="Choisir un service"
                    value={serviceId}
                    onChange={(event) => {
                      setServiceId(event.target.value);
                      clear("service");
                    }}
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                        {service.id === topId ? " — recommandé" : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Encadreur" htmlFor={`intern-supervisor-${intern.id}`} required error={errors.supervisor}>
                  <input
                    id={`intern-supervisor-${intern.id}`}
                    className={inputClass}
                    placeholder="Ex. Marie Lukusa"
                    value={supervisor}
                    onChange={(event) => {
                      setSupervisor(event.target.value);
                      clear("supervisor");
                    }}
                  />
                </Field>
                {requiresDecision && (
                  <Field
                    label="Motif de la décision"
                    htmlFor={`intern-reason-${intern.id}`}
                    required={!recommended}
                    error={errors.form}
                    hint={recommended ? "Facultatif : le service choisi fait partie des propositions." : "Requis : le service choisi ne fait pas partie des propositions."}
                    className="sm:col-span-2"
                  >
                    <textarea
                      id={`intern-reason-${intern.id}`}
                      className={textareaClass}
                      placeholder="Ex. Besoin urgent de renfort à la Direction IT ce trimestre."
                      value={reason}
                      onChange={(event) => {
                        setReason(event.target.value);
                        clear("form");
                      }}
                    />
                  </Field>
                )}
              </div>
            </div>

            {/* 2. Période */}
            <div className="px-5 py-5">
              <h3 className="text-[13px] font-semibold">Période de stage</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Date de début" htmlFor={`intern-start-${intern.id}`} required error={errors.start}>
                  <DatePicker
                    id={`intern-start-${intern.id}`}
                    value={start}
                    onChange={(value) => {
                      setStart(value);
                      clear("start");
                    }}
                  />
                </Field>
                <Field label="Date de fin" htmlFor={`intern-end-${intern.id}`} required error={errors.end}>
                  <DatePicker
                    id={`intern-end-${intern.id}`}
                    min={start || undefined}
                    value={end}
                    onChange={(value) => {
                      setEnd(value);
                      clear("end");
                    }}
                  />
                </Field>
              </div>
            </div>

            {/* 3. Missions et objectifs */}
            <div className="px-5 py-5">
              <h3 className="text-[13px] font-semibold">Missions et objectifs</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Field label="Missions" htmlFor={`intern-missions-${intern.id}`}>
                  <textarea
                    id={`intern-missions-${intern.id}`}
                    className={textareaClass}
                    placeholder="Ex. Analyse des dossiers de crédit, visites terrain"
                    value={missions}
                    onChange={(event) => setMissions(event.target.value)}
                  />
                </Field>
                <Field label="Objectifs" htmlFor={`intern-objectives-${intern.id}`}>
                  <textarea
                    id={`intern-objectives-${intern.id}`}
                    className={textareaClass}
                    placeholder="Ex. Maîtriser la grille d'analyse du risque client"
                    value={objectives}
                    onChange={(event) => setObjectives(event.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-3.5 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={cancel}>
              Annuler
            </Button>
            <Button onClick={save}>
              <UserCheck className="mr-2 size-4" /> Enregistrer
            </Button>
          </div>
        </div>
      )}
    </Reveal>
  );
}

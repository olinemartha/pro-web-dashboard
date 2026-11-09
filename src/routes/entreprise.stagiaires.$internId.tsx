import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Check,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Mail,
  Phone,
  Undo2,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AvatarInitials,
  Badge,
  Field,
  SectionLabel,
  inputClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
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
  soumis: "primary",
  valide: "success",
  corrige: "destructive",
};

const reportLabel: Record<ReportStatus, string> = {
  soumis: "Soumis",
  valide: "Validé",
  corrige: "À corriger",
};

const certificateLabel: Record<Intern["certificate"], string> = {
  non_generee: "Non générée",
  generee: "Générée",
  validee: "Validée",
};

const certificateTone: Record<Intern["certificate"], Tone> = {
  non_generee: "muted",
  generee: "primary",
  validee: "success",
};

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
      <div className="card-surface p-8 text-center">
        <h2 className="text-sm font-semibold">Dossier introuvable</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce stagiaire n'existe pas ou son dossier a été supprimé.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/entreprise/stagiaires">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const candidate = candidates.find((entry) => entry.id === intern.candidateId);
  const offer = offers.find((entry) => entry.id === intern.offerId);
  const decision = decisions.find((entry) => entry.internId === intern.id);
  const pendingReports = intern.reports.filter((report) => report.status === "soumis").length;
  const run = latestRunFor(expertRuns, intern.id);

  return (
    <div className="space-y-6">
      <Link
        to="/entreprise/stagiaires"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
      >
        <ArrowLeft className="size-4" /> Tous les stagiaires
      </Link>

      {/* En-tête du dossier */}
      <section className="card-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <AvatarInitials initials={intern.initials} className="size-14 text-lg" />
            <div className="min-w-0">
              <h2 className="text-balance text-lg font-semibold leading-tight tracking-tight">
                {intern.name}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {offer?.title ?? "Offre supprimée"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge label={intern.service} tone="accent" />
                {intern.confirmed ? (
                  <Badge label="Affectation confirmée" tone="success" />
                ) : (
                  <Badge label="Affectation à confirmer" tone="muted" />
                )}
                <Badge
                  label={certificateLabel[intern.certificate]}
                  tone={certificateTone[intern.certificate]}
                />
              </div>
            </div>
          </div>
          {decision && (
            <div className="rounded-lg border border-success/30 bg-success-soft p-3 text-sm sm:max-w-xs">
              <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-success">
                Décision d'affectation
              </p>
              <p className="mt-1 font-medium leading-snug text-success">{decision.service}</p>
              <p className="text-xs leading-relaxed text-success/90">
                {decision.source === "recommandation" ? "Recommandation" : "Décision manuelle"} ·{" "}
                {decision.decidedBy}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-2 rounded-lg bg-muted/50 p-3 text-sm leading-relaxed tabular-nums sm:grid-cols-3">
          <p className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-foreground/70">Début :</span> {fmtDate(intern.start)}
          </p>
          <p className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-foreground/70">Fin :</span> {fmtDate(intern.end)}
          </p>
          <p className="inline-flex items-center gap-2">
            <Users className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-foreground/70">Superviseur :</span>{" "}
            {intern.supervisor || "À désigner"}
          </p>
        </div>

        {candidate && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-relaxed text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3.5" /> {candidate.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="size-3.5" /> {candidate.phone}
            </span>
          </div>
        )}
      </section>

      {/* Sous-navigation ancrée */}
      <nav className="flex flex-wrap gap-2 rounded-lg border bg-background p-2">
        <a
          href="#affectation"
          className="rounded-md px-3 py-1.5 text-xs font-medium leading-4 text-foreground transition-colors hover:bg-muted"
        >
          Affectation
        </a>
        <a
          href="#suivi"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium leading-4 text-foreground transition-colors hover:bg-muted"
        >
          Suivi
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold leading-none tabular-nums text-muted-foreground">
            {pendingReports}
          </span>
        </a>
        <a
          href="#evaluation"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium leading-4 text-foreground transition-colors hover:bg-muted"
        >
          Évaluation
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold leading-none tabular-nums text-muted-foreground">
            {intern.evaluation ? <Check className="size-3" aria-label="faite" /> : "0"}
          </span>
        </a>
        <a
          href="#attestation"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium leading-4 text-foreground transition-colors hover:bg-muted"
        >
          Attestation
        </a>
      </nav>

      <ExpertPanel key={intern.id} intern={intern} />

      <ManualAdjust key={`adjust-${intern.id}`} intern={intern} run={run ?? undefined} />

      {/* Suivi */}
      <section id="suivi" className="card-surface scroll-mt-6 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <SectionLabel>Rapports périodiques</SectionLabel>
          <Badge label={`${pendingReports} à examiner`} tone={pendingReports ? "primary" : "muted"} />
        </div>
        {intern.reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun rapport déposé.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {intern.reports.map((report) => (
              <li key={report.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-primary">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{report.period}</p>
                  <p className="text-xs leading-4 tabular-nums text-muted-foreground">
                    Déposé le {fmtDate(report.date)}
                  </p>
                </div>
                <Badge label={reportLabel[report.status]} tone={reportTone[report.status]} />
                {report.status !== "valide" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReportStatus(intern.id, report.id, "valide");
                      toast.success("Rapport validé", { description: report.period });
                    }}
                  >
                    <CheckCircle2 className="mr-1.5 size-3.5" /> Valider
                  </Button>
                )}
                {report.status === "soumis" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReportStatus(intern.id, report.id, "corrige");
                      toast.success("Rapport retourné pour correction", {
                        description: "Le stagiaire peut déposer une version corrigée.",
                      });
                    }}
                  >
                    <Undo2 className="mr-1.5 size-3.5" /> Retourner
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Évaluation */}
      <EvaluationSection intern={intern} onSave={setEvaluation} />

      {/* Attestation */}
      <section id="attestation" className="card-surface scroll-mt-6 p-5">
        <SectionLabel className="mb-4">Attestation de fin de stage</SectionLabel>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary">
              <Award className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">Attestation — {intern.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                État : {certificateLabel[intern.certificate]} · Générée après validation de
                l'évaluation finale.
              </p>
              {intern.certificate === "validee" && (
                <div className="mt-2">
                  <Stamp
                    label="Attestation validée"
                    detail={
                      intern.certificateValidatedAt
                        ? stampDate(intern.certificateValidatedAt)
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {intern.certificate === "non_generee" && (
              <Button
                size="sm"
                disabled={!intern.evaluation}
                onClick={() => {
                  generateCertificate(intern.id);
                  toast.success("Attestation générée", {
                    description: `${intern.name} — à valider avant remise au stagiaire.`,
                  });
                }}
              >
                <Award className="mr-1.5 size-3.5" /> Générer
              </Button>
            )}
            {intern.certificate === "generee" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.success("Téléchargement de l'attestation", {
                      description: `Attestation_${intern.name}.pdf`,
                    })
                  }
                >
                  <Download className="mr-1.5 size-3.5" /> Télécharger
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    validateCertificate(intern.id);
                    toast.success("Attestation validée et déposée");
                  }}
                >
                  <BadgeCheck className="mr-1.5 size-3.5" /> Valider
                </Button>
              </>
            )}
            {intern.certificate === "validee" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.success("Téléchargement de l'attestation", {
                    description: `Attestation_${intern.name}.pdf`,
                  })
                }
              >
                <Download className="mr-1.5 size-3.5" /> Télécharger
              </Button>
            )}
          </div>
        </div>
        {!intern.evaluation && (
          <p className="mt-3 text-xs text-muted-foreground">
            L'évaluation finale doit être enregistrée avant de générer l'attestation.
          </p>
        )}
      </section>
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
    const value = Number(score);
    if (!score || Number.isNaN(value) || value < 0 || value > 20) {
      setError("Saisissez une note entre 0 et 20.");
      return;
    }
    setError("");
    onSave(intern.id, value, comment.trim());
    toast.success("Évaluation finale enregistrée", {
      description: `${intern.name} — ${value}/20`,
    });
  };

  return (
    <section id="evaluation" className="card-surface scroll-mt-6 p-5">
      <SectionLabel className="mb-1">Évaluation finale</SectionLabel>
      <p className="mb-4 max-w-[68ch] text-pretty text-xs leading-relaxed text-muted-foreground">
        L'évaluation reste une décision humaine de l'entreprise ; StageManager enregistre le
        résultat.
      </p>
      {intern.evaluation && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success-soft p-3">
          <p className="text-sm font-semibold tabular-nums text-success">
            Note enregistrée : {intern.evaluation.score}/20
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-success/90">
            {intern.evaluation.comment || "Aucun commentaire."}
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Field label="Note / 20" htmlFor={`intern-score-${intern.id}`} required error={error}>
          <input
            id={`intern-score-${intern.id}`}
            type="number"
            min={0}
            max={20}
            step={0.5}
            className={inputClass}
            value={score}
            onChange={(event) => setScore(event.target.value)}
          />
        </Field>
        <Field label="Observations" htmlFor={`intern-comment-${intern.id}`}>
          <textarea
            id={`intern-comment-${intern.id}`}
            className={textareaClass}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={save}>
          <ClipboardCheck className="mr-2 size-4" /> Enregistrer l'évaluation
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ajustement manuel                                                   */
/* ------------------------------------------------------------------ */

function ManualAdjust({ intern, run }: { intern: Intern; run?: ReturnType<typeof latestRunFor> }) {
  const { services, updateIntern, validateAssignment } = useCompanyStore();

  const [serviceId, setServiceId] = useState(intern.serviceId ?? "");
  const [supervisor, setSupervisor] = useState(intern.supervisor);
  const [start, setStart] = useState(intern.start);
  const [end, setEnd] = useState(intern.end);
  const [missions, setMissions] = useState(intern.missions);
  const [objectives, setObjectives] = useState(intern.objectives);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const serviceChanged = serviceId !== (intern.serviceId ?? "");
  const requiresDecision = !intern.confirmed || serviceChanged;
  const recommended = isRecommendedService(run, serviceId);

  const save = () => {
    if (!serviceId) {
      setError("Choisissez un service d'affectation.");
      return;
    }
    if (!supervisor.trim() || !start || !end) {
      setError("Service, superviseur et dates sont requis.");
      return;
    }
    if (end < start) {
      setError("La date de fin doit suivre la date de début.");
      return;
    }

    if (requiresDecision) {
      const result = validateAssignment(intern.id, serviceId, reason);
      if (!result.ok) {
        setError(result.error ?? "L'affectation n'a pas pu être validée.");
        return;
      }
    }

    updateIntern(intern.id, {
      supervisor: supervisor.trim(),
      start,
      end,
      missions,
      objectives,
    });
    setError("");
    toast.success("Fiche stagiaire enregistrée", {
      description: requiresDecision ? "Affectation et encadrement mis à jour." : undefined,
    });
  };

  return (
    <details className="card-surface p-5">
      <summary className="cursor-pointer text-sm font-semibold">
        Ajuster manuellement l'affectation et l'encadrement
      </summary>
      <p className="mt-1 text-xs text-muted-foreground">
        Le rapport d'expertise reste la recommandation de référence. Toute décision hors
        recommandation doit être motivée.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Service d'affectation" htmlFor={`intern-service-${intern.id}`} required>
          <select
            id={`intern-service-${intern.id}`}
            className={inputClass}
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
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
        <Field label="Superviseur désigné" htmlFor={`intern-supervisor-${intern.id}`} required>
          <input
            id={`intern-supervisor-${intern.id}`}
            className={inputClass}
            value={supervisor}
            onChange={(event) => setSupervisor(event.target.value)}
          />
        </Field>
        <Field label="Date de début" htmlFor={`intern-start-${intern.id}`} required>
          <input
            id={`intern-start-${intern.id}`}
            type="date"
            className={inputClass}
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </Field>
        <Field label="Date de fin" htmlFor={`intern-end-${intern.id}`} required>
          <input
            id={`intern-end-${intern.id}`}
            type="date"
            className={inputClass}
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </Field>
        <Field label="Missions" htmlFor={`intern-missions-${intern.id}`} className="sm:col-span-2">
          <textarea
            id={`intern-missions-${intern.id}`}
            className={textareaClass}
            value={missions}
            onChange={(event) => setMissions(event.target.value)}
          />
        </Field>
        <Field label="Objectifs" htmlFor={`intern-objectives-${intern.id}`} className="sm:col-span-2">
          <textarea
            id={`intern-objectives-${intern.id}`}
            className={textareaClass}
            value={objectives}
            onChange={(event) => setObjectives(event.target.value)}
          />
        </Field>
        {requiresDecision && (
          <Field
            label="Motif"
            htmlFor={`intern-reason-${intern.id}`}
            required={!recommended}
            hint="Requis si le service choisi ne figure pas parmi les propositions."
            className="sm:col-span-2"
          >
            <textarea
              id={`intern-reason-${intern.id}`}
              className={textareaClass}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
            />
          </Field>
        )}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}

      <div className="mt-4 flex justify-end">
        <Button onClick={save}>
          <UserCheck className="mr-2 size-4" /> Enregistrer la fiche
        </Button>
      </div>
    </details>
  );
}
